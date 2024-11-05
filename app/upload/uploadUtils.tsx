import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from "firebase/firestore";
import { storage, db } from "../../lib/firebaseClient";

// Function to upload files and update Firestore
export const handleFileUpload = async (
  file: File,
  storagePath: string,
  firestorePath: {
    collectionType: "Departments" | "Buyers";
    companyId: string;
    departmentId?: string;
    buyerId?: string;
    quoteId?: string;
    customCollectionName?: string; // Add custom collection name
  }
): Promise<void> => {
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
    if (!confirmReplace) return; // Cancel upload if not confirmed

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
        await updateFirestore(firestorePath, downloadURL, file.name, storagePath);
        resolve();
      }
    );
  });
};

// Function to update Firestore based on the uploaded file
const updateFirestore = async (
  firestorePath: {
    collectionType: "Departments" | "Buyers";
    companyId: string;
    departmentId?: string;
    customCollectionName?: string; // Add custom collection name
    buyerId?: string;
    quoteId?: string;
  },
  downloadURL: string,
  fileName: string,
  storagePath: string
) => {
  const { collectionType, companyId, departmentId, customCollectionName, buyerId, quoteId } = firestorePath;

  if (collectionType === "Departments" && departmentId) {
    // Use custom collection name if provided, otherwise default to "files"
    const collectionName = customCollectionName || "files";
    const filesDocRef = doc(db, "Company", companyId, "Departments", departmentId, collectionName, fileName);
    await setDoc(filesDocRef, { fileName, download: downloadURL, filePath: storagePath });
  } else if (collectionType === "Buyers" && buyerId && quoteId) {
    // Add file information to the PDFs array under the specific Quote in Buyers
    const quoteDocRef = doc(db, "Company", companyId, "Buyers", buyerId, "Quotes", quoteId);
    await updateDoc(quoteDocRef, {
      PDFS: arrayUnion(downloadURL),
    });
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
  try {
    // Delete from Firebase Storage
    const fileRef = ref(storage, fileFullPath);
    await deleteObject(fileRef);
    console.log(`File deleted from Firebase Storage: ${fileFullPath}`);

    // Extract file name from the full path
    const fileName = fileFullPath.split("/").pop();
    const { collectionType, companyId, departmentId, buyerId, quoteId } = firestorePath;

    if (collectionType === "Departments" && departmentId) {
      // Delete from the "files" sub-collection under Departments
      const filesDocRef = doc(
        db,
        "Company",
        companyId,
        "Departments",
        departmentId,
        "files",
        fileName!
      );
      await deleteDoc(filesDocRef);
      console.log(`File document deleted from Firestore: ${fileName}`);
    } else if (collectionType === "Buyers" && buyerId && quoteId) {
      // Remove the file URL from the "PDFS" array in the specific Quote document
      const quoteDocRef = doc(
        db,
        "Company",
        companyId,
        "Buyers",
        buyerId,
        "Quotes",
        quoteId
      );

      // Construct the full path URL for comparison
      const filePath = `gs://datum-115a.appspot.com/${fileFullPath}`;

      await updateDoc(quoteDocRef, {
        PDFS: arrayRemove(filePath),
      });
      console.log(`File path removed from PDFs array in Firestore: ${filePath}`);
    } else {
      throw new Error("Invalid Firestore path provided for deletion.");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error; // Re-throw error for handling in the calling component
  }
};