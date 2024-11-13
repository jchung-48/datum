import { moveDocument } from "../Upload/uploadUtils"; // Adjust the import path as needed
import { setDoc, getDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

jest.mock("firebase/firestore", () => ({
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
}));

describe("moveDocument", () => {
  const sourcePath = {
    collectionType: "Departments" as const,
    companyId: "testCompany",
    departmentId: "testDepartment",
    collectionName: "testFiles",
  };

  const destinationPath = {
    collectionType: "Buyers" as const,
    companyId: "testCompany",
    buyerId: "testBuyer",
    collectionName: "testQuotes",
  };

  const documentId = "testDocument";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("moves the document from the source to the destination collection", async () => {
    const documentData = { name: "Test File", content: "Sample content" };

    // Mock Firestore methods
    const mockDocSnapshot = { exists: () => true, data: () => documentData };
    (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);

    await moveDocument(sourcePath, destinationPath, documentId);

    // Check if getFirestoreRef was called correctly for source and destination paths
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      sourcePath.companyId,
      "Departments",
      sourcePath.departmentId,
      sourcePath.collectionName,
      documentId
    );

    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      destinationPath.companyId,
      "Buyers",
      destinationPath.buyerId,
      destinationPath.collectionName,
      documentId
    );

    // Check if the document was set at the destination path
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      documentData
    );

    // Check if the document was deleted from the source path
    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
  });

  it("throws an error if the document does not exist at the source path", async () => {
    // Mock the document not existing
    const mockDocSnapshot = { exists: () => false };
    (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);

    await expect(moveDocument(sourcePath, destinationPath, documentId)).rejects.toThrow("Document does not exist in the source collection");

    expect(setDoc).not.toHaveBeenCalled();
    expect(deleteDoc).not.toHaveBeenCalled();
  });
});
