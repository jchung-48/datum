"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './styles.css';
import { FileList } from '../upload/listFiles';
import { LuCloudLightning } from 'react-icons/lu';
import { uploadFileToStorage, updateFirestore } from '../upload/uploadUtils';
import { FaUserCircle } from 'react-icons/fa';
import { fetchContacts } from '../editCompanyContacts/editContactUtils';
import { Buyer, Manufacturer } from '../types';

const MerchandisingDepartment = () => {
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'ti7yNByDOzarVXoujOog';

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(['files']);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactType, setSelectedContactType] = useState<'Buyer' | 'Manufacturer' | null>(null);
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [contactUploadStatus, setContactUploadStatus] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Handle file selection for department files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file selection for contact files
  const handleContactFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContactFile(e.target.files[0]);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedCollections(prevSelected =>
      e.target.checked ? [...prevSelected, value] : prevSelected.filter(item => item !== value)
    );
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles((prevSelected) => 
      prevSelected.includes(fileId) 
        ? prevSelected.filter(id => id !== fileId) 
        : [...prevSelected, fileId]
    );
  };
  
  const handleMoveToRecords = async () => {
    try {
      // Loop over each file in selectedFiles
      for (const fileId of selectedFiles) {
        const storagePath = `Company/Departments/Merchandising/${fileId}`;
  
        // Move file data to 'records' collection
        await updateFirestore(
          { collectionType: 'Departments', companyId: COMPANYID, departmentId: DEPARTMENTID, customCollectionName: 'records' },
          '', fileId, storagePath
        );
  
        // Remove file from 'files' collection
        await updateFirestore(
          { collectionType: 'Departments', companyId: COMPANYID, departmentId: DEPARTMENTID, customCollectionName: 'files' },
          '', fileId, storagePath
        );
      }
  
      alert("Selected files moved to records successfully!");
      setSelectedFiles([]); // Clear selected files
    } catch (error) {
      console.error("Error moving files to records:", error);
      alert("Failed to move files.");
    }
  };  

  // Upload for department files
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
      const storagePath = `Company/Departments/Merchandising/${file.name}`;
      const downloadURL = await uploadFileToStorage(file, storagePath);

      for (const collectionName of selectedCollections) {
        const firestorePath = {
          collectionType: 'Departments' as const,
          companyId: COMPANYID,
          departmentId: DEPARTMENTID,
          customCollectionName: collectionName,
        };

        await updateFirestore(firestorePath, downloadURL, file.name, storagePath);
      }

      setUploadStatus('File uploaded successfully to all selected collections!');
      setFile(null);
      setSelectedCollections([]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Failed to upload file.');
    }
  };

  useEffect(() => {
    const loadBuyersAndManufacturers = async () => {
      try {
        const buyersList = await fetchContacts(COMPANYID, 'Buyer');
        const manufacturersList = await fetchContacts(COMPANYID, 'Manufacturer');
        setBuyers(buyersList as Buyer[]);
        setManufacturers(manufacturersList as Manufacturer[]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    loadBuyersAndManufacturers();
  }, []);

  const deptFilesPath = [
    'Company',
    COMPANYID,
    'Departments',
    DEPARTMENTID,
    'files',
  ] as [string, ...string[]];

  const deptRecordsPath = [
    'Company',
    COMPANYID,
    'Departments',
    DEPARTMENTID,
    'records',
  ] as [string, ...string[]];

  const selectedContactFilesPath =
    selectedContactType && selectedContactId
      ? [
          'Company',
          COMPANYID,
          selectedContactType === 'Buyer' ? 'Buyers' : 'Manufacturers',
          selectedContactId,
          (selectedContactType === 'Buyer' ? 'Quotes' : 'Products'),
        ]
      : null;


  // Handle contact-specific file upload
  const handleContactFileUpload = async () => {
    if (!contactFile || !selectedContactId || !selectedContactType) {
      alert("Please select a file and a contact before uploading.");
      return;
    }

    try {
      const storagePath = `Company/${selectedContactType === 'Buyer' ? 'Buyers' : 'Manufacturers'}/${selectedContactId}/${contactFile.name}`;
      const downloadURL = await uploadFileToStorage(contactFile, storagePath);

      const firestorePath = {
        collectionType: selectedContactType === 'Buyer' ? 'Buyers' as const : selectedContactType === 'Manufacturer' ? 'Manufacturers' as const : 'Departments' as const,
        companyId: COMPANYID,
        buyerId: selectedContactType === 'Buyer' ? selectedContactId : undefined,
        manufacturerId: selectedContactType === 'Manufacturer' ? selectedContactId : undefined,
      };

      await updateFirestore(firestorePath, downloadURL, contactFile.name, storagePath);

      setContactUploadStatus('File uploaded successfully to contact!');
      setContactFile(null);
    } catch (error) {
      console.error('Error uploading contact file:', error);
      setContactUploadStatus('Failed to upload file to contact.');
    }
  };

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
      <div>
      <div className="department">Merchandising</div>
      
        <div style={{ marginTop: '20px' }}>
          <input className="upload" type="file" onChange={handleFileChange} />
            <label className="checkbox">
              <input
                className="checkbox"
                type="checkbox"
                value="files"
                checked={selectedCollections.includes('files')}
                onChange={handleCheckboxChange}
              />
                <div className="checkbox-title">Department</div>
            </label>

          <button className="upload-button" onClick={handleUpload} style={{ marginLeft: '10px' }}>
            Upload
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      <div className="files">
        <div className="file-title">Department</div>
        <FileList
          collectionPath={deptFilesPath}
          title=""
          onSearch={() => {}}
          onFileSelect={handleFileSelect}
          display = 'horizontal'
        />
        {selectedFiles.length > 0 && (
          <button className="move-button" onClick={handleMoveToRecords} style={{ marginTop: '10px' }}>
            Move to Records
          </button>
        )}
        <div className="record-title">
          <FileList 
            collectionPath={deptRecordsPath}
            title="Records"
            onSearch={() => {}}
          />
        </div>
      </div>

      {/* Buyers List */}
      <div className="contact-list">
        <h2>Buyers</h2>
        {buyers.length === 0 ? (
          <p>No buyers found.</p>
        ) : (
          <ul>
            {buyers.map((buyer) =>
              buyer.id ? (
                <li
                  key={buyer.id}
                  onClick={() => {
                    setSelectedContactId(buyer.id ? buyer.id : null);
                    setSelectedContactType('Buyer');
                  }}
                  style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                >
                  {buyer.name} - {buyer.email} - {buyer.phone}
                </li>
              ) : null
            )}
          </ul>
        )}
        <Link href="/editCompanyContacts/crudBuyer">
            <button style={{ marginBottom: '20px' }}>Add/Edit Buyers</button>
        </Link>
      </div>

      {/* Manufacturers List */}
      <div className="contact-list">
        <h2>Manufacturers</h2>
        {manufacturers.length === 0 ? (
          <p>No manufacturers found.</p>
        ) : (
          <ul>
            {manufacturers.map((manufacturer) =>
              manufacturer.id ? (
                <li
                  key={manufacturer.id}
                  onClick={() => {
                    setSelectedContactId(manufacturer.id ? manufacturer.id : null);
                    setSelectedContactType('Manufacturer');
                  }}
                  style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                >
                  {manufacturer.name} - {manufacturer.email} - {manufacturer.phone}
                </li>
              ) : null
            )}
          </ul>
        )}
        <Link href="/editCompanyContacts/crudManufacturer">
          <button style={{ marginBottom: '20px' }}>Add/Edit Manufacturers</button>
        </Link>
      </div>

      {/* Files for Selected Contact */}
      {selectedContactFilesPath && (
        <div className="files">
          <FileList
            collectionPath={selectedContactFilesPath as [string, ...string[]]}
            title={`${selectedContactType} Files`}
            onSearch={() => {}}
          />

          {/* File upload for selected contact */}
          <div style={{ marginTop: '20px' }}>
            <input type="file" onChange={handleContactFileChange} />
            <button onClick={handleContactFileUpload}>Upload File to {selectedContactType}</button>
            {contactUploadStatus && <p>{contactUploadStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchandisingDepartment;
