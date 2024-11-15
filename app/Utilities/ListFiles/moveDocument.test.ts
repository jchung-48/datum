import { moveDocument } from "../Upload/uploadUtils";
import { setDoc, getDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({ /* Mock Firestore object */ })),
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

  const destinationPathSameCollection = {
    collectionType: "Departments" as const,
    companyId: "testCompany",
    departmentId: "testDepartment",
    collectionName: "otherFiles",
  };

  const destinationPathDifferentCollection = {
    collectionType: "Buyers" as const,
    companyId: "testCompany",
    buyerId: "testBuyer",
    collectionName: "testQuotes",
  };

  const documentId = "testDocument";
  const documentData = { name: "Test File", content: "Sample content" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("moves the document within the same collection without changing storage", async () => {
    // Simulate document existing in source collection
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => documentData,
    });

    await moveDocument(sourcePath, destinationPathSameCollection, documentId, { moveFile: true });

    expect(setDoc).toHaveBeenCalledWith(expect.anything(), documentData);
    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
    expect(getDoc).toHaveBeenCalledTimes(1);  // Called once to get source document
  });

  it("copies the document without deleting it from the source collection", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => documentData,
    });

    await moveDocument(sourcePath, destinationPathSameCollection, documentId, { moveFile: false });

    expect(setDoc).toHaveBeenCalledWith(expect.anything(), documentData);
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it("moves the document to a different collection, including changing storage location", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => documentData,
    });

    await moveDocument(sourcePath, destinationPathDifferentCollection, documentId, { copy: true });

    expect(setDoc).toHaveBeenCalledWith(expect.anything(), documentData);
    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
  });

  it("throws an error if the document does not exist in the source collection", async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    await expect(
      moveDocument(sourcePath, destinationPathDifferentCollection, documentId, { moveFile: true })
    ).rejects.toThrow("Document does not exist in the source collection");

    expect(setDoc).not.toHaveBeenCalled();
    expect(deleteDoc).not.toHaveBeenCalled();
  });
});
