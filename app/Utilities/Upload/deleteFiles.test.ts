import { handleFileDelete } from "./uploadUtils";
import { ref, deleteObject } from "firebase/storage";
import { doc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../../../lib/firebaseClient";

jest.mock("../../../lib/firebaseClient", () => ({
  storage: {}, // Mock storage
  db: {}, // Mock Firestore
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  deleteDoc: jest.fn(),
}));

describe("handleFileDelete", () => {
  const fileFullPath = "path/to/storage/testFile.txt";
  const firestorePath = {
    collectionType: "Departments" as const,
    companyId: "companyId123",
    departmentId: "departmentId123",
    buyerId: "",
    manufacturerId: "",
    collectionName: "customFiles",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes a file from Firebase Storage and Firestore for Departments collection", async () => {
    const mockFileRef = {};
    (ref as jest.Mock).mockReturnValue(mockFileRef);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await handleFileDelete(fileFullPath, firestorePath);

    // Verify Firebase Storage deletion
    expect(ref).toHaveBeenCalledWith(storage, fileFullPath);
    expect(deleteObject).toHaveBeenCalledWith(mockFileRef);

    // Verify Firestore document deletion
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      firestorePath.companyId,
      "Departments",
      firestorePath.departmentId,
      firestorePath.collectionName,
      "testFile.txt"
    );
    expect(deleteDoc).toHaveBeenCalled();
  });

  it("deletes a file from Firestore for Buyers collection", async () => {
    const buyersPath = {
      ...firestorePath,
      collectionType: "Buyers" as const,
      buyerId: "buyerId123",
      departmentId: "",
    };

    const mockFileRef = {};
    (ref as jest.Mock).mockReturnValue(mockFileRef);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await handleFileDelete(fileFullPath, buyersPath);

    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      buyersPath.companyId,
      "Buyers",
      buyersPath.buyerId,
      "Quotes",
      "testFile.txt"
    );
    expect(deleteDoc).toHaveBeenCalled();
  });

  it("deletes a file from Firestore for Manufacturers collection", async () => {
    const manufacturersPath = {
      ...firestorePath,
      collectionType: "Manufacturers" as const,
      manufacturerId: "manufacturerId123",
      departmentId: "",
    };

    const mockFileRef = {};
    (ref as jest.Mock).mockReturnValue(mockFileRef);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await handleFileDelete(fileFullPath, manufacturersPath);

    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      manufacturersPath.companyId,
      "Manufacturers",
      manufacturersPath.manufacturerId,
      "Products",
      "testFile.txt"
    );
    expect(deleteDoc).toHaveBeenCalled();
  });

  it("throws an error for an invalid Firestore path", async () => {
    const invalidPath = {
      ...firestorePath,
      collectionType: "InvalidType" as "Departments" | "Manufacturers" | "Buyers",
    };

    await expect(handleFileDelete(fileFullPath, invalidPath)).rejects.toThrow(
      "Invalid Firestore path provided."
    );

    expect(ref).toHaveBeenCalledWith(storage, fileFullPath);
    expect(deleteObject).not.toHaveBeenCalled();
    expect(doc).not.toHaveBeenCalled();
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it("handles errors during file deletion from Firebase Storage", async () => {
    const mockFileRef = {};
    (ref as jest.Mock).mockReturnValue(mockFileRef);
    (deleteObject as jest.Mock).mockRejectedValue(new Error("Storage deletion error"));

    await expect(handleFileDelete(fileFullPath, firestorePath)).rejects.toThrow(
      "Storage deletion error"
    );

    expect(ref).toHaveBeenCalledWith(storage, fileFullPath);
    expect(deleteObject).toHaveBeenCalledWith(mockFileRef);
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      firestorePath.companyId,
      "Departments",
      firestorePath.departmentId,
      firestorePath.collectionName,
      "testFile.txt"
    );
    expect(deleteDoc).toHaveBeenCalled();
  });

  it("handles errors during Firestore document deletion", async () => {
    const mockFileRef = {};
    (ref as jest.Mock).mockReturnValue(mockFileRef);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockRejectedValue(new Error("Firestore deletion error"));

    await expect(handleFileDelete(fileFullPath, firestorePath)).rejects.toThrow(
      "Firestore deletion error"
    );

    expect(ref).toHaveBeenCalledWith(storage, fileFullPath);
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      firestorePath.companyId,
      "Departments",
      firestorePath.departmentId,
      firestorePath.collectionName,
      "testFile.txt"
    );
    expect(deleteDoc).toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
