"use client";

import { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject, StorageReference } from "firebase/storage";
import { storage } from "../../firebase"; // Adjusted import path for firebase.js

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [directory, setDirectory] = useState<string>(""); // State for directory input
  const [fileList, setFileList] = useState<{ name: string; url: string; fullPath: string }[]>([]);

  // Function to handle directory input change
  const handleDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectory(e.target.value);
  };

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Function to handle file upload
  const handleUpload = () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const dir = directory ? `${directory}/` : ""; // Add a trailing slash if directory is specified
    const storageRef = ref(storage, `${dir}${file.name}`); // Use directory and file name

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Upload failed", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFileList((prevList) => [
            ...prevList,
            { name: file.name, url: downloadURL, fullPath: storageRef.fullPath }, // Save full path
          ]);
        });
      }
    );
  };

  // Recursive function to list all files, including those in subdirectories
  const listFilesRecursive = async (dirRef: StorageReference) => {
    const res = await listAll(dirRef);
    const allFiles = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        return { name: itemRef.name, url: downloadURL, fullPath: itemRef.fullPath };
      })
    );

    // Recursively get files from subdirectories
    for (const folderRef of res.prefixes) {
      const folderFiles = await listFilesRecursive(folderRef); // Type for folderRef is still StorageReference
      allFiles.push(...folderFiles); // Combine the results
    }

    return allFiles;
  };

  // Function to list files from Firebase Storage
  const listFiles = async () => {
    const listRef = ref(storage, "/"); // List all files from the root

    try {
      const files = await listFilesRecursive(listRef); // Recursively list all files, including those in subdirectories
      setFileList(files);
    } catch (error) {
      console.error("Error listing files", error);
    }
  };

  // Function to delete a file from Firebase Storage
  const deleteFile = async (fileFullPath: string) => {
    const fileRef = ref(storage, fileFullPath); // Use full path for deletion
    await deleteObject(fileRef);
    listFiles(); // Refresh the list after deletion
  };

  // List files when component mounts
  useEffect(() => {
    listFiles();
  }, []);

  return (
    <div>
      <div id="upload-div" style={{ display: "flex", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Choose directory"
          value={directory}
          onChange={handleDirectoryChange}
          style={{ marginRight: "10px" }}
        />
        <input type="file" id="file-input" onChange={handleFileChange} />
        <button id="uploadButton" onClick={handleUpload} style={{ marginLeft: "10px" }}>
          Upload
        </button>
      </div>

      <div id="contents-div">
        <ul id="file-list">
          {fileList.map((file, index) => (
            <li key={index}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.fullPath} {/* Display full path with directory and file name */}
              </a>
              <button onClick={() => deleteFile(file.fullPath)}>Delete</button> {/* Delete by fullPath */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
