// UploadComponent.tsx
import React, { useState, useRef, useEffect } from 'react';
import { uploadFileToStorage, updateFirestore } from '../uploadUtils';
import './uploadComponent.css';
import { UploadComponentProps } from '../../types';


const UploadComponent: React.FC<UploadComponentProps> = ({ companyId, departmentId, departmentName, collections, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<string>(collections ? collections[0] : '');
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [showCard, setShowCard] = useState(false);
    const cardRef = useRef<HTMLDivElement | null>(null);
  
    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
      }
    };
  
    // Handle collection change
    const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCollection(e.target.value);
    };
  
    // Handle upload
    const handleUpload = async () => {
      if (!file) {
        alert('Please select a file before uploading.');
        return;
      }
  
      const storagePath = `Company/Departments/${departmentName}/${file.name}`;
      try {
        const downloadURL = await uploadFileToStorage(file, storagePath);
        const firestorePath = {
          collectionType: 'Departments' as const,
          companyId: companyId,
          departmentId: departmentId,
          customCollectionName: selectedCollection,
        };
  
        await updateFirestore(firestorePath, downloadURL, file.name, storagePath);
        setUploadStatus('File uploaded successfully!');
        setFile(null);
        //setShowCard(false); 
        if (onUploadSuccess) onUploadSuccess();
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus('Failed to upload file.');
      }
    };
  
    // Close card on clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          cardRef.current &&
          !cardRef.current.contains(event.target as Node)
        ) {
          setShowCard(false);
        }
      };
  
      if (showCard) {
        document.addEventListener('mousedown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showCard]);
  
    return (
      <div className="upload-container">
        <button
          className={`pill-upload-button ${showCard ? 'hidden-button' : ''}`}
          onClick={() => setShowCard(true)}
        >
          Upload
        </button>
        {showCard && (
          <div className="upload-card" ref={cardRef}>
            <input type="file" onChange={handleFileChange} />
            {collections && (
              <select value={selectedCollection} onChange={handleCollectionChange}>
                {collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            )}
            <button onClick={handleUpload}>Upload</button>
            {uploadStatus && <p>{uploadStatus}</p>}
          </div>
        )}
      </div>
    );
  };
  
  export default UploadComponent;