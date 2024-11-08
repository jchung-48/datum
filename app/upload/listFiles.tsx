// listFiles.tsx

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseClient';
import { FileData, FileListProps } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import styles from './listFiles.module.css'

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
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
          thumbnail = 'https://firebasestorage.googleapis.com/v0/b/datum-115a.appspot.com/o/pdf_thumbnail.png?alt=media&token=762f3694-9262-4c48-962d-9718245d80c4';
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

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200; // Scroll amount in pixels
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleFileSelect = (fileId: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileId)) {
      newSelectedFiles.delete(fileId);
    } else {
      newSelectedFiles.add(fileId);
    }
    setSelectedFiles(newSelectedFiles);
    onFileSelect && onFileSelect(fileId);
  };

  return (
    <div className={styles.fileList}>
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

      <div className={styles.scrollContainer}>
        {horizontal && (
          <>
            <button className={`${styles.scrollButton} ${styles.left}`} onClick={() => handleScroll('left')}>
              &larr;
            </button>
            <button className={`${styles.scrollButton} ${styles.right}`} onClick={() => handleScroll('right')}>
              &rarr;
            </button>
            <div className={`${styles.edgeFade} ${styles.left}`} />
            <div className={`${styles.edgeFade} ${styles.right}`} />
          </>
        )}

        <div
          className={horizontal ? styles.fileItemsHorizontal : styles.fileItemsDefault}
          ref={scrollRef}
        >
          {filteredFiles.length === 0 ? (
            <p>No files available.</p>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`${styles.fileItem} ${selectedFiles.has(file.id) ? styles.selected : ''}`}
              >
                <a href={file.download} target="_blank" rel="noopener noreferrer">
                  {horizontal ? (
                    <img src={file.thumbnail} alt={file.fileName} className={styles.fileThumbnail} />
                  ) : (
                    <div className={styles.fileBlock}>{file.fileName}</div>
                  )}
                </a>
                <input
                  type="checkbox"
                  className={styles.fileCheckbox}
                  checked={selectedFiles.has(file.id)}
                  onChange={() => handleFileSelect(file.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};