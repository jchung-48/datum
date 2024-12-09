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

export const handleFileDelete = async (
    fileFullPath: string,
    firestorePath: FirestorePath,
): Promise<void> => {
    try {
        const fileRef = ref(storage, fileFullPath);

        const {
            collectionType,
            companyId,
            departmentId,
            collectionName,
            buyerId,
            manufacturerId,
        } = firestorePath;

        const fileName = fileFullPath.split('/').pop()!;

        if (collectionType === 'Departments' && departmentId) {
            const collectionNameForRef = collectionName
                ? collectionName
                : 'files';
            const fileDocRef = doc(
                db,
                'Company',
                companyId,
                'Departments',
                departmentId,
                collectionNameForRef,
                fileName,
            );
            await deleteDoc(fileDocRef);
        } else if (collectionType === 'Buyers' && buyerId) {
            const fileDocRef = doc(
                db,
                'Company',
                companyId,
                'Buyers',
                buyerId,
                'Quotes',
                fileName,
            );
            await deleteDoc(fileDocRef);
        } else if (collectionType === 'Manufacturers' && manufacturerId) {
            const fileDocRef = doc(
                db,
                'Company',
                companyId,
                'Manufacturers',
                manufacturerId,
                'Products',
                fileName,
            );
            await deleteDoc(fileDocRef);
        } else {
            throw new Error('Invalid Firestore path provided.');
        }

        await deleteObject(fileRef);

        console.log(`File deleted from Storage and Firestore: ${fileFullPath}`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

const getFirestoreRef = (
    collectionType: 'Departments' | 'Buyers' | 'Manufacturers',
    companyId: string,
    documentId: string,
    departmentId?: string,
    buyerId?: string,
    manufacturerId?: string,
    collectionName?: string,
) => {
    if (collectionType === 'Departments' && departmentId) {
        if (!collectionName) collectionName = 'files';
        return doc(
            db,
            'Company',
            companyId,
            'Departments',
            departmentId,
            collectionName,
            documentId,
        );
    } else if (collectionType === 'Buyers' && buyerId) {
        if (!collectionName) collectionName = 'Quotes';
        return doc(
            db,
            'Company',
            companyId,
            'Buyers',
            buyerId,
            collectionName,
            documentId,
        );
    } else if (collectionType === 'Manufacturers' && manufacturerId) {
        if (!collectionName) collectionName = 'Products';
        return doc(
            db,
            'Company',
            companyId,
            'Manufacturers',
            manufacturerId,
            collectionName,
            documentId,
        );
    } else {
        throw new Error('Invalid Firestore path provided.');
    }
};

export const moveDocument = async (
    sourcePath: FirestorePath,
    destinationPath: FirestorePath,
    documentId: string,
    copy = false,
): Promise<void> => {
    try {
        const sourceDocRef = getFirestoreRef(
            sourcePath.collectionType,
            sourcePath.companyId,
            documentId,
            sourcePath.departmentId,
            sourcePath.buyerId,
            sourcePath.manufacturerId,
            sourcePath.collectionName,
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
            destinationPath.collectionType,
            destinationPath.companyId,
            documentId,
            destinationPath.departmentId,
            destinationPath.buyerId,
            destinationPath.manufacturerId,
            destinationPath.collectionName,
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
