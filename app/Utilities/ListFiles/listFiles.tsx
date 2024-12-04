// listFiles.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, Timestamp, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebaseClient';
import { FileData, FileListProps, FirestorePath } from '../../types';
import { handleFileDelete } from '../Upload/uploadUtils';
import * as pdfjsLib from 'pdfjs-dist';
import styles from './listFiles.module.css';
import { onAuthStateChanged } from 'firebase/auth';
import { MdDelete } from 'react-icons/md';
import FileCard from './fileCard';
import ShareFileModal from '../ShareFiles/shareFile';
import DropdownMenu from '../DropDownMenu/dropdownMenu';
import { getEmployeeProfile } from '@/app/authentication';
import { FaList, FaTh, FaGripLines } from 'react-icons/fa';

import { F } from '@genkit-ai/flow/lib/flow-DR52DKjZ';

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.js';

export const FileList: React.FC<FileListProps & { horizontal?: boolean }> = ({
    collectionPath,
    title,
    onSearch,
    onFileSelect,
    initialDisplay = 'list' as const,
    refreshTrigger,
    enableShare = false
}) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
    const [sortField, setSortField] = useState<string>('File Name');
    const [sortedFiles, setSortedFiles] = useState<FileData[]>([]);
    const [sortDirection, setSortDirection] = useState<string>('/images/asc.png');
    const [isAscending, setIsAscending] = useState<boolean>(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false); // New state for admin status
    const [display, setDisplay] = useState<'list' | 'grid' | 'horizontal'>(initialDisplay); // New state for view mode

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
        const fetchAdmins = async () => {
            try {
                const unsubscribe = auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        const employeeProfile = await getEmployeeProfile(user.uid);
                        const employeeName = employeeProfile?.name;
                        console.log("Signed-in employee name:", employeeName);

                        const companyDocRef = doc(db, "Company", "mh3VZ5IrZjubXUCZL381");
                        const companyDocSnap = await getDoc(companyDocRef);

                        if (companyDocSnap.exists()) {
                            const companyData = companyDocSnap.data();
                            const admins: DocumentReference[] = companyData?.admins || [];

                            const adminNames = await Promise.all(
                                admins.map(async (ref: DocumentReference) => {
                                    const adminSnap = await getDoc(ref);
                                    return adminSnap.exists() ? adminSnap.data()?.name : null;
                                })
                            );

                            console.log("Admin Names:", adminNames);

                            const isEmployeeAdmin = adminNames.includes(employeeName);
                            setIsAdmin(isEmployeeAdmin); // Update admin status
                            console.log(
                                isEmployeeAdmin
                                    ? "Employee is an admin."
                                    : "Employee is NOT an admin."
                            );
                        }
                    }
                });

                return unsubscribe;
            } catch (error) {
                console.error("Error fetching admins:", error);
                return null;
            }
        };

        fetchAdmins();
    }, []);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const filesCollectionRef = collection(db, ...collectionPath);
                const querySnapshot = await getDocs(filesCollectionRef);
                const filesData = await processFiles(querySnapshot);

                setFiles(filesData);
                setFilteredFiles(filesData);
            } catch (error) {
                console.error(`Error fetching files for ${title}:`, error);
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
                    comparison =
                        sortedFiles[index][field].toDate() >
                            file[field].toDate()
                            ? 1
                            : -1;
                } else if (field === 'userDisplayName') {
                    const currentUser = auth.currentUser?.displayName;
                    if (!currentUser) {
                        console.error('No user signed in');
                        return;
                    }
                    if (
                        sortedFiles[index].userDisplayName !== currentUser &&
                        file.userDisplayName === currentUser
                    ) {
                        comparison = 1;
                    } else if (
                        sortedFiles[index].userDisplayName === currentUser &&
                        file.userDisplayName === currentUser
                    ) {
                        comparison = sortedFiles[
                            index
                        ].userDisplayName.localeCompare(file.userDisplayName);
                    } else if (
                        sortedFiles[index].userDisplayName !== currentUser &&
                        file.userDisplayName !== currentUser
                    ) {
                        comparison = sortedFiles[
                            index
                        ].userDisplayName.localeCompare(file.userDisplayName);
                    }
                } else {
                    comparison =
                        sortedFiles[index][field] > file[field] ? 1 : -1;
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
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
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

    useEffect(() => {
        const updateScrollButtons = () => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } =
                    scrollRef.current;

                setShowLeftButton(scrollLeft > 0);
                setShowRightButton(scrollLeft + clientWidth < scrollWidth);
            }
        };

        // Check initial button visibility
        updateScrollButtons();

        // Attach scroll event listener
        const ref = scrollRef.current;
        ref?.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);

        // Cleanup event listener
        return () => {
            ref?.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [filteredFiles]);

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

    const handleDelete = async (fileId?: string) => {
        const deletableFiles = fileId ? [fileId] :
            Array.from(selectedFiles).filter(id =>
                files.find(
                    file => file.id === id && (file.uploadedBy === currentUserUid || isAdmin),
                ),
            );


        const firestorePath: FirestorePath = {
            collectionType:
                collectionPath[2] == "Buyers" ? "Buyers" :
                    collectionPath[2] == "Manufacturers" ? "Manufacturers" :
                        "Departments",
            companyId: collectionPath[1],
            departmentId: collectionPath[2] == "Departments" ? collectionPath[3] : undefined,
            buyerId: collectionPath[2] == "Buyers" ? collectionPath[3] : undefined,
            manufacturerId: collectionPath[2] == "Manufacturers" ? collectionPath[3] : undefined,
            collectionName: collectionPath[4]
        }

        if (deletableFiles.length > 0) {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete ${deletableFiles.length} file(s)?`,
            );

            if (confirmDelete) {
                try {
                    for (const id of deletableFiles) {
                        const file = files.find(file => file.id === id);
                        if (file) {
                            console.log(firestorePath);
                            await handleFileDelete(
                                file.filePath,
                                firestorePath,
                            );

                            setFiles(prevFiles =>
                                prevFiles.filter(f => f.id !== file.id),
                            );
                            setFilteredFiles(prevFiles =>
                                prevFiles.filter(f => f.id !== file.id),
                            );
                            setSelectedFiles(prevSelected => {
                                const newSelected = new Set(prevSelected);
                                newSelected.delete(id);
                                return newSelected;
                            });
                        }
                    }
                    alert('Files deleted successfully.');
                } catch (error) {
                    console.error('Error deleting files:', error);
                    alert('Failed to delete some files.');
                }
            }
        }
    };

    const openShareModal = () => {
        if (selectedFiles.size === 0) {
            alert('No files selected for sharing.');
            return;
        }
        setIsShareModalOpen(true);
    };

    return (
        <div className={styles.fileList}>
            <h2>{title}</h2>

            <div className={styles.topButtons}>
                {/* Top Delete Button */}
                <button
                    className={styles.deleteButtonTop}
                    onClick={async () => {
                        handleDelete();
                    }}
                    disabled={
                        !(
                            selectedFiles.size > 0 &&
                            Array.from(selectedFiles).every(id =>
                                files.find(
                                    file => file.id === id && (file.uploadedBy === currentUserUid || isAdmin),
                                ),
                            )
                        )
                    }
                >
                    <MdDelete />
                </button>

                {enableShare && (
                    <>
                        <button
                            className={styles.shareButton}
                            onClick={openShareModal}
                            disabled={
                                !(
                                    selectedFiles.size > 0 &&
                                    Array.from(selectedFiles).every(id =>
                                        files.find(
                                            file => file.id === id && (file.uploadedBy === currentUserUid || isAdmin),
                                        ),
                                    )
                                )
                            }
                            ref={buttonRef}
                        >
                            Share
                        </button>
                        <ShareFileModal
                            companyId={collectionPath[1]}
                            filesToShare={
                                Array.from(selectedFiles)
                                    .map(fileId => files.find(file => file.id === fileId))
                                    .filter(Boolean) as FileData[]
                            } // Pass the selected files as an array
                            departmentId={collectionPath[3] || ""}
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                            buttonRef={buttonRef}
                        />
                    </>
                )}

                {/* View Mode Toggle Buttons */}
                <div className={styles.viewToggleButtons}>
                    <button
                        className={`${styles.viewButton} ${display === 'list' ? styles.activeView : ''}`}
                        onClick={() => setDisplay('list')}
                        disabled={display === 'list'}
                    >
                        <FaList />
                    </button>
                    <button
                        className={`${styles.viewButton} ${display === 'grid' ? styles.activeView : ''}`}
                        onClick={() => setDisplay('grid')}
                        disabled={display === 'grid'}
                    >
                        <FaTh />
                    </button>
                    {/* <button
                        className={`${styles.viewButton} ${display === 'horizontal' ? styles.activeView : ''}`}
                        onClick={() => setDisplay('horizontal')}
                        disabled={display === 'horizontal'}
                    >
                        <FaGripLines />
                    </button> */}
                </div>

                <input
                    className={styles.search}
                    type="text"
                    placeholder="Filter files.."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {display === 'horizontal' ? (
                <div className={styles.scrollContainer}>
                    {/* Left Button */}
                    {showLeftButton && (
                        <button
                            className={`${styles.scrollButton} ${styles.left}`}
                            onClick={() => handleScroll('left')}
                        >
                            &larr;
                        </button>
                    )}

                    <div className={styles.fileItemsHorizontal} ref={scrollRef}>
                        {filteredFiles.length === 0 ? (
                            <p>No files available.</p>
                        ) : (
                            filteredFiles.map(file => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    isSelected={selectedFiles.has(file.id)}
                                    currentUserUid={currentUserUid}
                                    onSelect={handleFileSelect}
                                />
                            ))
                        )}
                    </div>

                    {/* Right Button */}
                    {showRightButton && (
                        <button
                            className={`${styles.scrollButton} ${styles.right}`}
                            onClick={() => handleScroll('right')}
                        >
                            &rarr;
                        </button>
                    )}
                </div>
            ) : display === 'grid' ? (
                <div className={styles.fileGrid}>
                    {filteredFiles.length === 0 ? (
                        <p>No files available.</p>
                    ) : (
                        filteredFiles.map(file => (
                            <FileCard
                                key={file.id}
                                file={file}
                                isSelected={selectedFiles.has(file.id)}
                                currentUserUid={currentUserUid}
                                onSelect={handleFileSelect}
                            />
                        ))
                    )}
                </div>
            ) : (
                <table className={styles.fileTable}>
                    <thead>
                        <tr>
                            <th>
                                <a
                                    className="sortable-header"
                                    onClick={() =>
                                        handleSortFieldClick(
                                            'file-name',
                                            'fileName',
                                        )
                                    }
                                >
                                    File Name{' '}
                                    <img
                                        id="file-name-a-d-img"
                                        className={styles.ascDesImg}
                                        src={sortDirection}
                                        hidden={true}
                                    ></img>
                                </a>
                            </th>
                            <th>
                                <a
                                    className="sortable-header"
                                    onClick={() =>
                                        handleSortFieldClick(
                                            'owner',
                                            'userDisplayName',
                                        )
                                    }
                                >
                                    Owner{' '}
                                    <img
                                        id="owner-a-d-img"
                                        className={styles.ascDesImg}
                                        src={sortDirection}
                                        hidden={true}
                                    ></img>
                                </a>
                            </th>
                            <th>
                                <a
                                    className="sortable-header"
                                    onClick={() =>
                                        handleSortFieldClick(
                                            'time',
                                            'uploadTimeStamp',
                                        )
                                    }
                                >
                                    Upload Date{' '}
                                    <img
                                        id="time-a-d-img"
                                        className={styles.ascDesImg}
                                        src={sortDirection}
                                        hidden={true}
                                    ></img>
                                </a>
                            </th>
                            <th></th>
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
                                    className={`${styles.fileRow} ${selectedFiles.has(file.id)
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
                                    <td className={styles.fileCell}>
                                        <div
                                            className={`${styles.fileNameBox} ${selectedFiles.has(file.id)
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
                                                    handleDelete(file.id);
                                                }}
                                            >
                                                <span className="trashIcon">
                                                    <MdDelete />
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
