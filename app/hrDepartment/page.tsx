"use client"; // Mark as a Client Component

import { useState } from "react";
import React from 'react';
import Link from "next/link";
import { handleFileUpload } from "../upload/uploadUtils"; // Import the utility function

const hrDepartment = () => {
  
  // consts for the companyId and departmentId used for firestore
  const COMPANYID = "mh3VZ5IrZjubXUCZL381";
  const DEPARTMENTID = "NpaV1QtwGZ2MDNOGAlXa";

  // states for uploading files
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload 
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file before uploading.");
      return;
    }

    // Define the storage path and Firestore path
    const storagePath = `Company/Departments/HR/${file.name}`;
    const firestorePath = {
      collectionType: "Departments" as const,
      companyId: COMPANYID,
      departmentId: DEPARTMENTID,
    };

    try {
      // Call the utility function to upload the file and update Firestore
      await handleFileUpload(file, storagePath, firestorePath);
      setUploadStatus("File uploaded successfully!");
      setFile(null); // Reset the file input
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("Failed to upload file.");
    }
  };

  return (
    <div>
      <Link href="/">
        <button style={{ marginBottom: '20px' }}>Home</button>
      </Link>

      <h1>Welcome to HR!</h1>
      <p>These are the HR files.</p>

      {/* File upload section */}
      <div style={{ marginTop: "20px" }}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
          Upload to HR
        </button>
        {uploadStatus && <p>{uploadStatus}</p>}
      </div>
    </div>
  );
};

export default hrDepartment;
