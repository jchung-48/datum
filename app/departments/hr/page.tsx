'use client'; // Mark as a Client Component

import React, {useState} from 'react';
import Link from 'next/link';
//import './styles.css'; // Ensure this import is correct
import {FileList} from '@/app/Utilities/ListFiles/listFiles'; // Adjust path if needed
import {
    uploadFileToStorage,
    updateFirestore,
} from '@/app/Utilities/Upload/uploadUtils';
import UploadComponent from '@/app/Utilities/Upload/uploadComponent';
import AIButton from '@/app/aiAddon/aiButton';
import SearchBar from '@/app/Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import deptStyles from '../departments.module.css';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const hrDepartment: React.FC = () => {
    const styles = {...deptStyles};
    // Constants for the companyId and departmentId used for Firestore
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'NpaV1QtwGZ2MDNOGAlXa'; // Correct HR department ID

    // States for uploading files
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [selectedCollection, setSelectedCollection] = useState('files');
    const [fileListUpdated, setFileListUpdated] = useState(false);

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
        const storagePath = `Company/Departments/HumanResources/${file.name}`;
        const downloadURL = await uploadFileToStorage(file, storagePath);
        const firestorePath = {
            collectionType: 'Departments' as const,
            companyId: COMPANYID,
            departmentId: DEPARTMENTID,
            customCollectionName: selectedCollection,
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

    const updateLists = () => {
        setFileListUpdated(prev => !prev)
    }

    // Paths for the FileList components
    const deptFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'files',
    ] as [string, ...string[]];

    const incidentFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'incident',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            <Header department="Human Resources" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="HumanResources"
                        collections={['files', 'incident']}
                        onUploadSuccess={updateLists}
                    />
                    <div className={styles.search}>
                        <SearchBar paths={['NpaV1QtwGZ2MDNOGAlXa']} />
                    </div>
                </div>
                <div className={styles.files}>
                    <FileTitle title="Department Files" />
                    <FileList
                        collectionPath={deptFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                    <FileTitle title="Incident Files" />
                    <FileList
                        collectionPath={incidentFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                </div>
                <div className={styles.aiFeatures}>
                    <AIButton paths={['NpaV1QtwGZ2MDNOGAlXa']} />
                </div>
            </div>
        </div>
    );
};

export default hrDepartment;

{
    /* <div className="header">
        <Link href="/home">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Human Resources!</h1>
        <p>These are the HR files.</p>
        <UploadComponent
          companyId={COMPANYID}
          departmentId={DEPARTMENTID}
          departmentName="HumanResources"
          collections={['files', 'incident']}
          onUploadSuccess={() => setFileListUpdated(prev => !prev)}/>
        <SearchBar paths= {['NpaV1QtwGZ2MDNOGAlXa']}/>

      <div className="files">
        <div className="file-title">Department Files</div>
        <FileList collectionPath={deptFilesPath} title="" onSearch={() => {}} onFileSelect={handleFileSelect} horizontal refreshTrigger={fileListUpdated} />
        <div className="file-title">Incident Files</div>
        <FileList collectionPath={incidentFilesPath} title="" onSearch={() => {}} onFileSelect={handleFileSelect} horizontal refreshTrigger={fileListUpdated} />
      </div>
    </div> */
}
