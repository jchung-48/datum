import { updateFirestore } from "./uploadUtils"; // Adjust import path if needed
import { db, auth } from "../../../lib/firebaseClient"; // Adjust import path if needed
import { doc, setDoc } from "firebase/firestore"; // Firebase Firestore methods

jest.mock("../../../lib/firebaseClient", () => ({
  auth: { currentUser: { uid: "test-user-id", displayName: "Test User" } },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: {
    now: jest.fn().mockReturnValue("mock-timestamp"),
  },
}));

describe("updateFirestore", () => {
  const firestorePath = {
    collectionType: "Departments" as const,
    companyId: "companyId123",
    departmentId: "departmentId123",
    buyerId: "",
    manufacturerId: "",
    collectionName: "customFiles",
  };
  const downloadURL = "https://example.com/file";
  const fileName = "testFile.txt";
  const storagePath = "path/to/storage";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth.currentUser as any) = { uid: "test-user-id", displayName: "Test User" };
  });

  it("throws an error if the user is not authenticated", async () => {
    // Simulate unauthenticated user
    (auth as any).currentUser = null;

    await expect(
      updateFirestore(firestorePath, downloadURL, fileName, storagePath)
    ).rejects.toThrow("User not authenticated.");
  });

  it("updates Firestore for Departments collection type", async () => {
    const mockDocRef = {};
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (setDoc as jest.Mock).mockResolvedValue({});

    await updateFirestore(firestorePath, downloadURL, fileName, storagePath);

    // Check that the doc and setDoc were called correctly
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      firestorePath.companyId,
      "Departments",
      firestorePath.departmentId,
      firestorePath.collectionName,
      fileName
    );
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: "test-user-id",
      userDisplayName: "Test User",
      uploadTimeStamp: "mock-timestamp",
      tags: [],
    }));
  });

  it("updates Firestore for Buyers collection type", async () => {
    // Update firestorePath for Buyers collection type
    const buyersPath = { ...firestorePath, collectionType: "Buyers" as const, buyerId: "buyerId123", departmentId: "" };
    const mockDocRef = {};
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (setDoc as jest.Mock).mockResolvedValue({});

    await updateFirestore(buyersPath, downloadURL, fileName, storagePath);

    // Check that the doc and setDoc were called correctly
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      buyersPath.companyId,
      "Buyers",
      buyersPath.buyerId,
      "Quotes",
      fileName
    );
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: "test-user-id",
      userDisplayName: "Test User",
      uploadTimeStamp: "mock-timestamp",
      tags: [],
    }));
  });

  it("updates Firestore for Manufacturers collection type", async () => {
    // Update firestorePath for Manufacturers collection type
    const manufacturersPath = { ...firestorePath, collectionType: "Manufacturers" as const, manufacturerId: "manufacturerId123", departmentId: "" };
    const mockDocRef = {};
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (setDoc as jest.Mock).mockResolvedValue({});

    await updateFirestore(manufacturersPath, downloadURL, fileName, storagePath);

    // Check that the doc and setDoc were called correctly
    expect(doc).toHaveBeenCalledWith(
      db,
      "Company",
      manufacturersPath.companyId,
      "Manufacturers",
      manufacturersPath.manufacturerId,
      "Products",
      fileName
    );
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: "test-user-id",
      userDisplayName: "Test User",
      uploadTimeStamp: "mock-timestamp",
      tags: [],
    }));
  });

  it("throws an error if collectionType is invalid", async () => {
    const invalidPath = {
        ...firestorePath,
        collectionType: "InvalidType" as "Departments" | "Manufacturers" | "Buyers",
    };

    await expect(
      updateFirestore(invalidPath, downloadURL, fileName, storagePath)
    ).rejects.toThrow("Invalid Firestore path provided.");
  });
});
