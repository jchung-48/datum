// listFiles.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FileData, FileListProps } from '../types';

export const FileList: React.FC<FileListProps> = ({ collectionPath, title, onSearch }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = files.filter(file => file.fileName.toLowerCase().includes(lowerCaseQuery));
    setFilteredFiles(filtered);
  }, [searchQuery, files]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesCollectionRef = collection(db, ...collectionPath);
        const querySnapshot = await getDocs(filesCollectionRef);
        const filesData = await processFiles(querySnapshot);
        
        setFiles(filesData);
        setFilteredFiles(filesData); // Set filtered files to display all initially
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching files for ${title}:`, error);
        setError(`Failed to load ${title.toLowerCase()}.`);
        setLoading(false);
      }
    };

    fetchFiles();
  }, [collectionPath, title]);

  const processFiles = async (querySnapshot: any): Promise<FileData[]> => {
    const filesPromises = querySnapshot.docs.map(async (doc: any) => {
      const fileData = doc.data();
      const fileName = fileData.fileName;
      const filePath = fileData.filePath;

      console.log("file:", fileData);
      console.log('Processing file:', fileName);
      console.log('File path:', filePath);

      const fileRef = ref(storage, filePath);
      const downloadURL = await getDownloadURL(fileRef);

      return {
        id: doc.id,
        fileName: fileName,
        download: downloadURL,
        filePath: filePath,
      };
    });

    return await Promise.all(filesPromises);
  };

  if (loading) {
    return <div>Loading {title.toLowerCase()}...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="file-list">
      <h2>{title}</h2>
      
      {onSearch && (
        <input
          type="text"
          placeholder="Search files by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '10px' }}
        />
      )}

      <div className="file-items">
        {filteredFiles.length === 0 ? (
          <p>No files available.</p>
        ) : (
          filteredFiles.map((file) => (
            <div key={file.id} className="file-item">
              <a href={file.download} target="_blank" rel="noopener noreferrer">
                {file.fileName}
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
