"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import Link from 'next/link';
import './styles.css';
import { FileList } from '@/app/Utilities/ListFiles/listFiles'; // Adjust the path accordingly
import { LuCloudLightning } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';
import { uploadFileToStorage, updateFirestore } from '@/app/Utilities/Upload/uploadUtils'; // Import the utility function
import UploadComponent from '@/app/Utilities/Upload/uploadComponent'; // Import the UploadComponent
import AIButton from "@/app/aiAddon/aiButton";
import SearchBar from "@/app/Utilities/SearchBar/searchBar";

const qaDepartment = () => {
  // Constants for the companyId and departmentId used for Firestore
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'Eq2IDInbEQB5nI5Ar6Vj'; // Update to the QA department ID
  const MANUDEPTID = 'ti7yNByDOzarVXoujOog' 

  // States for uploading files
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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
    <div className="body">
      <div className="header">
        <Link href="/home">
          <div className="home">
            <LuCloudLightning className="cloud-icon"/>
            DATUM
          </div>
        </Link>
        <Link href="/profile">
          <FaUserCircle className="profile" />
        </Link>
      </div>
      <div>
        <div className="department">Quality Assurance</div>
        {/* File upload section */}
        <UploadComponent
              companyId={COMPANYID}
              departmentId={DEPARTMENTID}
              departmentName="QualityAssurance"
              collections={['files']}
              onUploadSuccess={() => setFileListUpdated(!fileListUpdated)}/>
        <SearchBar paths= {['Eq2IDInbEQB5nI5Ar6Vj','ti7yNByDOzarVXoujOog/records']}/>
      </div>

      <div className="files">
        <div className="file-section">
          <div className="file-title">Department</div>
          <div className="file-box">
            <FileList collectionPath={deptFilesPath} title='' display='grid' refreshTrigger={fileListUpdated}/>
          </div>
        </div>
        <div className="file-section">
          <div className="file-title">Inbox</div>
          <div className="file-box">
            <FileList collectionPath={inboxFilesPath} title='' refreshTrigger={fileListUpdated}/>
          </div>
        </div>
      </div>
      <AIButton paths={['Eq2IDInbEQB5nI5Ar6Vj','ti7yNByDOzarVXoujOog/records']}/>
    </div>
  );
};

export default qaDepartment;