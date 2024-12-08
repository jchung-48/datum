import {updateFirestore, uploadFileToStorage} from './uploadUtils';
import {
    ref,
    getDownloadURL,
    uploadBytesResumable,
    deleteObject,
} from 'firebase/storage';
import {auth} from '../../../lib/firebaseClient';
import {doc, setDoc} from 'firebase/firestore';
import {db} from '../../../lib/firebaseClient';

jest.mock('../../../lib/firebaseClient', () => ({
    auth: {currentUser: {uid: 'test-user-id', displayName: 'Test User'}},
    db: {},
    storage: {},
}));

jest.mock('firebase/storage', () => ({
    ref: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn(),
    uploadBytesResumable: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
    Timestamp: {
        now: jest.fn().mockReturnValue('mock-timestamp'),
    },
}));

global.confirm = jest.fn();

describe('File Upload and Firestore Update', () => {
    const mockFile = new File(['file content'], 'testFile.txt', {
        type: 'text/plain',
    });
    const storagePath = 'path/to/storage';
    const firestorePath = {
        collectionType: 'Departments' as const,
        companyId: 'companyId123',
        departmentId: 'departmentId123',
        buyerId: '',
        manufacturerId: '',
        collectionName: 'customFiles',
    };
    const fileName = 'testFile.txt';
    const downloadURL = 'https://example.com/testFile.txt';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth.currentUser as any) = {
            uid: 'test-user-id',
            displayName: 'Test User',
        };
    });

    it('uploads a file and updates Firestore with the correct download URL', async () => {
        const mockStorageRef = {};
        const mockUploadTask = {
            on: jest.fn((_, __, ___, complete) => complete()),
            snapshot: {ref: {}},
        };
        (ref as jest.Mock).mockReturnValue(mockStorageRef);
        (uploadBytesResumable as jest.Mock).mockReturnValue(mockUploadTask);
        (getDownloadURL as jest.Mock).mockResolvedValue(downloadURL);
        (global.confirm as jest.Mock).mockReturnValueOnce(true);

        const mockDocRef = {};
        (doc as jest.Mock).mockReturnValue(mockDocRef);
        (setDoc as jest.Mock).mockResolvedValue(undefined);

        const result = await uploadFileToStorage(mockFile, storagePath);
        expect(ref).toHaveBeenCalledWith(expect.anything(), storagePath);
        expect(uploadBytesResumable).toHaveBeenCalledWith(
            mockStorageRef,
            mockFile,
            {
                customMetadata: {uploadedBy: 'test-user-id'},
            },
        );

        expect(result).toBe(downloadURL);

        await updateFirestore(
            firestorePath,
            downloadURL,
            fileName,
            storagePath,
        );

        expect(doc).toHaveBeenCalledWith(
            db,
            'Company',
            firestorePath.companyId,
            'Departments',
            firestorePath.departmentId,
            firestorePath.collectionName,
            fileName,
        );

        expect(setDoc).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                fileName,
                download: downloadURL,
                filePath: storagePath,
                uploadedBy: 'test-user-id',
                userDisplayName: 'Test User',
                uploadTimeStamp: 'mock-timestamp',
                tags: [],
            }),
        );
    });

    it('throws an error if the user is not authenticated during upload or Firestore update', async () => {
        (auth as any).currentUser = null;

        await expect(
            uploadFileToStorage(mockFile, storagePath),
        ).rejects.toThrow('User not authenticated.');

        await expect(
            updateFirestore(firestorePath, downloadURL, fileName, storagePath),
        ).rejects.toThrow('User not authenticated.');
    });

    it('throws an error if collectionType is invalid in Firestore update', async () => {
        const invalidPath = {
            ...firestorePath,
            collectionType: 'InvalidType' as
                | 'Departments'
                | 'Manufacturers'
                | 'Buyers',
        };

        await expect(
            updateFirestore(invalidPath, downloadURL, fileName, storagePath),
        ).rejects.toThrow('Invalid Firestore path provided.');
    });

    it('cancels upload if user declines file replacement', async () => {
        const mockStorageRef = {};
        const mockDownloadURL = 'https://example.com/testFile.txt';
        (ref as jest.Mock).mockReturnValue(mockStorageRef);
        (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
        (global.confirm as jest.Mock).mockReturnValue(false);

        await expect(
            uploadFileToStorage(mockFile, storagePath),
        ).rejects.toThrow('Upload cancelled by user');
        expect(deleteObject).not.toHaveBeenCalled();
    });

    it('updates Firestore for Departments collection type', async () => {
        const mockDocRef = {};
        (doc as jest.Mock).mockReturnValue(mockDocRef);
        (setDoc as jest.Mock).mockResolvedValue({});

        await updateFirestore(
            firestorePath,
            downloadURL,
            fileName,
            storagePath,
        );

        expect(doc).toHaveBeenCalledWith(
            db,
            'Company',
            firestorePath.companyId,
            'Departments',
            firestorePath.departmentId,
            firestorePath.collectionName,
            fileName,
        );
        expect(setDoc).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                fileName,
                download: downloadURL,
                filePath: storagePath,
                uploadedBy: 'test-user-id',
                userDisplayName: 'Test User',
                uploadTimeStamp: 'mock-timestamp',
                tags: [],
            }),
        );
    });

    it('updates Firestore for Buyers collection type', async () => {
        const buyersPath = {
            ...firestorePath,
            collectionType: 'Buyers' as const,
            buyerId: 'buyerId123',
            departmentId: '',
        };
        const mockDocRef = {};
        (doc as jest.Mock).mockReturnValue(mockDocRef);
        (setDoc as jest.Mock).mockResolvedValue({});

        await updateFirestore(buyersPath, downloadURL, fileName, storagePath);

        expect(doc).toHaveBeenCalledWith(
            db,
            'Company',
            buyersPath.companyId,
            'Buyers',
            buyersPath.buyerId,
            'Quotes',
            fileName,
        );
        expect(setDoc).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                fileName,
                download: downloadURL,
                filePath: storagePath,
                uploadedBy: 'test-user-id',
                userDisplayName: 'Test User',
                uploadTimeStamp: 'mock-timestamp',
                tags: [],
            }),
        );
    });

    it('updates Firestore for Manufacturers collection type', async () => {
        const manufacturersPath = {
            ...firestorePath,
            collectionType: 'Manufacturers' as const,
            manufacturerId: 'manufacturerId123',
            departmentId: '',
        };
        const mockDocRef = {};
        (doc as jest.Mock).mockReturnValue(mockDocRef);
        (setDoc as jest.Mock).mockResolvedValue({});

        await updateFirestore(
            manufacturersPath,
            downloadURL,
            fileName,
            storagePath,
        );

        expect(doc).toHaveBeenCalledWith(
            db,
            'Company',
            manufacturersPath.companyId,
            'Manufacturers',
            manufacturersPath.manufacturerId,
            'Products',
            fileName,
        );
        expect(setDoc).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                fileName,
                download: downloadURL,
                filePath: storagePath,
                uploadedBy: 'test-user-id',
                userDisplayName: 'Test User',
                uploadTimeStamp: 'mock-timestamp',
                tags: [],
            }),
        );
    });

    it('throws an error if collectionType is invalid', async () => {
        const invalidPath = {
            ...firestorePath,
            collectionType: 'InvalidType' as
                | 'Departments'
                | 'Manufacturers'
                | 'Buyers',
        };

        await expect(
            updateFirestore(invalidPath, downloadURL, fileName, storagePath),
        ).rejects.toThrow('Invalid Firestore path provided.');
    });

    it('throws an error if no file is provided', async () => {
        await expect(
            uploadFileToStorage(null as unknown as File, storagePath),
        ).rejects.toThrow('No file provided.');
    });

    it('prompts the user to replace an existing file', async () => {
        const mockStorageRef = {};
        const mockDownloadURL = 'https://example.com/testFile.txt';
        (ref as jest.Mock).mockReturnValue(mockStorageRef);
        (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
        (global.confirm as jest.Mock).mockReturnValue(true);
        (deleteObject as jest.Mock).mockResolvedValue({});

        const result = await uploadFileToStorage(mockFile, storagePath);
        expect(global.confirm).toHaveBeenCalledWith(
            `A file named "testFile.txt" already exists. Do you want to replace it?`,
        );
        expect(deleteObject).toHaveBeenCalledWith(mockStorageRef);
        expect(result).toBe(mockDownloadURL);
    });
});
