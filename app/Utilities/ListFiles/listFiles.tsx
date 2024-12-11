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
import FileCard from './fileCard';
import ShareFileModal from '../ShareFiles/shareFile';
import { getEmployeeProfile } from '@/app/authentication';
import { FaList, FaTh, FaTrashAlt, FaSortAmountUp, FaSortAmountDown} from 'react-icons/fa';

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.js';

export const FileList: React.FC<FileListProps & { horizontal?: boolean }> = ({
    collectionPath,
    title,
    initialDisplay = 'list' as const,
    refreshTrigger,
    enableShare = false,
    onListUpdate
}) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
    const [sortField, setSortField] = useState<string>('File Name');
    const [sortDirection, setSortDirection] = useState<string>('/images/asc.png');
    const [isAscending, setIsAscending] = useState<boolean>(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [display, setDisplay] = useState<'list' | 'grid' | 'horizontal'>(initialDisplay);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
        /**
         * fetchAdmins
         * 
         * @param {void} None
         * @returns {Function | null} - Returns a function to unsubscribe from the authentication state
         * observer or null in case of an error.
         * 
         * Description: Checks if the currently authenticated user is an admin in a specific company,
         * retrieves the user's profile and admin data, and updates the admin status.
         */
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
                            setIsAdmin(isEmployeeAdmin);
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

    /**
     * fetchFiles
     * 
     * @param {void} None
     * @returns {void} - Does not return a value. Fetches files from Firestore and updates the state
     * variables with the fetched and filtered files.
     * 
     * Description: Fetches a collection of files from Firestore, processes the data, and updates the
     * state with the fetched files and their filtered view.
     */
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

    useEffect(() => {
        fetchFiles();
    }, [collectionPath, title, refreshTrigger]);

    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = files.filter(file =>
            file.fileName.toLowerCase().includes(lowerCaseQuery),
        );
        setFilteredFiles(filtered);
    }, [searchQuery, files]);

    /**
     * handleSortFieldClick
     * 
     * @param {string} field - The field by which to sort the files.
     * @returns {void} - Does not return a value. Updates the sort field and triggers the file sorting.
     * 
     * Handles the click event for selecting a sort field, updates the sort field state, and triggers 
     * sorting of files based on the selected field.
     */
    const handleSortFieldClick = (field: string) => {
        if (sortField != field) {
            setIsAscending(true);
        }

        setSortField(field);
        sortFiles(field as keyof FileData);
    };

    /**
     * sortFiles
     * 
     * @param {keyof FileData} field - The field by which to sort the files (e.g., 'uploadTimeStamp', 'userDisplayName').
     * @returns {void} - Does not return a value. Sorts the filtered files array based on the specified field and updates
     * the state with the sorted files.
     * 
     * Sorts the filtered files array based on the specified field, considering ascending or descending order,
     * and updates the state with the sorted files and sort direction.
     */
    const sortFiles = (field: keyof FileData): void => {
        const sortedFiles = [...filteredFiles];

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

    /**
     * processFiles
     * 
     * @param {any} querySnapshot - A Firestore query snapshot containing file document data.
     * @returns {Promise<FileData[]>} - A promise resolving to an array of processed file data objects.
     * 
     * Processes a Firestore query snapshot to extract file details, generates thumbnails for
     * files where applicable, retrieves download URLs, and returns an array of structured file data.
     */
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
                    // Image in the database as backup thumbnail if generation fails
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

    /**
     * generatePDFThumbnail
     * 
     * @param {string} pdfUrl - The URL of the PDF file.
     * @returns {Promise<string>} - A promise resolving to a data URL representing the generated thumbnail image.
     * 
     * Description: Generates a thumbnail image of the first page of a PDF document by rendering it on a canvas and
     * returning its data URL.
     */
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

    /**
     * handleFileSelect
     * 
     * @param {string} fileId - The ID of the file to select or deselect.
     * @returns {void} - Does not return a value. Updates the selected files state based on the file
     * selection.
     * 
     * Toggles the selection of a file by its ID and updates the state with the new set of selected files.
     */
    const handleFileSelect = (fileId: string) => {
        const newSelectedFiles = new Set(selectedFiles);
        if (newSelectedFiles.has(fileId)) {
            newSelectedFiles.delete(fileId);
        } else {
            newSelectedFiles.add(fileId);
        }
        setSelectedFiles(newSelectedFiles);
    };

    /**
     * handleDelete
     * 
     * @param {string} [fileId] - (Optional) The ID of a specific file to delete. If not provided,
     * deletes all selected files.
     * 
     * @returns {void} - Does not return a value. Performs file deletion and updates state accordingly.
     * 
     * Deletes specified or selected files that the current user has permission to delete.
     * Prompts for confirmation before deletion and updates the application state after completing the operation.
     */
    const handleDelete = async (fileId?: string) => {
        const deletableFiles = fileId ? [fileId] :
            Array.from(selectedFiles).filter(id =>
                files.find(
                    file => file.id === id && (file.uploadedBy === currentUserUid || isAdmin),
                ),
            );

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

                            fetchFiles();
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

    /**
     * 
     * @returns
     */
    const openShareModal = () => {
        if (selectedFiles.size === 0) {
            alert('No files selected for sharing.');
            return;
        }
        setIsShareModalOpen(true);
    };

    return (
        <div className={styles.fileList}>
            <div className={styles.topButtons}>
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
                    <FaTrashAlt />
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
                            source={firestorePath}
                            filesToShare={
                                Array.from(selectedFiles)
                                    .map(fileId => files.find(file => file.id === fileId))
                                    .filter(Boolean) as FileData[]
                            }
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                            buttonRef={buttonRef}
                            onOperationComplete={onListUpdate}
                        />
                    </>
                )}

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
                </div>

                <input
                    className={styles.search}
                    type="text"
                    placeholder="Filter files.."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {display === 'grid' ? (
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
                                    className={`${styles.sortableHeader} ${sortDirection ? styles.showImg : ''}`}
                                    onClick={() =>
                                        handleSortFieldClick(
                                            'fileName',
                                        )
                                    }
                                >
                                    File Name
                                    <div
                                        hidden={!(sortField == "fileName")}
                                    >
                                        {isAscending ?
                                            <FaSortAmountDown /> :
                                            <FaSortAmountUp />
                                            
                                        }
                                    </div>
                                </a>
                            </th>
                            <th>
                                <a
                                    className={`${styles.sortableHeader} ${sortDirection ? styles.showImg : ''}`}
                                    onClick={() =>
                                        handleSortFieldClick(
                                            'userDisplayName',
                                        )
                                    }
                                >
                                    Owner
                                    <div
                                        hidden={!(sortField == "userDisplayName")}
                                    >
                                        {isAscending ?
                                            <FaSortAmountDown /> :
                                            <FaSortAmountUp />
                                        }
                                    </div>
                                </a>
                            </th>
                            <th>
                                <a
                                    className={`${styles.sortableHeader} ${sortDirection ? styles.showImg : ''}`}
                                    onClick={() =>
                                        handleSortFieldClick(
                                            'uploadTimeStamp',
                                        )
                                    }
                                >
                                    Upload Date{' '}
                                    <div
                                        hidden={!(sortField == "uploadTimeStamp")}
                                    >
                                        {isAscending ?
                                            <FaSortAmountDown /> :
                                            <FaSortAmountUp />
                                        }
                                    </div>
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
                                        onClick={e => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        {(currentUserUid === file.uploadedBy || isAdmin)&& (
                                            <button
                                                className={styles.deleteButton}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDelete(file.id);
                                                }}
                                            >
                                                <span className={styles.trashIcon}>
                                                    <FaTrashAlt />
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
