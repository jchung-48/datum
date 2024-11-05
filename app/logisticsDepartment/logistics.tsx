import React, { useState, useEffect } from "react";
import { collection, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebaseClient"; 

type FileData = {
  id: string;
  fileName: string;
  download: string;
  filePath: string;
};

type FileListProps = {
  collectionPath: [string, ...string[]];
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
      } catch (error) {
        console.error(`Error fetching files for ${title}:`, error);
        setError(`Failed to load ${title.toLowerCase()} files.`);
      } finally {
        setLoading(false); // Ensure loading state is set to false in both success and error cases
      }
    };

    fetchFiles();
  }, [collectionPath, title]);

  const processFiles = async (querySnapshot: QuerySnapshot<DocumentData>): Promise<FileData[]> => {
    const filesPromises = querySnapshot.docs.map(async (doc) => {
      const fileData = doc.data();
      const fileRef = ref(storage, fileData.filePath);
      try {
        const downloadURL = await getDownloadURL(fileRef);
        return {
          id: doc.id,
          fileName: fileData.fileName,
          download: downloadURL,
          filePath: fileData.filePath,
        };
      } catch (error) {
        console.error(`Error getting download URL for ${fileData.fileName}:`, error);
        return null; // Return null for files that failed to fetch download URLs
      }
    });

    // Filter out null values (failed downloads)
    const results = await Promise.all(filesPromises);
    return results.filter((file): file is FileData => file !== null); // Type guard to filter out nulls
  };

  if (loading) return <div>Loading {title.toLowerCase()}...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="file-list">
      <h2>{title}</h2>
      {files.length === 0 ? <p>No files available.</p> : (
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
