// uploadUtils.ts

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, getDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { storage, db, auth } from "@/lib/firebaseClient";
// import { FirestorePath} from 'app/types/uploadTypes';

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
    const confirmReplace = window.confirm(
      `A file named "${file.name}" already exists. Do you want to replace it?`
    );
    if (!confirmReplace) throw new Error("Upload cancelled by user"); // Cancel upload if not confirmed

    await deleteObject(storageRef); // Delete existing file
  }

  // Include metadata with uploadedBy
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }

  const metadata = {
    customMetadata: {
      uploadedBy: user.uid,
    },
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
  const {
    collectionType,
    companyId,
    departmentId,
    customCollectionName,
    buyerId,
    manufacturerId,
  } = firestorePath;

  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }

  const timestamp = Timestamp.now();

  if (collectionType === "Departments" && departmentId) {
    // Use custom collection name if provided, otherwise default to "files"
    const collectionName = customCollectionName ? customCollectionName : "files";
    const filesDocRef = doc(
      db,
      "Company",
      companyId,
      "Departments",
      departmentId,
      collectionName,
      fileName
    );
    await setDoc(filesDocRef, {
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: user.uid,
      userDisplayName: user.displayName,
      uploadTimeStamp: timestamp,
      tags: [],
    });
  } else if (collectionType === "Buyers" && buyerId) {
    const quoteDocRef = doc(
      db,
      "Company",
      companyId,
      "Buyers",
      buyerId,
      "Quotes",
      fileName
    );
    await setDoc(quoteDocRef, {
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: user.uid,
      userDisplayName: user.displayName,
      uploadTimeStamp: timestamp,
      tags: [],
    });
  } else if (collectionType === "Manufacturers" && manufacturerId) {
    const productDocRef = doc(
      db,
      "Company",
      companyId,
      "Manufacturers",
      manufacturerId,
      "Products",
      fileName
    );
    await setDoc(productDocRef, {
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: user.uid,
      userDisplayName: user.displayName,
      uploadTimeStamp: timestamp,
      tags: [],
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
    collectionType: "Departments" | "Buyers" | "Manufacturers";
    companyId: string;
    departmentId?: string;
    collectionName?: string;
    buyerId?: string;
    manufacturerId?: string;
  }
): Promise<void> => {
  try {
    // Delete the file from Firebase Storage
    const fileRef = ref(storage, fileFullPath);
    await deleteObject(fileRef);

    // Delete the file entry from Firestore
    const {
      collectionType,
      companyId,
      departmentId,
      collectionName,
      buyerId,
      manufacturerId,
    } = firestorePath;

    const fileName = fileFullPath.split("/").pop()!;

    if (collectionType === "Departments" && departmentId) {
      const collectionNameForRef = collectionName ? collectionName : "files";
      const fileDocRef = doc(
        db,
        "Company",
        companyId,
        "Departments",
        departmentId,
        collectionNameForRef,
        fileName
      );
      await deleteDoc(fileDocRef);
    } else if (collectionType === "Buyers" && buyerId) {
      const fileDocRef = doc(
        db,
        "Company",
        companyId,
        "Buyers",
        buyerId,
        "Quotes",
        fileName
      );
      await deleteDoc(fileDocRef);
    } else if (collectionType === "Manufacturers" && manufacturerId) {
      const fileDocRef = doc(
        db,
        "Company",
        companyId,
        "Manufacturers",
        manufacturerId,
        "Products",
        fileName
      );
      await deleteDoc(fileDocRef);
    } else {
      throw new Error("Invalid Firestore path provided.");
    }

    console.log(`File deleted from Storage and Firestore: ${fileFullPath}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error; // Re-throw the error to be handled by the calling function
  }
};

const getFirestoreRef = (
  collectionType: "Departments" | "Buyers" | "Manufacturers",
  companyId: string,
  documentId: string,
  departmentId?: string,
  buyerId?: string,
  manufacturerId?: string,
) => {
  if (collectionType === "Departments" && departmentId) {
    return doc(db, "Company", companyId, "Departments", departmentId, "files", documentId);
  } else if (collectionType === "Buyers" && buyerId) {
    return doc(db, "Company", companyId, "Buyers", buyerId, "Quotes", documentId);
  } else if (collectionType === "Manufacturers" && manufacturerId) {
    return doc(db, "Company", companyId, "Manufacturers", manufacturerId, "Products", documentId);
  } else {
    throw new Error("Invalid Firestore path provided.");
  }
};

export const moveDocument = async (
  sourcePath: {
    collectionType: "Departments" | "Buyers" | "Manufacturers";
    companyId: string;
    departmentId?: string;
    buyerId?: string;
    manufacturerId?: string;
    documentId: string;
  },
  destinationPath: {
    collectionType: "Departments" | "Buyers" | "Manufacturers";
    companyId: string;
    departmentId?: string;
    buyerId?: string;
    manufacturerId?: string;
  }
): Promise<void> => {
  try {
    // Get the document from the source path
    const { collectionType, companyId, departmentId, buyerId, manufacturerId, documentId } = sourcePath;
    const sourceDocRef = getFirestoreRef(collectionType, companyId, departmentId, buyerId, manufacturerId, documentId);
    const docSnapshot = await getDoc(sourceDocRef);

    if (!docSnapshot.exists()) {
      throw new Error("Document does not exist in the source collection.");
    }

    const documentData = docSnapshot.data();

    // Set the document in the destination path
    const destinationDocRef = getFirestoreRef(
      destinationPath.collectionType,
      destinationPath.companyId,
      documentId,
      destinationPath.departmentId,
      destinationPath.buyerId,
      destinationPath.manufacturerId
    );
    await setDoc(destinationDocRef, documentData);

    // Delete the document from the source path
    await deleteDoc(sourceDocRef);
    console.log(`Document ${documentId} moved successfully.`);
  } catch (error) {
    console.error("Error moving document:", error);
    throw error;
  }
};