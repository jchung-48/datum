"use client";

import { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { storage } from "../../firebase"; // Adjusted import path for firebase.js

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<{ name: string; url: string; fullPath: string }[]>([]);

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

    const storageRef = ref(storage, `/${file.name}`); // Store at root or any desired directory
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

  // Function to list files from Firebase Storage
  const listFiles = async () => {
    const listRef = ref(storage, "/"); // Assuming files are in the root

    try {
      const res = await listAll(listRef);
      const files = await Promise.all(
        res.items.map(async (itemRef) => {
          const downloadURL = await getDownloadURL(itemRef);
          return { name: itemRef.name, url: downloadURL, fullPath: itemRef.fullPath }; // Save full path
        })
      );
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
      <div id="upload-div">
        <input type="file" id="file-input" onChange={handleFileChange} />
        <button id="uploadButton" onClick={handleUpload}>
          Upload
        </button>
      </div>

      <div id="contents-div">
        <ul id="file-list">
          {fileList.map((file, index) => (
            <li key={index}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name} {/* Display only the file name */}
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
