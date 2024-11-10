// listFiles.tsx

'use client';

import React, {useState, useEffect, useRef} from 'react';
import {collection, getDocs, Timestamp} from 'firebase/firestore';
import {getDownloadURL, ref} from 'firebase/storage';
import {db, storage, auth} from '@/lib/firebaseClient';
import {FileData, FileListProps} from '../types';
import {handleFileDelete} from './uploadUtils';
import * as pdfjsLib from 'pdfjs-dist';
import styles from './listFiles.module.css';
import {onAuthStateChanged} from 'firebase/auth';
import { s } from '@genkit-ai/core/lib/action-CnIb9v86';

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.js';

export const FileList: React.FC<FileListProps & {horizontal?: boolean}> = ({
    collectionPath,
    title,
    onSearch,
    onFileSelect,
    display = 'list' as const,
    refreshTrigger,
}) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
    const [sortField, setSortField] = useState<string>('File Name');
    const [sortedFiles, setSortedFiles] = useState<FileData[]>([]);
    const [sortDirection, setSortDirection] = useState<string>('/images/asc.png');
    const [isAscending, setIsAscending] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setCurrentUserUid(user.uid);
            } else {
                setCurrentUserUid(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchFiles = async () => {
            setLoading(true);
            try {
                const filesCollectionRef = collection(db, ...collectionPath);
                const querySnapshot = await getDocs(filesCollectionRef);
                const filesData = await processFiles(querySnapshot);

                setFiles(filesData);
                setFilteredFiles(filesData);
                setLoading(false);
            } catch (error) {
                console.error(`Error fetching files for ${title}:`, error);
                setError(`Failed to load ${title.toLowerCase()}.`);
                setLoading(false);
            }
        };

        fetchFiles();
    }, [collectionPath, title, refreshTrigger]);

    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = files.filter(file =>
            file.fileName.toLowerCase().includes(lowerCaseQuery),
        );
        setFilteredFiles(filtered);
    }, [searchQuery, files]);

    const handleSortFieldClick = (selection: string, field: string) => {
        if (sortField != field) {
            setIsAscending(true);
        }
        const imageIds = ['file-name-a-d-img', 'owner-a-d-img', 'time-a-d-img'];
    
        imageIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id.startsWith(selection)) {
                    element.removeAttribute('hidden');
                } else {
                    element.setAttribute('hidden', '');
                }
            }
        });
    
        setSortField(field);
        sortFiles(field as keyof FileData);
    };

    const sortFiles = (field: keyof FileData) => {
        const sortedFiles = [...filteredFiles];
        //const isAscending = sortDirection === '/images/asc.png';

        for (let i = 1; i < sortedFiles.length; i++) {
            let file = sortedFiles[i];
            let index = i - 1;

            while (index >= 0) {
                let comparison = 0;

                if (field === 'uploadTimeStamp') {
                    comparison = sortedFiles[index][field].toDate() > file[field].toDate() ? 1 : -1;
                } else if (field === 'userDisplayName') {
                    const currentUser = auth.currentUser?.displayName;
                    if (!currentUser) {
                        console.error('No user signed in');
                        return;
                    }
                    if (sortedFiles[index].userDisplayName !== currentUser && file.userDisplayName === currentUser) {
                        comparison = 1;
                    } else if (sortedFiles[index].userDisplayName === currentUser && file.userDisplayName === currentUser) {
                        comparison = sortedFiles[index].userDisplayName.localeCompare(file.userDisplayName);
                    } else if (sortedFiles[index].userDisplayName !== currentUser && file.userDisplayName !== currentUser) {
                        comparison = sortedFiles[index].userDisplayName.localeCompare(file.userDisplayName);
                    }
                } else {
                    comparison = sortedFiles[index][field] > file[field] ? 1 : -1;
                }

                if (isAscending ? comparison > 0 : comparison < 0) {
                    sortedFiles[index + 1] = sortedFiles[index];
                    index -= 1;
                } else {
                    break;
                }
            }
            sortedFiles[index + 1] = file;
        }
        setIsAscending(!isAscending);
        setFilteredFiles(sortedFiles);
        setSortDirection(isAscending ? '/images/asc.png' : '/images/des.png');
    };

    const processFiles = async (querySnapshot: any): Promise<FileData[]> => {
        const filesPromises = querySnapshot.docs.map(async (doc: any) => {
            const fileData = doc.data();

            const tags = fileData.tags || [];
            const uploadTimeStamp = fileData.uploadTimeStamp;
            const userDisplayName = fileData.userDisplayName;
            const uploadedBy = fileData.uploadedBy;

            const fileName = fileData.fileName;
            const filePath = fileData.filePath;

            const fileRef = ref(storage, filePath);
            const downloadURL = await getDownloadURL(fileRef);

            let thumbnail = '';

            if (fileName.endsWith('.pdf')) {
                try {
                    thumbnail = await generatePDFThumbnail(downloadURL);
                } catch (error) {
                    console.error('Error generating PDF thumbnail:', error);
                    thumbnail =
                        'https://firebasestorage.googleapis.com/v0/b/datum-115a.appspot.com/o/pdf_thumbnail.png?alt=media&token=762f3694-9262-4c48-962d-9718245d80c4';
                }
            } else if (fileName.match(/\.(jpeg|jpg|png)$/i)) {
                thumbnail = downloadURL;
            }

            return {
                id: doc.id,
                fileName: fileName,
                download: downloadURL,
                filePath: filePath,
                thumbnail: thumbnail || downloadURL,
                tags: tags,
                uploadTimeStamp: uploadTimeStamp,
                uploadedBy: uploadedBy,
                userDisplayName: userDisplayName,
            };
        });

        return await Promise.all(filesPromises);
    };

    const generatePDFThumbnail = async (pdfUrl: string): Promise<string> => {
        const pdf = await pdfjsLib.getDocument({url: pdfUrl}).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({scale: 0.5});
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) throw new Error('Canvas context is not available');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        return canvas.toDataURL();
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -200 : 200;
            scrollRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const handleFileSelect = (fileId: string) => {
        const newSelectedFiles = new Set(selectedFiles);
        if (newSelectedFiles.has(fileId)) {
            newSelectedFiles.delete(fileId);
        } else {
            newSelectedFiles.add(fileId);
        }
        setSelectedFiles(newSelectedFiles);
        if (onFileSelect) onFileSelect(fileId);
    };

    const handleDelete = async (file: FileData) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${file.fileName}?`,
        );
        if (!confirmDelete) return;

        try {
            await handleFileDelete(file.filePath, {
                collectionType: 'Departments',
                companyId: collectionPath[1],
                departmentId: collectionPath[3],
                collectionName: collectionPath[4],
            });

            // After deletion, refresh the file list
            setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
            setFilteredFiles(prevFiles =>
                prevFiles.filter(f => f.id !== file.id),
            );
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Failed to delete the file.');
        }
    };

    return (
        <div className={styles.fileList}>
            <h2>{title}</h2>

            {onSearch && (
                <input
                    type="text"
                    placeholder="Search files by name"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{marginBottom: '10px'}}
                />
            )}

            {display === 'horizontal' ? (
                <div className={styles.scrollContainer}>
                    <button
                        className={`${styles.scrollButton} ${styles.left}`}
                        onClick={() => handleScroll('left')}
                    >
                        &larr;
                    </button>
                    <button
                        className={`${styles.scrollButton} ${styles.right}`}
                        onClick={() => handleScroll('right')}
                    >
                        &rarr;
                    </button>

                    <div className={styles.fileItemsHorizontal} ref={scrollRef}>
                        {filteredFiles.length === 0 ? (
                            <p>No files available.</p>
                        ) : (
                            filteredFiles.map(file => (
                                <div
                                    key={file.id}
                                    className={`${styles.fileItem} ${
                                        selectedFiles.has(file.id)
                                            ? styles.selected
                                            : ''
                                    }`}
                                    onClick={e => {
                                        if (
                                            !(e.target as HTMLElement).closest(
                                                `.${styles.fileCheckboxThumbnail}`,
                                            )
                                        ) {
                                            handleFileSelect(file.id);
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        className={styles.fileCheckboxThumbnail}
                                        onChange={() =>
                                            handleFileSelect(file.id)
                                        }
                                        checked={selectedFiles.has(file.id)}
                                    />
                                    <img
                                        src={file.thumbnail}
                                        alt={file.fileName}
                                        className={styles.fileThumbnail}
                                        onClick={e => {
                                            e.stopPropagation();
                                            window.open(
                                                file.download,
                                                '_blank',
                                            );
                                        }}
                                    />
                                    <p className={styles.fileName}>
                                        {file.fileName}
                                    </p>
                                    {currentUserUid === file.uploadedBy && (
                                        <button
                                            className={styles.deleteButton}
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDelete(file);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : display === 'grid' ? (
                <div className={styles.fileGrid}>
                    {filteredFiles.length === 0 ? (
                        <p>No files available.</p>
                    ) : (
                        filteredFiles.map(file => (
                            <div
                                key={file.id}
                                className={`${styles.fileItem} ${
                                    selectedFiles.has(file.id)
                                        ? styles.selected
                                        : ''
                                }`}
                                onClick={e => {
                                    if (
                                        !(e.target as HTMLElement).closest(
                                            `.${styles.fileCheckboxThumbnail}`,
                                        )
                                    ) {
                                        handleFileSelect(file.id);
                                    }
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className={styles.fileCheckboxThumbnail}
                                    onChange={() => handleFileSelect(file.id)}
                                    checked={selectedFiles.has(file.id)}
                                />
                                <img
                                    src={file.thumbnail}
                                    alt={file.fileName}
                                    className={styles.fileThumbnail}
                                    onClick={e => {
                                        e.stopPropagation();
                                        window.open(file.download, '_blank');
                                    }}
                                />
                                <p className={styles.fileName}>
                                    {file.fileName}
                                </p>
                                {currentUserUid === file.uploadedBy && (
                                    <button
                                        className={styles.deleteButton}
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDelete(file);
                                        }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <table className={styles.fileTable}>
                    <thead>
                        <tr>
                            <th></th> {/* Checkbox column */}
                            <th>
                                <a
                                    className="sortable-header"
                                    onClick={() => handleSortFieldClick('file-name','fileName')}
                                >
                                    File Name <img id="file-name-a-d-img" className={styles.ascDesImg} src={sortDirection} hidden={true}></img>
                                </a>
                            </th>
                            <th>
                                <a
                                    className="sortable-header"
                                    onClick={() => handleSortFieldClick('owner','userDisplayName')}
                                >
                                    Owner <img id="owner-a-d-img" className={styles.ascDesImg} src={sortDirection} hidden={true}></img>
                                </a>
                            </th>
                            <th>
                                <a
                                    className="sortable-header"
                                    onClick={() => handleSortFieldClick('time','uploadTimeStamp')}
                                >
                                    Upload Date <img id="time-a-d-img" className={styles.ascDesImg} src={sortDirection} hidden={true}></img>
                                </a>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFiles.length === 0 ? (
                            <tr>
                                <td colSpan={5}>No files available.</td>
                            </tr>
                        ) : (
                            filteredFiles.map(file => (
                                <tr
                                    key={file.id}
                                    className={`${styles.fileRow} ${
                                        selectedFiles.has(file.id)
                                            ? styles.selected
                                            : ''
                                    }`}
                                    onClick={e => {
                                        if (
                                            !(e.target as HTMLElement).closest(
                                                `.${styles.fileCell} ${styles.checkbox}`,
                                            )
                                        ) {
                                            handleFileSelect(file.id);
                                        }
                                    }}
                                >
                                    <td
                                        className={`${styles.fileCell} ${styles.checkbox}`}
                                    >
                                        <input
                                            type="checkbox"
                                            onChange={() =>
                                                handleFileSelect(file.id)
                                            }
                                            checked={selectedFiles.has(file.id)}
                                        />
                                    </td>
                                    <td className={styles.fileCell}>
                                        <div
                                            className={`${styles.fileNameBox} ${
                                                selectedFiles.has(file.id)
                                                    ? styles.selected
                                                    : ''
                                            }`}
                                            onClick={e => {
                                                e.stopPropagation();
                                                window.open(
                                                    file.download,
                                                    '_blank',
                                                );
                                            }}
                                        >
                                            {file.fileName}
                                        </div>
                                    </td>
                                    <td
                                        className={`${styles.fileCell} ${styles.userDisplayName}`}
                                    >
                                        {file.userDisplayName
                                            ? file.userDisplayName
                                            : 'N/A'}
                                    </td>
                                    <td
                                        className={`${styles.fileCell} ${styles.uploadTimeStamp}`}
                                    >
                                        {file.uploadTimeStamp
                                            ? file.uploadTimeStamp
                                                  .toDate()
                                                  .toLocaleString()
                                            : 'N/A'}
                                    </td>
                                    <td
                                        className={`${styles.fileCell} ${styles.actions}`}
                                    >
                                        {currentUserUid === file.uploadedBy && (
                                            <button
                                                className={styles.deleteButton}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDelete(file);
                                                }}
                                            >
                                                <span
                                                    className={styles.trashIcon}
                                                >
                                                    🗑
                                                </span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};
