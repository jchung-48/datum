import { updateFirestore, uploadFileToStorage } from "./uploadUtils";
import { ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import { auth } from "../../../lib/firebaseClient";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebaseClient";

jest.mock("../../../lib/firebaseClient", () => ({
  auth: { currentUser: { uid: "test-user-id", displayName: "Test User" } },
  db: {}, // Mock Firestore if needed
  storage: {}, // Mock storage if necessary
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  uploadBytesResumable: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: {
    now: jest.fn().mockReturnValue("mock-timestamp"),
  },
}));

global.confirm = jest.fn();

describe("File Upload and Firestore Update", () => {
  const mockFile = new File(["file content"], "testFile.txt", { type: "text/plain" });
  const storagePath = "path/to/storage";
  const firestorePath = {
    collectionType: "Departments" as const,
    companyId: "companyId123",
    departmentId: "departmentId123",
    buyerId: "",
    manufacturerId: "",
    collectionName: "customFiles",
  };
  const fileName = "testFile.txt";
  const downloadURL = "https://example.com/testFile.txt";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth.currentUser as any) = { uid: "test-user-id", displayName: "Test User" };
  });

  it("uploads a file and updates Firestore with the correct download URL", async () => {
    // Mock Firebase methods
    const mockStorageRef = {};
    const mockUploadTask = {
      on: jest.fn((_, __, ___, complete) => complete()),
      snapshot: { ref: {} },
    };
    (ref as jest.Mock).mockReturnValue(mockStorageRef);
    (uploadBytesResumable as jest.Mock).mockReturnValue(mockUploadTask);
    (getDownloadURL as jest.Mock).mockResolvedValue(downloadURL);
    (global.confirm as jest.Mock).mockReturnValueOnce(true);

    const mockDocRef = {};
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    // Upload file to storage
    const result = await uploadFileToStorage(mockFile, storagePath);
    expect(ref).toHaveBeenCalledWith(expect.anything(), storagePath);
    expect(uploadBytesResumable).toHaveBeenCalledWith(mockStorageRef, mockFile, {
      customMetadata: { uploadedBy: "test-user-id" },
    });

    // Ensure download URL is returned from uploadFileToStorage
    expect(result).toBe(downloadURL);

    // Now update Firestore with the download URL
    await updateFirestore(firestorePath, downloadURL, fileName, storagePath);

    // Check that Firestore document is updated with the correct data
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

  it("throws an error if the user is not authenticated during upload or Firestore update", async () => {
    // Simulate unauthenticated user
    (auth as any).currentUser = null;

    await expect(
      uploadFileToStorage(mockFile, storagePath)
    ).rejects.toThrow("User not authenticated.");

    await expect(
      updateFirestore(firestorePath, downloadURL, fileName, storagePath)
    ).rejects.toThrow("User not authenticated.");
  });

  it("throws an error if collectionType is invalid in Firestore update", async () => {
    const invalidPath = {
      ...firestorePath,
      collectionType: "InvalidType" as "Departments" | "Manufacturers" | "Buyers",
    };

    await expect(
      updateFirestore(invalidPath, downloadURL, fileName, storagePath)
    ).rejects.toThrow("Invalid Firestore path provided.");
  });

  it("cancels upload if user declines file replacement", async () => {
    const mockStorageRef = {};
    const mockDownloadURL = "https://example.com/testFile.txt";
    (ref as jest.Mock).mockReturnValue(mockStorageRef);
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
    (global.confirm as jest.Mock).mockReturnValue(false);

    await expect(uploadFileToStorage(mockFile, storagePath)).rejects.toThrow("Upload cancelled by user");
    expect(deleteObject).not.toHaveBeenCalled();
  });
});