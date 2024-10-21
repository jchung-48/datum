"use client";

import { useState, useEffect } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
} from "firebase/storage";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { storage, db } from "../../firebase";

const UploadPage = () => {
  interface Company {
    id: string;
    name: string;
  }
  interface Department {
    id: string;
    name: string;
  }
  interface Buyer {
    id: string;
    name: string;
  }
  interface Quote {
    id: string;
    name: string;
  }
  interface FileItem {
    name: string;
    url: string;
    fullPath: string;
  }

  const [file, setFile] = useState<File | null>(null);
  const [directory, setDirectory] = useState<string>(""); // State for directory input
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [uploadTarget, setUploadTarget] = useState<"Department" | "Buyer">("Department");

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

  // Function to handle file upload with replacement and warning
  const handleUpload = async () => {
    if (!file || !selectedCompany) {
      alert("Please select a file and company first.");
      return;
    }

    if (uploadTarget === "Department" && !selectedDepartment) {
      alert("Please select a department.");
      return;
    }

    if (uploadTarget === "Buyer") {
      if (!selectedBuyer) {
        alert("Please select a buyer.");
        return;
      }
      if (!selectedQuote) {
        alert("Please select a quote.");
        return;
      }
    }

    const dir = directory ? `${directory}/` : ""; // Add a trailing slash if directory is specified

    let storagePath = `${dir}${file.name}`;

    if (uploadTarget === "Department") {
      storagePath = `Company/${selectedCompany.id}/Departments/${selectedDepartment!.id}/${dir}${file.name}`;
    } else if (uploadTarget === "Buyer") {
      storagePath = `Company/${selectedCompany.id}/Buyers/${selectedBuyer!.id}/Quotes/${selectedQuote!.id}/${dir}${file.name}`;
    }

    const storageRef = ref(storage, storagePath); // Use directory and file name

    try {
      // Check if a file with the same name exists
      const existingFileSnapshot = await getDownloadURL(storageRef)
        .then((url) => {
          return true; // File exists
        })
        .catch((error) => {
          if (error.code === "storage/object-not-found") {
            return false; // File doesn't exist
          } else {
            throw error; // Handle other errors
          }
        });

      if (existingFileSnapshot) {
        // Alert the user that the file already exists and ask for confirmation
        const confirmReplace = window.confirm(
          `A file named "${file.name}" already exists. Do you want to replace it?`
        );

        if (!confirmReplace) {
          // If user cancels, stop the upload
          alert("Upload canceled.");
          return;
        }

        // If confirmed, delete the existing file
        await deleteObject(storageRef);
        console.log(`Deleted existing file: ${file.name}`);

        // Remove the old file reference from the file list to avoid duplication
        setFileList((prevList) =>
          prevList.filter((file) => file.fullPath !== storageRef.fullPath)
        );
      }

      // Proceed with the upload
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
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFileList((prevList) => [
            ...prevList,
            { name: file!.name, url: downloadURL, fullPath: storageRef.fullPath },
          ]);

          // Add the file path to Firestore
          if (uploadTarget === "Department") {
            await addFileToFirestore(
              selectedCompany!.id,
              "Departments",
              selectedDepartment!.id,
              null,
              file!.name,
              storageRef.toString()
            );
          } else if (uploadTarget === "Buyer") {
            await addFileToFirestore(
              selectedCompany!.id,
              "Buyers",
              selectedBuyer!.id,
              selectedQuote!.id,
              file!.name,
              storageRef.toString()
            );
          }else{
            throw new Error("Invalid upload target");
          }
        }
      );
    } catch (error) {
      console.error("Error handling upload", error);
    }
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

    try {
      // Delete the file from Firebase Storage
      await deleteObject(fileRef);
      console.log(`Deleted file from Storage: ${fileFullPath}`);

      const pathParts = fileFullPath.split("/");
      const companyId = pathParts[1];

      // If deleting a Department file
      if (pathParts[2] === "Departments") {
        const departmentId = pathParts[3];
        const fileName = pathParts[pathParts.length - 1];

        const fileDocRef = doc(
          db,
          "Company",
          companyId,
          "Departments",
          departmentId,
          "files",
          fileName
        );
        await deleteDoc(fileDocRef);
        console.log(`Deleted Firestore document: ${fileName}`);

      } else if (pathParts[2] === "Buyers") {
        // If deleting a Buyer's Quote file
        const buyerId = pathParts[3];
        const quoteId = pathParts[5];
        const filePath = "gs://datum-115a.appspot.com/" + fileFullPath;

        const quoteDocRef = doc(
          db,
          "Company",
          companyId,
          "Buyers",
          buyerId,
          "Quotes",
          quoteId
        );

        // Remove the file path from the PDFs array
        await updateDoc(quoteDocRef, {
          PDFS: arrayRemove(filePath),
        });
        console.log(`Removed file path from PDFs array in Firestore: ${filePath}`);
      }

      // Update the file list
      setFileList((prevList) => prevList.filter((file) => file.fullPath !== fileFullPath));
    } catch (error) {
      console.error("Error deleting file or updating Firestore", error);
    }
  };

  // List files when component mounts
  useEffect(() => {
    listFiles();
  }, []);

  const listCompanies = async (): Promise<Company[]> => {
    const companiesRef = collection(db, "Company");
    const companyDocs = await getDocs(companiesRef);
    const companies = companyDocs.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Company, "id">),
    }));
    return companies;
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      const companiesData = await listCompanies();
      setCompanies(companiesData);
    };
    fetchCompanies();
  }, []);

  const listDepartments = async (companyId: string): Promise<Department[]> => {
    const departmentsRef = collection(db, "Company", companyId, "Departments");
    const departmentDocs = await getDocs(departmentsRef);
    const departments = departmentDocs.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Department, "id">),
    }));
    return departments;
  };

  const listBuyers = async (companyId: string): Promise<Buyer[]> => {
    const buyersRef = collection(db, "Company", companyId, "Buyers");
    const buyerDocs = await getDocs(buyersRef);
    const buyers = buyerDocs.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Buyer, "id">),
    }));
    return buyers;
  };

  const listQuotes = async (companyId: string, buyerId: string): Promise<Quote[]> => {
    const quotesRef = collection(db, "Company", companyId, "Buyers", buyerId, "Quotes");
    const quoteDocs = await getDocs(quotesRef);
    const quotes = quoteDocs.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    return quotes;
  };

  useEffect(() => {
    if (selectedCompany) {
      if (uploadTarget === "Department") {
        const fetchDepartments = async () => {
          const departmentsData = await listDepartments(selectedCompany.id);
          setDepartments(departmentsData);
          setSelectedDepartment(null);
          setSelectedBuyer(null);
          setSelectedQuote(null);
          setQuotes([]);
        };
        fetchDepartments();
      } else if (uploadTarget === "Buyer") {
        const fetchBuyers = async () => {
          const buyersData = await listBuyers(selectedCompany.id);
          setBuyers(buyersData);
          setSelectedDepartment(null);
          setSelectedBuyer(null);
          setSelectedQuote(null);
          setDepartments([]);
        };
        fetchBuyers();
      }
    } else {
      setDepartments([]);
      setBuyers([]);
      setSelectedDepartment(null);
      setSelectedBuyer(null);
      setSelectedQuote(null);
      setQuotes([]);
    }
  }, [selectedCompany, uploadTarget]);

  useEffect(() => {
    if (uploadTarget === "Buyer" && selectedCompany && selectedBuyer) {
      const fetchQuotes = async () => {
        const quotesData = await listQuotes(selectedCompany.id, selectedBuyer.id);
        setQuotes(quotesData);
        setSelectedQuote(null);
      };
      fetchQuotes();
    } else {
      setQuotes([]);
      setSelectedQuote(null);
    }
  }, [selectedCompany, selectedBuyer, uploadTarget]);

  useEffect(() => {
    setSelectedDepartment(null);
    setSelectedBuyer(null);
    setSelectedQuote(null);
    setQuotes([]);
  }, [uploadTarget]);

  const addFileToFirestore = async (
    companyId: string,
    collectionType: "Departments" | "Buyers",
    subCollectionId: string,
    subSubCollectionId: string | null,
    fileName: string,
    filePath: string
  ) => {
    if (collectionType === "Departments") {
      // For Departments, add a new document to the "files" collection
      const filesDocRef = doc(
        db,
        "Company",
        companyId,
        "Departments",
        subCollectionId,
        "files",
        fileName
      );
      await setDoc(filesDocRef, { fileName, filePath });
    } else if (collectionType === "Buyers") {
      if (!subSubCollectionId) {
        throw new Error("Quote ID is required when uploading to Buyers.");
      }
      // For Buyers, append the filePath to the PDFs array in the Quote document
      const quoteDocRef = doc(
        db,
        "Company",
        companyId,
        "Buyers",
        subCollectionId,
        "Quotes",
        subSubCollectionId
      );

      // Use arrayUnion to add the filePath to the PDFs array
      await updateDoc(quoteDocRef, {
        PDFS: arrayUnion(filePath),
      });
    } else {
      throw new Error("Invalid collection type");
    }
  };

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

        {/* Upload Target Selection */}
        <div>
          <label>
            <input
              type="radio"
              value="Department"
              checked={uploadTarget === "Department"}
              onChange={() => setUploadTarget("Department")}
            />
            Department
          </label>
          <label>
            <input
              type="radio"
              value="Buyer"
              checked={uploadTarget === "Buyer"}
              onChange={() => setUploadTarget("Buyer")}
            />
            Buyer
          </label>
        </div>

        {/* Company Selection */}
        <select
          value={selectedCompany?.id || ""}
          onChange={(e) => {
            const company = companies.find((c) => c.id === e.target.value) || null;
            setSelectedCompany(company);
            setSelectedDepartment(null); // Reset department selection when company changes
            setSelectedBuyer(null); // Reset buyer selection when company changes
            setSelectedQuote(null);
            setQuotes([]);
          }}
        >
          <option value="" disabled>
            Select Company
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        {/* Department or Buyer Selection */}
        {uploadTarget === "Department" && selectedCompany && (
          <select
            value={selectedDepartment?.id || ""}
            onChange={(e) => {
              const department = departments.find((d) => d.id === e.target.value) || null;
              setSelectedDepartment(department);
            }}
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        )}

        {uploadTarget === "Buyer" && selectedCompany && (
          <>
            <select
              value={selectedBuyer?.id || ""}
              onChange={(e) => {
                const buyer = buyers.find((b) => b.id === e.target.value) || null;
                setSelectedBuyer(buyer);
                setSelectedQuote(null);
                setQuotes([]);
              }}
            >
              <option value="" disabled>
                Select Buyer
              </option>
              {buyers.map((buyer) => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.name}
                </option>
              ))}
            </select>

            {/* Quote Selection */}
            {selectedBuyer && (
              <select
                value={selectedQuote?.id || ""}
                onChange={(e) => {
                  const quote = quotes.find((q) => q.id === e.target.value) || null;
                  setSelectedQuote(quote);
                }}
              >
                <option value="" disabled>
                  Select Quote
                </option>
                {quotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.name}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

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
              <button onClick={() => deleteFile(file.fullPath)}>Delete</button>{" "}
              {/* Delete by fullPath */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;