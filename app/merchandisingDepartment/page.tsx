"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './styles.css';
import { FileList } from '../upload/listFiles';
import { LuCloudLightning } from 'react-icons/lu';
import { uploadFileToStorage, updateFirestore, moveDocument } from '../upload/uploadUtils';
import { FaUserCircle } from 'react-icons/fa';
import { fetchContacts } from '../editCompanyContacts/editContactUtils';
import { Buyer, Manufacturer } from '../types';
import  UploadComponent  from '../upload/Upload/uploadComponent';
import AIButton from "../aiAddon/aiButton";
import SearchBar from "../upload/SearchBar/searchBar";

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
  const [fileListUpdated, setFileListUpdated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedContactFilesPath, setSelectedContactFilesPath] = useState<string[]>([]);

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
        await moveDocument(
          { collectionType: 'Departments', companyId: COMPANYID, departmentId: DEPARTMENTID },
          { collectionType: 'Departments', companyId: COMPANYID, departmentId: DEPARTMENTID, collectionName: 'records' },
          fileId
        )
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

  const handleCardClick = (type: 'Buyer' | 'Manufacturer', id: string, name: string) => {
    setSelectedContactFilesPath([
      'Company',
      COMPANYID,
      type === 'Buyer' ? 'Buyers' : 'Manufacturers',
      id,
      type === 'Buyer' ? 'Quotes' : 'Products',
    ]);
    setModalTitle(`${name} - ${type} Files`);
    setShowModal(true);
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
        <Link href="/profile">
          <FaUserCircle className="profile" />
        </Link>
      </div>
      <div>
      <div className="department">Merchandising</div>
        <UploadComponent
          companyId={COMPANYID}
          departmentId={DEPARTMENTID}
          departmentName="Merchandising"
          collections={['files']}
          onUploadSuccess={() => setFileListUpdated(prev => !prev)}/>

        <SearchBar 
                paths={["ti7yNByDOzarVXoujOog"]} 
        />

      </div>

      <div className="files">
        <div className="file-title">Department</div>
        <FileList
          collectionPath={deptFilesPath}
          title=""
          onSearch={() => {}}
          onFileSelect={handleFileSelect}
          display = 'horizontal'
          refreshTrigger={fileListUpdated}
        />
        {selectedFiles.length > 0 && (
          <button className="move-button" onClick={handleMoveToRecords} style={{ marginTop: '10px' }}>
            Move to Records
          </button>
        )}
        <div className="file-title">
          <FileList 
            collectionPath={deptRecordsPath}
            title="Records"
            onSearch={() => {}}

          refreshTrigger={fileListUpdated}
          />
        </div>
      </div>

      <div className="contact-lists-container">
        {/* Buyers List */}
        <div className="contact-list">
          <h2>Buyers</h2>
          {buyers.map((buyer) =>
            buyer.id ? (
              <div
                key={buyer.id}
                className="contact-card"
                onClick={() => handleCardClick('Buyer', buyer.id ? buyer.id : '', buyer.name)}
              >
                <div className="contact-name">{buyer.name}</div>
                <div className="contact-details">{buyer.email}</div>
                <div className="contact-details">{buyer.phone}</div>
              </div>
            ) : null
          )}
        </div>

        {/* Manufacturers List */}
        <div className="contact-list">
          <h2>Manufacturers</h2>
          {manufacturers.map((manufacturer) =>
            manufacturer.id ? (
              <div
                key={manufacturer.id}
                className="contact-card"
                onClick={() => handleCardClick('Manufacturer', manufacturer.id ? manufacturer.id : '', manufacturer.name)}
              >
                <div className="contact-name">{manufacturer.name}</div>
                <div className="contact-details">{manufacturer.email}</div>
                <div className="contact-details">{manufacturer.phone}</div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* File List Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowModal(false)}>✖</button>
            {/* <h2>{modalTitle}</h2> */}
            <FileList
              collectionPath={selectedContactFilesPath as [string, ...string[]]}
              title={modalTitle}
              display="grid"
            />
          </div>
        </div>
      )}
    <AIButton paths={["ti7yNByDOzarVXoujOog"]} />
    </div>
  );
};

export default MerchandisingDepartment;
