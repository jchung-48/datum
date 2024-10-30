"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
//import './styles.css';
import { FileList } from './humanResources'; // Adjust the path accordingly
import { handleFileUpload } from '../upload/uploadUtils'; // Import the utility function

const qaDepartment = () => {
  // Constants for the companyId and departmentId used for Firestore
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'NpaV1QtwGZ2MDNOGAlXa'; // Update to the QA department ID

  // States for uploading files
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState('files'); // State for selected collection

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
    const storagePath = `Company/Departments/Human-Resources/${file.name}`;
    const firestorePath = {
      collectionType: 'Departments' as const,
      companyId: COMPANYID,
      departmentId: DEPARTMENTID,
      customCollectionName: selectedCollection, // Use the selected collection name
    };

    try {
      // Call the utility function to upload the file and update Firestore
      await handleFileUpload(file, storagePath, firestorePath);
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
    DEPARTMENTID,
    'inbox',
  ] as [string, ...string[]];

  return (
    <div>
      <div className="header">
        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Human Resources!</h1>
        <p>These are the HR files.</p>

        {/* File upload section */}
        <div style={{ marginTop: '20px' }}>
          <input type="file" onChange={handleFileChange} />
          <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}>
            <option value="files">Department Files</option>
            <option value="inbox">Inbox</option>
            {/* Add more options as needed */}
          </select>
          <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
            Upload to QA Department
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      <div className="files">
        <FileList collectionPath={deptFilesPath} title="Department Files" />
        <FileList collectionPath={inboxFilesPath} title="Incident Files" />
      </div>
    </div>
  );
};

export default qaDepartment;