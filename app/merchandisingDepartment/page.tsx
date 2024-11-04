"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './styles.css';
import { FileList } from '../upload/listFiles';
import { uploadFileToStorage, updateFirestore } from '../upload/uploadUtils';
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
    <div>
      <div className="header">
        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Merchandising!</h1>
        <p>These are the Merchandising files.</p>

        <div style={{ marginTop: '20px' }}>
          <input type="file" onChange={handleFileChange} />

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
          </div>

          <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
            Upload to Merchandising Department
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      <div className="files">
        <FileList collectionPath={deptFilesPath} title="Department Files" />
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
