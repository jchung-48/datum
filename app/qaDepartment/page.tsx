"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';

import './styles.css';
import { FileList } from '../upload/listFiles'; // Adjust the path accordingly
import { uploadFileToStorage, updateFirestore, handleFileUpload } from '../upload/uploadUtils'; // Import the utility functions


const qaDepartment = () => {
  // Constants for the companyId and departmentId used for Firestore
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'Eq2IDInbEQB5nI5Ar6Vj'; 
  const INBOXDEPTID = 'ti7yNByDOzarVXoujOog'

  // States for uploading files
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(['files']); // State for selected collections

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedCollections(prevSelected => {
      if (e.target.checked) {
        return [...prevSelected, value];
      } else {
        return prevSelected.filter(item => item !== value);
      }
    });
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file before uploading.');
      return;
    }
    if (selectedCollections.length === 0) {
      alert('Please select at least one collection to upload the file.');
      return;
    }
    

    try {
      // Define the storage path
      const storagePath = `Company/Departments/QualityAssurance/${file.name}`;

      // Upload the file to Firebase Storage once and get the download URL
      const downloadURL = await uploadFileToStorage(file, storagePath);

      // Loop over selected collections to update Firestore
      for (const collectionName of selectedCollections) {
        // Define Firestore path for each collection
        const firestorePath = {
          collectionType: 'Departments' as const,
          companyId: COMPANYID,
          departmentId: DEPARTMENTID,
          customCollectionName: collectionName,
        };

        // Call the utility function to update Firestore
        await updateFirestore(firestorePath, downloadURL, file.name, storagePath);
      }

      setUploadStatus('File uploaded successfully to all selected collections!');
      setFile(null); // Reset the file input
      setSelectedCollections([]); // Reset selected collections if desired
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
    INBOXDEPTID,
    'records',
  ] as [string, ...string[]];

  return (
    <div>
      <div className="header">
        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Quality Assurance!</h1>
        <p>These are the QA files.</p>

        {/* File upload section */}
        <div style={{ marginTop: '20px' }}>
          <input type="file" onChange={handleFileChange} />

          {/* Replace the dropdown with checkboxes */}
          <div>
            <label>
              <input
                type="checkbox"
                value="files"
                checked={selectedCollections.includes('files')}
                onChange={handleCheckboxChange}
              />
              Department Files
            </label>
            <label>
              <input
                type="checkbox"
                value="inbox"
                checked={selectedCollections.includes('inbox')}
                onChange={handleCheckboxChange}
              />
              Inbox
            </label>
            {/* Add more options as needed */}
          </div>

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
