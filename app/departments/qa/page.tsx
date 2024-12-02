'use client'; // Mark as a Client Component

import React, {useState} from 'react';
import Link from 'next/link';
import deptStyles from '../departments.module.css';
import qaStyles from './qa.module.css';
import {FileList} from '@/app/Utilities/ListFiles/listFiles'; // Adjust the path accordingly
import {LuCloudLightning} from 'react-icons/lu';
import {FaUserCircle} from 'react-icons/fa';
import {
    uploadFileToStorage,
    updateFirestore,
} from '@/app/Utilities/Upload/uploadUtils'; // Import the utility function
import UploadComponent from '@/app/Utilities/Upload/uploadComponent'; // Import the UploadComponent
import AIButton from '@/app/aiAddon/aiButton';
import SearchBar from '@/app/Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import '@/app/globals.css';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const qaDepartment = () => {
    const styles = {...deptStyles, ...qaStyles};
    // Constants for the companyId and departmentId used for Firestore
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'Eq2IDInbEQB5nI5Ar6Vj'; // Update to the QA department ID
    const MANUDEPTID = 'ti7yNByDOzarVXoujOog';

    // States for uploading files
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [fileListUpdated, setFileListUpdated] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // State for toggling view mode

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file before uploading.');
            return;
        }

        // Define the storage path and Firestore path
        const storagePath = `Company/Departments/QualityAssurance/${file.name}`;
        const downloadURL = await uploadFileToStorage(file, storagePath);
        const firestorePath = {
            collectionType: 'Departments' as const,
            companyId: COMPANYID,
            departmentId: DEPARTMENTID,
            customCollectionName: 'files', // Use the selected collection name
        };

        try {
            // Call the utility function to upload the file and update Firestore
            await updateFirestore(
                firestorePath,
                downloadURL,
                file.name,
                storagePath,
            );
            setUploadStatus('File uploaded successfully!');
            setFile(null); // Reset the file input
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus('Failed to upload file.');
        }
    };

    // Paths for the FileList components
    const deptFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'files',
    ] as [string, ...string[]];

    const inboxFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        MANUDEPTID,
        'records',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            <Header department="Quality Assurance" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    {/* File upload section */}
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="QualityAssurance"
                        collections={['files']}
                        onUploadSuccess={() =>
                            setFileListUpdated(!fileListUpdated)
                        }
                    />
                    <SearchBar
                        paths={[
                            'Eq2IDInbEQB5nI5Ar6Vj',
                            'ti7yNByDOzarVXoujOog/records',
                        ]}
                    />
                </div>

                <div className={styles.files}>
                    <div className={styles.fileSection}>
                        <FileTitle title="Department Files" />
                        <div className={styles.fileBox}>
                            <FileList
                                collectionPath={deptFilesPath}
                                title=""
                                display="grid"
                                refreshTrigger={fileListUpdated}
                                enableShare={true}
                            />
                        </div>
                    </div>
                    <div className={styles.fileSection}>
                        <FileTitle title="Inbox" />
                        <div className={styles.fileBox}>
                            <FileList
                                collectionPath={inboxFilesPath}
                                title=""
                                refreshTrigger={fileListUpdated}
                            />
                        </div>
                    </div>
                </div>
                <AIButton
                    paths={[
                        'Eq2IDInbEQB5nI5Ar6Vj',
                        'ti7yNByDOzarVXoujOog/records',
                    ]}
                />
            </div>
        </div>
    );
};

export default qaDepartment;
