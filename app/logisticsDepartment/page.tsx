"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
import { FileList } from '../Utilities/ListFiles/listFiles';
import { uploadFileToStorage, updateFirestore } from '../Utilities/Upload/uploadUtils';
import styles from './logistics.module.css';
import { LuCloudLightning } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';
import AIButton from "../aiAddon/aiButton";
import SearchBar from "../Utilities/SearchBar/searchBar";
import UploadComponent from '../Utilities/Upload/uploadComponent';

const LogisticsDepartment: React.FC = () => {
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'KZm56fUOuTobsTRCfknJ'; // Update to the Logistics department ID

  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('transportationFiles'); // Default collection
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileListUpdated, setFileListUpdated] = useState(false);
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
    <div className={styles.body}>
      <div className={styles.header}>
        <Link href="/home">
          <div className={styles.home}>
            <LuCloudLightning className={styles['cloud-icon']}/>
            DATUM
          </div>
        </Link>
        <div className={styles.department}>Logistics</div>
        <Link href="/profile">
          <FaUserCircle className={styles.profile} />
        </Link>
      </div>


      <div className={styles['upload-search-container']}>

        <UploadComponent 
              companyId={COMPANYID} 
              departmentId={DEPARTMENTID} 
              departmentName="Logistics"
              collections={['transportationFiles', 'customsFiles', 'financialFiles']}
              onUploadSuccess={() => setFileListUpdated(prev => !prev)}/>


        <div className={styles.search}>
          <SearchBar 
                  paths={["KZm56fUOuTobsTRCfknJ"]} 
          />
        </div>
      </div>
      

      <div className={styles.files}>
        <div className={styles['file-title']}>Transportation Files</div>
        <FileList 
              collectionPath={transportationFilesPath} 
              title="" 
              onSearch={() => {}}
              onFileSelect={handleFileSelect}
              horizontal
              refreshTrigger={fileListUpdated}
        />
        <div className={styles['file-title']}>Customs Files</div>
        <FileList 
              collectionPath={customsFilesPath} 
              title="" 
              onSearch={() => {}}
              onFileSelect={handleFileSelect}
              horizontal
              refreshTrigger={fileListUpdated}
        />
        <div className={styles['file-title']}>Financial Files</div>
        <FileList 
              collectionPath={financialFilesPath} 
              title="" 
              onSearch={() => {}}
              onFileSelect={handleFileSelect}
              horizontal
              refreshTrigger={fileListUpdated}
        />
      </div>
      <div className={styles['ai-features']}>
        <AIButton paths={['KZm56fUOuTobsTRCfknJ']}/>
      </div>
    </div>
  );
};

export default LogisticsDepartment;
