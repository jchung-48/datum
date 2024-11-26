'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebaseClient';
import { FileData, FileListProps, FirestorePath } from '../../types';
import { handleFileDelete } from '../Upload/uploadUtils';
import * as pdfjsLib from 'pdfjs-dist';
import styles from './listFiles.module.css';
import { onAuthStateChanged } from 'firebase/auth';
import FileCard from './fileCard';
import DropdownMenu from '../DropDownMenu/dropdownMenu';
import { MdDelete, MdMoreVert, MdShare } from 'react-icons/md';
import ShareFileModal from '../ShareFiles/shareFile';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.js';

export const FileList: React.FC<FileListProps & { horizontal?: boolean }> = ({
  collectionPath,
  title,
  onSearch,
  onFileSelect,
  display = 'list',
  refreshTrigger,
  enableShare = false,
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserUid(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const filesCollectionRef = collection(db, ...collectionPath);
        const querySnapshot = await getDocs(filesCollectionRef);
        const filesData = await processFiles(querySnapshot);

        setFiles(filesData);
        setFilteredFiles(filesData);
      } catch (error) {
        console.error(`Error fetching files for ${title}:`, error);
        setError(`Failed to load ${title.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [collectionPath, title, refreshTrigger]);

  const processFiles = async (querySnapshot: any): Promise<FileData[]> => {
    const filesPromises = querySnapshot.docs.map(async (doc: any) => {
      const fileData = doc.data();
      const fileRef = ref(storage, fileData.filePath);
      const downloadURL = await getDownloadURL(fileRef);

      let thumbnail = '';
      if (fileData.fileName.endsWith('.pdf')) {
        try {
          thumbnail = await generatePDFThumbnail(downloadURL);
        } catch (error) {
          console.error('Error generating PDF thumbnail:', error);
          thumbnail = '/path/to/default/thumbnail.png';
        }
      } else if (fileData.fileName.match(/\.(jpeg|jpg|png)$/i)) {
        thumbnail = downloadURL;
      }

      return {
        id: doc.id,
        ...fileData,
        download: downloadURL,
        thumbnail: thumbnail || downloadURL,
      };
    });

    return await Promise.all(filesPromises);
  };

  const generatePDFThumbnail = async (pdfUrl: string): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context is not available');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL();
  };

  const handleFileSelect = (fileId: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileId)) {
      newSelectedFiles.delete(fileId);
    } else {
      newSelectedFiles.add(fileId);
    }
    setSelectedFiles(newSelectedFiles);
    if (onFileSelect) onFileSelect(fileId);
  };

  const handleDelete = async (fileId: string) => {
    const fileToDelete = files.find((file) => file.id === fileId);
    if (fileToDelete && currentUserUid === fileToDelete.uploadedBy) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the file "${fileToDelete.fileName}"?`
      );

      if (confirmDelete) {
        try {
          const firestorePath: FirestorePath = {
            collectionType: collectionPath[2],
            companyId: collectionPath[1],
            collectionName: collectionPath[4],
          };

          await handleFileDelete(fileToDelete.filePath, firestorePath);
          setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
          setFilteredFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
          setSelectedFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        } catch (error) {
          console.error('Error deleting file:', error);
          alert('Failed to delete the file.');
        }
      }
    }
  };

  const openShareModal = () => {
    if (selectedFiles.size === 0) {
      alert('No files selected for sharing.');
      return;
    }
    setIsShareModalOpen(true);
  };

  const menuItems = (file: FileData) => [
    {
      label: 'Delete',
      icon: <MdDelete />,
      action: () => handleDelete(file.id),
    },
    {
      label: 'Share',
      icon: <MdShare />,
      action: openShareModal,
    },
  ];

  return (
    <div className={styles.fileList}>
      <h2>{title}</h2>

      {onSearch && (
        <input
          className={styles.search}
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {display === 'list' ? (
        <table className={styles.fileTable}>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={3}>No files available.</td>
              </tr>
            ) : (
              filteredFiles.map((file) => (
                <tr key={file.id}>
                  <td>{file.fileName}</td>
                  <td>{file.userDisplayName || 'N/A'}</td>
                  <td>
                    <DropdownMenu
                      menuItems={menuItems(file)}
                      trigger={
                        <button className={styles.dropdownTrigger}>
                          <MdMoreVert />
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        <div className={styles.fileGrid}>
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isSelected={selectedFiles.has(file.id)}
              currentUserUid={currentUserUid}
              onSelect={handleFileSelect}
            />
          ))}
        </div>
      )}

      {enableShare && (
        <ShareFileModal
          companyId={collectionPath[1]}
          filesToShare={Array.from(selectedFiles).map(
            (fileId) => files.find((file) => file.id === fileId)!
          )}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
};
