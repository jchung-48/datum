"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
import { FileList } from '../upload/listFiles';
import { uploadFileToStorage, updateFirestore } from '../upload/uploadUtils';
import './styles.css';
import { LuCloudLightning } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';
import AIButton from "../aiAddon/aiButton";
import SearchBar from "../upload/SearchBar/searchBar";

const LogisticsDepartment: React.FC = () => {
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'KZm56fUOuTobsTRCfknJ'; // Update to the Logistics department ID

  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('transportationFiles'); // Default collection
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

    //console.log("current user:",auth.currentUser);

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
    <div className="body">
      <div className="header">
        <Link href="/home">
          <div className="home">
            <LuCloudLightning className="cloud-icon"/>
            DATUM
          </div>
        </Link>
        <FaUserCircle className="profile" />
      </div>

      <div className="department">Logistics</div>

      <div className="upload-search-container">

        <div className="upload">
          {/* File upload section */}
          <div style={{ marginTop: '20px' }}>
            <input type="file" onChange={handleFileChange} />
            <select value={selectedCollection} onChange={handleCollectionChange} style={{ marginLeft: '10px' }}>
              <option value="transportationFiles">Transportation Files</option>
              <option value="customsFiles">Customs Files</option>
              <option value="financialFiles">Financial Files</option>
            </select>
            <button className="upload-button" onClick={handleUpload} style={{ marginLeft: '10px' }}>
              Upload
            </button>
            {uploadStatus && <p>{uploadStatus}</p>}
          </div>
        </div>

        <div className="search">
        <SearchBar department="Logistics" />
        </div>
      </div>
      

      <div className="files">
      <div className="file-title">Transportation Files</div>
        <FileList 
              collectionPath={transportationFilesPath} 
              title="" 
              onSearch={() => {}}
              onFileSelect={handleFileSelect}
              horizontal
        />
        <div className="file-title">Customs Files</div>
        <FileList 
              collectionPath={customsFilesPath} 
              title="" 
              onSearch={() => {}}
              onFileSelect={handleFileSelect}
              horizontal
        />
        <div className="file-title">Financial Files</div>
        <FileList 
              collectionPath={financialFilesPath} 
              title="" 
              onSearch={() => {}}
              onFileSelect={handleFileSelect}
              horizontal
        />
      </div>
      <div className="ai-features">
        <AIButton/>
      </div>
    </div>
  );
};

export default LogisticsDepartment;
