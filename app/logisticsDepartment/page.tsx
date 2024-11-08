"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
import { FileList } from './logistics'; // Adjust the path accordingly
import { uploadFileToStorage, updateFirestore } from '../upload/uploadUtils';

const LogisticsDepartment: React.FC = () => {
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'KZm56fUOuTobsTRCfknJ'; // Update to the Logistics department ID

  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('transportationFiles'); // Default collection

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle collection selection
  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCollection(e.target.value);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file before uploading.');
      return;
    }

    const storagePath = `Company/Departments/Logistics/${file.name}`;
    const downloadURL = await uploadFileToStorage(file, storagePath);
    const firestorePath = {
      collectionType: 'Departments' as const,
      companyId: COMPANYID,
      departmentId: DEPARTMENTID,
      customCollectionName: selectedCollection,
    };

    try {
      await updateFirestore(firestorePath, downloadURL, file.name, storagePath);
      setUploadStatus('File uploaded successfully!');
      setFile(null); // Reset the file input
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Failed to upload file.');
    }
  };

  // Firestore paths for different file types
  const customsFilesPath = [
    'Company',
    COMPANYID,
    'Departments',
    DEPARTMENTID,
    'customsFiles',
  ] as [string, ...string[]];

  const financialFilesPath = [
    'Company',
    COMPANYID,
    'Departments',
    DEPARTMENTID,
    'financialFiles',
  ] as [string, ...string[]];

  const transportationFilesPath = [
    'Company',
    COMPANYID,
    'Departments',
    DEPARTMENTID,
    'transportationFiles',
  ] as [string, ...string[]];

  return (
    <div>
      <div className="header">
        <Link href="/home">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Logistics!</h1>
        <p>These are the Logistics files.</p>

        {/* File upload section */}
        <div style={{ marginTop: '20px' }}>
          <input type="file" onChange={handleFileChange} />
          <select value={selectedCollection} onChange={handleCollectionChange} style={{ marginLeft: '10px' }}>
            <option value="transportationFiles">Transportation Files</option>
            <option value="customsFiles">Customs Files</option>
            <option value="financialFiles">Financial Files</option>
          </select>
          <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
            Upload
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      <div className="files">
        <FileList collectionPath={transportationFilesPath} title="Transportation Files" />
        <FileList collectionPath={customsFilesPath} title="Customs Files" />
        <FileList collectionPath={financialFilesPath} title="Financial Files" />
      </div>
    </div>
  );
};

export default LogisticsDepartment;
