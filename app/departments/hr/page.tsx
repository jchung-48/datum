"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
//import './styles.css'; // Ensure this import is correct
import { FileList } from '../Utilities/ListFiles/listFiles'; // Adjust path if needed
import { uploadFileToStorage, updateFirestore } from '../Utilities/Upload/uploadUtils';
import UploadComponent from '../Utilities/Upload/uploadComponent';
import AIButton from "../aiAddon/aiButton";
import SearchBar from "../Utilities/SearchBar/searchBar";

const hrDepartment = () => {
  // Constants for the companyId and departmentId used for Firestore
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'NpaV1QtwGZ2MDNOGAlXa'; // Correct HR department ID

  // States for uploading files
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState('files');
  const [fileListUpdated, setFileListUpdated] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles((prevSelected) => 
      prevSelected.includes(fileId) 
        ? prevSelected.filter(id => id !== fileId) 
        : [...prevSelected, fileId]
    );
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
      await updateFirestore(firestorePath, downloadURL, file.name, storagePath);
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

  const incidentFilesPath = [
    'Company',
    COMPANYID,
    'Departments',
    DEPARTMENTID,
    'incident',
  ] as [string, ...string[]];

  return (
    <div>
      <div className="header">
        <Link href="/home">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Human Resources!</h1>
        <p>These are the HR files.</p>

        {/* File upload section */}
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
    </div>
    <AIButton paths={['NpaV1QtwGZ2MDNOGAlXa']}/>
  </div>
  );
};

export default hrDepartment;
