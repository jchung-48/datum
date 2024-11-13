import { moveDocument } from './uploadUtils';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

describe('moveDocument', () => {
  const sourcePath = {
    collectionType: 'Departments' as const,
    companyId: 'testCompanyId',
    departmentId: 'testDepartmentId',
    documentId: 'testDocId',
  };

  const destinationPath = {
    collectionType: 'Buyers' as const,
    companyId: 'testCompanyId',
    buyerId: 'testBuyerId',
  };

  const mockDocData = {
    fileName: 'testFile.pdf',
    download: 'https://example.com/testFile.pdf',
    filePath: 'path/to/testFile.pdf',
  };

  const mockSourceDocRef = { id: 'sourceDocRef' };
  const mockDestinationDocRef = { id: 'destinationDocRef' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore references
    (doc as jest.Mock)
      .mockReturnValueOnce(mockSourceDocRef) // Source doc ref
      .mockReturnValueOnce(mockDestinationDocRef); // Destination doc ref

    // Mock getDoc to return a snapshot with data
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockDocData,
    });

    // Mock setDoc to resolve without error
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    // Mock deleteDoc to resolve without error
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('should move a document from source to destination', async () => {
    await moveDocument(sourcePath, destinationPath);

    // Ensure source and destination doc references are created correctly
    expect(doc).toHaveBeenNthCalledWith(1, db, 'Company', 'testCompanyId', 'Departments', 'testDepartmentId', 'files', 'testDocId');
    expect(doc).toHaveBeenNthCalledWith(2, db, 'Company', 'testCompanyId', 'Buyers', 'testBuyerId', 'Quotes', 'testDocId');

    // Ensure document data was retrieved
    expect(getDoc).toHaveBeenCalledWith(mockSourceDocRef);

    // Ensure document was added to the destination path with correct data
    expect(setDoc).toHaveBeenCalledWith(mockDestinationDocRef, mockDocData);

    // Ensure the source document was deleted
    expect(deleteDoc).toHaveBeenCalledWith(mockSourceDocRef);
  });

  it('should throw an error if the source document does not exist', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    await expect(moveDocument(sourcePath, destinationPath)).rejects.toThrow("Document does not exist in the source collection");

    // Ensure setDoc and deleteDoc are not called if document doesn't exist
    expect(setDoc).not.toHaveBeenCalled();
    expect(deleteDoc).not.toHaveBeenCalled();
  });
});
