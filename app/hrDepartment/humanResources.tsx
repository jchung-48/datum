"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseClient';

type FileData = {
  id: string;
  fileName: string;
  download: string;
  filePath: string;
};

type FileListProps = {
  collectionPath: [string, ...string[]]; // Modified type
  title: string;
};

export const FileList: React.FC<FileListProps> = ({ collectionPath, title }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesCollectionRef = collection(db, ...collectionPath);

        const querySnapshot = await getDocs(filesCollectionRef);
        const filesData = await processFiles(querySnapshot);
        setFiles(filesData);
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
      {files.length === 0 ? (
        <p>No files available.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.id}>
              <a href={file.download} target="_blank" rel="noopener noreferrer">
                {file.fileName}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};