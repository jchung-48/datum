"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
import { FileList } from '@/app/Utilities/ListFiles/listFiles';
import { uploadFileToStorage, updateFirestore } from '@/app/Utilities/Upload/uploadUtils';
import deptStyles from '../departments.module.css';
import logStyles from './logistics.module.css';
import { LuCloudLightning } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';
import AIButton from "@/app/aiAddon/aiButton";
import SearchBar from "@/app/Utilities/SearchBar/searchBar";
import UploadComponent from '@/app/Utilities/Upload/uploadComponent';
import Header from '@/app/Utilities/Header/header';

const LogisticsDepartment: React.FC = () => {
  const styles = { ...deptStyles, ...logStyles };

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
    <div className={styles.page}>
      <Header department="Logistics" isProfile={false} />
      <div className={styles.body}>

        <div className={styles.topComponentContainer}>
          <UploadComponent 
            companyId={COMPANYID} 
            departmentId={DEPARTMENTID} 
            departmentName="Logistics"
            collections={['transportationFiles', 'customsFiles', 'financialFiles']}
            onUploadSuccess={() => setFileListUpdated(prev => !prev)}
          />
          <div className={styles.search}>
            <SearchBar paths={["KZm56fUOuTobsTRCfknJ"]} />
          </div>
        </div>

        <div className={styles.files}>
          <div className={styles.fileTitle}>Transportation Files</div>
          <FileList 
                collectionPath={transportationFilesPath} 
                title=""
                onFileSelect={handleFileSelect}
                horizontal
                refreshTrigger={fileListUpdated}
                enableShare={true}
          />
          <div className={styles.fileTitle}>Customs Files</div>
          <FileList 
                collectionPath={customsFilesPath} 
                title=""
                onFileSelect={handleFileSelect}
                horizontal
                refreshTrigger={fileListUpdated}
                enableShare={true}
          />
          <div className={styles.fileTitle}>Financial Files</div>
          <FileList 
                collectionPath={financialFilesPath} 
                title=""
                onFileSelect={handleFileSelect}
                horizontal
                refreshTrigger={fileListUpdated}
                enableShare={true}
          />
        </div>

        <div className={styles.aiFeatures}>
          <AIButton paths={['KZm56fUOuTobsTRCfknJ']}/>
        </div>
      </div>
    </div>
  );
};

export default LogisticsDepartment;
