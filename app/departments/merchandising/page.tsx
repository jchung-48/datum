'use client';

import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import merchStyles from './merch.module.css';
import deptStyles from '../departments.module.css'
import {FileList} from '../../Utilities/ListFiles/listFiles';
import {LuCloudLightning} from 'react-icons/lu';
import {FaUserCircle} from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import {
  uploadFileToStorage,
  updateFirestore,
  moveDocument,
} from '../../Utilities/Upload/uploadUtils';

import {fetchContacts} from '../../editCompanyContacts/editContactUtils';
import {Buyer, Manufacturer} from '../../types';
import UploadComponent from '../../Utilities/Upload/uploadComponent';
import AIButton from '../../aiAddon/aiButton';
import SearchBar from '../../Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const MerchandisingDepartment = () => {
  const styles = { ...deptStyles, ...merchStyles };
  const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
  const DEPARTMENTID = 'ti7yNByDOzarVXoujOog';

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([
    'files',
  ]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [selectedContactType, setSelectedContactType] = useState<
    'Buyer' | 'Manufacturer' | null
  >(null);
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [contactUploadStatus, setContactUploadStatus] = useState<string | null>(
    null,
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileListUpdated, setFileListUpdated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedContactFilesPath, setSelectedContactFilesPath] = useState<
    string[]
  >([]);

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
      e.target.checked
        ? [...prevSelected, value]
        : prevSelected.filter(item => item !== value),
    );
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prevSelected =>
      prevSelected.includes(fileId)
        ? prevSelected.filter(id => id !== fileId)
        : [...prevSelected, fileId],
    );
  };

  useEffect(() => {
    const loadBuyersAndManufacturers = async () => {
      try {
        const buyersList = await fetchContacts(COMPANYID, 'Buyer');
        const manufacturersList = await fetchContacts(
          COMPANYID,
          'Manufacturer',
        );
        setBuyers(buyersList as Buyer[]);
        setManufacturers(manufacturersList as Manufacturer[]);
      } catch (error) {
        console.error('Error fetching contacts:', error);
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

  const handleCardClick = (
    type: 'Buyer' | 'Manufacturer',
    id: string,
    name: string,
  ) => {
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
    <div className='Page'>
      <Header department="Merchandising" isProfile={false} />

      <div className={styles.body}>
        <div className={styles.topComponentContainer}>
          <UploadComponent
            companyId={COMPANYID}
            departmentId={DEPARTMENTID}
            departmentName="Merchandising"
            collections={['files']}
            onUploadSuccess={() => setFileListUpdated(prev => !prev)}
          />
          <div className={styles.search}>
            <SearchBar paths={['ti7yNByDOzarVXoujOog']} />
          </div>
        </div>

        <div className={styles.files}>
          <FileTitle title="Department Files" />
          <FileList
            collectionPath={deptFilesPath}
            title=""
            onFileSelect={handleFileSelect}
            display="horizontal"
            refreshTrigger={fileListUpdated}
            enableShare={true}
          />
          <FileTitle title="Records" />
            <FileList
              collectionPath={deptRecordsPath}
              title=""
              refreshTrigger={fileListUpdated}
            />
        </div>

        <div className={styles.contactListsContainer}>
          {/* Buyers List */}
          <div className={styles.contactList}>
            <h2>Buyers</h2>
            {buyers.map(buyer =>
              buyer.id ? (
                <div
                  key={buyer.id}
                  className={styles.contactCard}
                  onClick={() =>
                    handleCardClick('Buyer', buyer.id ? buyer.id : '', buyer.name)
                  }
                >
                  <div className={styles.contactName}>{buyer.name}</div>
                  <div className={styles.contactDetails}>{buyer.email}</div>
                  <div className={styles.contactDetails}>{buyer.phone}</div>
                </div>
              ) : null,
            )}
          </div>

          {/* Manufacturers List */}
          <div className={styles.contactList}>
            <h2>Manufacturers</h2>
            {manufacturers.map(manufacturer =>
              manufacturer.id ? (
                <div
                  key={manufacturer.id}
                  className={styles.contactCard}
                  onClick={() =>
                    handleCardClick(
                      'Manufacturer',
                      manufacturer.id ? manufacturer.id : '',
                      manufacturer.name,
                    )
                  }
                >
                  <div className={styles.contactName}>{manufacturer.name}</div>
                  <div className={styles.contactDetails}>{manufacturer.email}</div>
                  <div className={styles.contactDetails}>{manufacturer.phone}</div>
                </div>
              ) : null,
            )}
          </div>
        </div>

        {/* File List Modal */}
        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent}>
              <button
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <MdClose />
              </button>
              {/* <h2>{modalTitle}</h2> */}
              <FileList
                collectionPath={selectedContactFilesPath as [string, ...string[]]}
                title={modalTitle}
                display="grid"
              />
            </div>
          </div>
        )}
        <AIButton paths={['ti7yNByDOzarVXoujOog']} />
      </div>
    </div>
  );
};

export default MerchandisingDepartment;
