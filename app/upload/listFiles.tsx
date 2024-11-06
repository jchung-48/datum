// listFiles.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FileData, FileListProps } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.js';

export const FileList: React.FC<FileListProps & { horizontal?: boolean }> = ({
  collectionPath,
  title,
  onSearch,
  onFileSelect,
  horizontal = false,
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = files.filter((file) => file.fileName.toLowerCase().includes(lowerCaseQuery));
    setFilteredFiles(filtered);
  }, [searchQuery, files]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesCollectionRef = collection(db, ...collectionPath);
        const querySnapshot = await getDocs(filesCollectionRef);
        const filesData = await processFiles(querySnapshot);

        setFiles(filesData);
        setFilteredFiles(filesData);
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

      const fileRef = ref(storage, filePath);
      const downloadURL = await getDownloadURL(fileRef);

      let thumbnail = '';

      if (fileName.endsWith('.pdf')) {
        try {
          thumbnail = await generatePDFThumbnail(downloadURL); // Generate PDF thumbnail
        } catch (error) {
          console.error("Error generating PDF thumbnail:", error);
        }
      } else if (fileName.match(/\.(jpeg|jpg|png)$/i)) {
        thumbnail = downloadURL; // Directly use image URLs for image files
      }

      return {
        id: doc.id,
        fileName: fileName,
        download: downloadURL,
        filePath: filePath,
        thumbnail: thumbnail || downloadURL, // Use the thumbnail if available
      };
    });

    return await Promise.all(filesPromises);
  };

  const generatePDFThumbnail = async (pdfUrl: string): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
    const page = await pdf.getPage(1); // Get the first page
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) throw new Error("Canvas context is not available");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context!,
      viewport: viewport,
    }).promise;

    return canvas.toDataURL(); // Return the thumbnail as a data URL
  };

  return (
    <div className={`file-list ${horizontal ? 'horizontal' : ''}`}>
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

      {filteredFiles.length === 0 ? (
        <p>No files available.</p>
      ) : (
        <ul style={{ display: horizontal ? 'flex' : 'block', flexWrap: 'wrap' }}>
          {filteredFiles.map((file) => (
            <li key={file.id} style={{ margin: horizontal ? '10px' : '0' }}>
              {onFileSelect && (
                <input
                  type="checkbox"
                  onChange={() => onFileSelect(file.id)}
                  style={{ marginRight: '5px' }}
                />
              )}
              {horizontal ? (
                <div style={{ textAlign: 'center' }}>
                  <a href={file.download} target="_blank" rel="noopener noreferrer">
                    <img
                      src={file.thumbnail}
                      alt={file.fileName}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <p style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.fileName}
                    </p>
                  </a>
                </div>
              ) : (
                <a href={file.download} target="_blank" rel="noopener noreferrer">
                  {file.fileName}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};