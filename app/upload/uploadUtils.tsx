import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from "firebase/firestore";
import { storage, db } from "../../firebase";

// Function to upload file to Firebase Storage and return the download URL
export const uploadFileToStorage = async (
  file: File,
  storagePath: string
): Promise<string> => {
  if (!file) throw new Error("No file provided.");
  console.log("upload storage path", storagePath);
  const storageRef = ref(storage, storagePath);

  // Check if a file with the same name exists
  const existingFile = await getDownloadURL(storageRef).catch((error) => {
    if (error.code === "storage/object-not-found") {
      return null; // File doesn't exist
    }
    throw error;
  });

  if (existingFile) {
    const confirmReplace = window.confirm(`A file named "${file.name}" already exists. Do you want to replace it?`);
    if (!confirmReplace) throw new Error('Upload cancelled by user'); // Cancel upload if not confirmed

    await deleteObject(storageRef); // Delete existing file
  }

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

// Function to update Firestore based on the uploaded file
export const updateFirestore = async (
  firestorePath: {
    collectionType: "Departments" | "Buyers" | "Manufacturers";
    companyId: string;
    departmentId?: string;
    customCollectionName?: string; // Custom collection name
    buyerId?: string;
    manufacturerId?: string;
  },
  downloadURL: string,
  fileName: string,
  storagePath: string
) => {
  const { collectionType, companyId, departmentId, customCollectionName, buyerId, manufacturerId } = firestorePath;

  if (collectionType === "Departments" && departmentId) {
    // Use custom collection name if provided, otherwise default to "files"
    const collectionName = customCollectionName || "files";
    const filesDocRef = doc(db, "Company", companyId, "Departments", departmentId, collectionName, fileName);
    await setDoc(filesDocRef, { fileName, download: downloadURL, filePath: storagePath });
  } else if (collectionType === "Buyers" && buyerId ) {
    // Add file information to the PDFs array under the specific Quote in Buyers
    const quoteDocRef = doc(db, "Company", companyId, "Buyers", buyerId, "Quotes", fileName);
    await setDoc(quoteDocRef, { fileName, download: downloadURL, filePath: storagePath });
  } else if (collectionType === "Manufacturers" && manufacturerId ) {
    // Add file information to the PDFs array under the specific Quote in Buyers
    const productDocRef = doc(db, "Company", companyId, "Manufacturers", manufacturerId, "Products", fileName);
    await setDoc(productDocRef, { fileName, download: downloadURL, filePath: storagePath });
  } else {
    throw new Error("Invalid Firestore path provided.");
  }

  console.log(`File added to Firestore: ${fileName}`);
};

// Function to delete a file from Firebase Storage and Firestore
export const handleFileDelete = async (
  fileFullPath: string,
  firestorePath: {
    collectionType: "Departments" | "Buyers";
    companyId: string;
    departmentId?: string;
    buyerId?: string;
    quoteId?: string;
  }
): Promise<void> => {
  // Existing code remains unchanged
};
