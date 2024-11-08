"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
import './styles.css';
import { FileList } from '../upload/listFiles'; // Adjust the path accordingly
import { uploadFileToStorage, updateFirestore } from '../upload/uploadUtils'; // Import the utility function

const qaDepartment = () => {
  // Constants for the companyId and departmentId used for Firestore
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'Eq2IDInbEQB5nI5Ar6Vj'; // Update to the QA department ID
  const MANUDEPTID = 'ti7yNByDOzarVXoujOog' 

  // States for uploading files
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

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
      customCollectionName: "files", // Use the selected collection name
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

  const inboxFilesPath = [
    'Company',
    COMPANYID,
    'Departments',
    MANUDEPTID,
    'records',
  ] as [string, ...string[]];

  return (
    <div>
      <div className="header">
        <Link href="/home">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Quality Assurance!</h1>
        <p>These are the QA files.</p>

        {/* File upload section */}
        <div style={{ marginTop: '20px' }}>
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
            Upload to QA Department
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      <div className="files">
        <FileList collectionPath={deptFilesPath} title="Department Files" />
        <FileList collectionPath={inboxFilesPath} title="Inbox Files" />
      </div>
    </div>
  );
};

export default qaDepartment;