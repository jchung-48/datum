import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { storage, db } from "../../firebase";

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
  }
): Promise<void> => {
  if (!file) throw new Error("No file provided.");

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
        await updateFirestore(firestorePath, downloadURL, file.name);
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
    buyerId?: string;
    quoteId?: string;
  },
  downloadURL: string,
  fileName: string
) => {
  const { collectionType, companyId, departmentId, buyerId, quoteId } = firestorePath;

  if (collectionType === "Departments" && departmentId) {
    // Add file information to the "files" sub-collection under Departments
    const filesDocRef = doc(db, "Company", companyId, "Departments", departmentId, "files", fileName);
    await setDoc(filesDocRef, { fileName, download: downloadURL, filePath: `gs://datum-115a.appspot.com/Company/Departments/HR${fileName}` });
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
