import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    uploadBytes,
} from 'firebase/storage';
import {doc, setDoc, getDoc, deleteDoc, Timestamp} from 'firebase/firestore';
import {storage, db, auth} from '@/lib/firebaseClient';
import {FirestorePath} from '@/app/types';

/**
 * uploadFileToStorage
 * 
 * @param {File} file - The file to be uploaded to storage.
 * @param {string} storagePath - The path in the storage where the file will be uploaded.
 * @returns {Promise<string>} - A promise resolving to the download URL of the uploaded file.
 * 
 * Uploads a file to Firebase Storage, handling cases where the file already exists and prompting 
 * the user to confirm replacement.
 */
export const uploadFileToStorage = async (
    file: File,
    storagePath: string,
): Promise<string> => {
    if (!file) throw new Error('No file provided.');
    console.log('upload storage path', storagePath);

    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated.');
    }

    const storageRef = ref(storage, storagePath);

    const existingFile = await getDownloadURL(storageRef).catch(error => {
        if (error.code === 'storage/object-not-found') {
            return null;
        }
        throw error;
    });

    if (existingFile) {
        const confirmReplace = window.confirm(
            `A file named "${file.name}" already exists. Do you want to replace it?`,
        );
        if (!confirmReplace) throw new Error('Upload cancelled by user');

        await deleteObject(storageRef);
    }

    const metadata = {
        customMetadata: {
            uploadedBy: user.uid,
        },
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            snapshot => {
                const progress =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            error => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(
                    uploadTask.snapshot.ref,
                );
                resolve(downloadURL);
            },
        );
    });
};

/**
 * updateFirestore
 * 
 * @param {FirestorePath} firestorePath - The path where the file will be stored in Firestore.
 * @param {string} downloadURL - The URL of the uploaded file.
 * @param {string} fileName - The name of the file to be stored in Firestore.
 * @param {string} storagePath - The path of the file in Firebase Storage.
 * @returns {Promise<void>} - A promise that resolves once the file has been added to Firestore.
 * 
 * Updates Firestore with file metadata based on the provided Firestore path. Handles different
 * collection types such as 'Departments', 'Buyers', and 'Manufacturers'.
 */
export const updateFirestore = async (
    firestorePath: FirestorePath,
    downloadURL: string,
    fileName: string,
    storagePath: string,
) => {
    const {
        collectionType,
        companyId,
        departmentId,
        buyerId,
        manufacturerId,
        collectionName,
    } = firestorePath;

    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated.');
    }

    const timestamp = Timestamp.now();

    if (collectionType === 'Departments' && departmentId) {
        const filesDocRef = doc(
            db,
            'Company',
            companyId,
            'Departments',
            departmentId,
            collectionName ? collectionName : 'files',
            fileName,
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
    } else if (collectionType === 'Buyers' && buyerId) {
        const quoteDocRef = doc(
            db,
            'Company',
            companyId,
            'Buyers',
            buyerId,
            'Quotes',
            fileName,
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
    } else if (collectionType === 'Manufacturers' && manufacturerId) {
        const productDocRef = doc(
            db,
            'Company',
            companyId,
            'Manufacturers',
            manufacturerId,
            'Products',
            fileName,
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
        throw new Error('Invalid Firestore path provided.');
    }

    console.log(`File added to Firestore: ${fileName}`);
};

/**
 * getFirestoreRef
 * 
 * @param {FirestorePath} firestorePath - The Firestore path containing the collection and document details.
 * @param {string} documentId - The ID of the document to retrieve a reference for.
 * @returns {DocumentReference} - A Firestore document reference for the specified collection and document.
 * 
 * Returns a Firestore document reference based on the provided Firestore path and document ID. 
 * Supports 'Departments', 'Buyers', and 'Manufacturers' collection types with dynamic collection 
 * names.
 */
const getFirestoreRef = (
    firestorePath: FirestorePath,
    documentId: string,
) => {
    if (firestorePath.collectionType === 'Departments' && firestorePath.departmentId) {
        if (!firestorePath.collectionName) firestorePath.collectionName = 'files';
        return doc(
            db,
            'Company',
            firestorePath.companyId,
            'Departments',
            firestorePath.departmentId,
            firestorePath.collectionName,
            documentId,
        );
    } else if (firestorePath.collectionType === 'Buyers' && firestorePath.buyerId) {
        if (!firestorePath.collectionName) firestorePath.collectionName = 'Quotes';
        return doc(
            db,
            'Company',
            firestorePath.companyId,
            'Buyers',
            firestorePath.buyerId,
            'Quotes',
            documentId,
        );
    } else if (firestorePath.collectionType === 'Manufacturers' && firestorePath.manufacturerId) {
        if (!firestorePath.collectionName) firestorePath.collectionName = 'Products';
        return doc(
            db,
            'Company',
            firestorePath.companyId,
            'Manufacturers',
            firestorePath.manufacturerId,
            'Products',
            documentId,
        );
    } else {
        throw new Error('Invalid Firestore path provided.');
    }
};

/**
 * handleFileDelete
 * 
 * @param {string} fileFullPath - The full path of the file in Firebase Storage to be deleted.
 * @param {FirestorePath} firestorePath - The Firestore path containing the collection and document details for deletion.
 * @returns {Promise<void>} - A promise that resolves once the file has been deleted from both Firestore and Storage.
 * 
 * Deletes a file from Firebase Storage and Firestore based on the provided file path and Firestore path.
 */
export const handleFileDelete = async (
    fileFullPath: string,
    firestorePath: FirestorePath,
): Promise<void> => {
    try {
        const fileRef = ref(storage, fileFullPath);

        const fileName = fileFullPath.split('/').pop()!;

        const fileDocRef = getFirestoreRef(
            firestorePath,
            fileName,
        );

        await deleteDoc(fileDocRef);
        await deleteObject(fileRef);

        console.log(`File deleted from Storage and Firestore: ${fileFullPath}`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

/**
 * moveDocument
 * 
 * @param sourcePath - The source Firestore path for the document.
 * @param destinationPath - The destination Firestore path for the document.
 * @param documentId - The ID of the document to move or copy.
 * @param copy - A flag indicating whether to copy the document (defaults to false).
 * 
 * @returns {Promise<void>} - A promise that resolves when the document has been moved or copied.
 * 
 * Moves or copies a document from one Firestore location to another, including the associated file in storage.
 */
export const moveDocument = async (
    sourcePath: FirestorePath,
    destinationPath: FirestorePath,
    documentId: string,
    copy = false,
): Promise<void> => {
    try {
        const sourceDocRef = getFirestoreRef(
            sourcePath,
            documentId,
        );
        console.log(sourceDocRef);
        const docSnapshot = await getDoc(sourceDocRef);

        if (!docSnapshot.exists()) {
            throw new Error(
                'Document does not exist in the source collection.',
            );
        }

        const documentData = docSnapshot.data();

        const isSameDirectory =
            sourcePath.companyId === destinationPath.companyId &&
            sourcePath.collectionType === destinationPath.collectionType &&
            sourcePath.departmentId === destinationPath.departmentId &&
            sourcePath.buyerId === destinationPath.buyerId &&
            sourcePath.manufacturerId === destinationPath.manufacturerId;

        if (!isSameDirectory) {
            const filePath = documentData.filePath;
            const fileRef = ref(storage, filePath);
            const fileURL = await getDownloadURL(fileRef);

            const response = await fetch(fileURL);
            const fileBlob = await response.blob();

            let departmentName = undefined;

            if (
                destinationPath.collectionType === 'Departments' &&
                destinationPath.departmentId
            ) {
                const departmentDocRef = doc(
                    db,
                    'Company',
                    destinationPath.companyId,
                    'Departments',
                    destinationPath.departmentId,
                );
                const departmentDocSnapshot = await getDoc(departmentDocRef);

                if (departmentDocSnapshot.exists()) {
                    departmentName = departmentDocSnapshot.data().name;
                    departmentName = departmentName.replace(' ', '');
                }
            }

            const newStoragePath = `Company/${destinationPath.collectionType}/${
                departmentName ||
                destinationPath.buyerId ||
                destinationPath.manufacturerId
            }/${documentId}`;

            const destinationFileRef = ref(storage, newStoragePath);

            try {
                await getDownloadURL(destinationFileRef);
                console.log("File already exists at destination.");
                throw new Error('File already exists at destination.');
            } catch (error) {
                const firebaseError = error as { code: string };

                if (firebaseError.code === 'storage/object-not-found') {
                    console.log("File does not exist at the new location, proceeding with upload.");
                } else {
                    throw error;
                }
            }

            await uploadBytes(destinationFileRef, fileBlob);

            documentData.filePath = newStoragePath;

            if (!copy) {
                await deleteObject(fileRef);
            }
        } else {
            if (copy) {
                throw new Error(
                    'Copying to directory in the same department not permitted.',
                );
            }
        }

        const destinationDocRef = getFirestoreRef(
            destinationPath,
            documentId,
        );
        await setDoc(destinationDocRef, documentData);

        if (!copy) {
            await deleteDoc(sourceDocRef);
            console.log(`Document ${documentId} moved successfully.`);
        } else {
            console.log(`Document ${documentId} copied successfully.`);
        }
    } catch (error) {
        console.error('Error moving/copying document:', error);
        throw error;
    }
};
