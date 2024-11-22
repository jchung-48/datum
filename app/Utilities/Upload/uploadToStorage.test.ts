import { uploadFileToStorage } from "./uploadUtils";
import { ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import { auth } from "../../../lib/firebaseClient";

jest.mock("../../../lib/firebaseClient", () => ({
  auth: { currentUser: { uid: "test-user-id" } },
  storage: {}, // Mock storage if necessary
  db: {}, // Mock Firestore if needed
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  uploadBytesResumable: jest.fn(),
}));

global.confirm = jest.fn();

describe("uploadFileToStorage", () => {
  const mockFile = new File(["file content"], "testFile.txt", { type: "text/plain" });
  const storagePath = "path/to/storage";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws an error if no file is provided", async () => {
    await expect(uploadFileToStorage(null as unknown as File, storagePath)).rejects.toThrow("No file provided.");
  });

  it("uploads a file and returns the download URL", async () => {
    const mockStorageRef = {};
    const mockUploadTask = {
      on: jest.fn((_, __, ___, complete) => complete()),
      snapshot: { ref: {} },
    };

    const mockDownloadURL = "https://example.com/testFile.txt";
    (ref as jest.Mock).mockReturnValue(mockStorageRef);
    (getDownloadURL as jest.Mock).mockRejectedValue({ code: "storage/object-not-found" });
    (uploadBytesResumable as jest.Mock).mockReturnValue(mockUploadTask);
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
    (global.confirm as jest.Mock).mockReturnValueOnce(true);

    const result = await uploadFileToStorage(mockFile, storagePath);
    expect(ref).toHaveBeenCalledWith(expect.anything(), storagePath);
    expect(uploadBytesResumable).toHaveBeenCalledWith(mockStorageRef, mockFile, {
      customMetadata: { uploadedBy: "test-user-id" },
    });
    expect(result).toBe(mockDownloadURL);
  });

  it("prompts the user to replace an existing file", async () => {
    const mockStorageRef = {};
    const mockDownloadURL = "https://example.com/testFile.txt";
    (ref as jest.Mock).mockReturnValue(mockStorageRef);
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
    (global.confirm as jest.Mock).mockReturnValue(true);
    (deleteObject as jest.Mock).mockResolvedValue({});

    const result = await uploadFileToStorage(mockFile, storagePath);
    expect(global.confirm).toHaveBeenCalledWith(
      `A file named "testFile.txt" already exists. Do you want to replace it?`
    );
    expect(deleteObject).toHaveBeenCalledWith(mockStorageRef);
    expect(result).toBe(mockDownloadURL);
  });

  it("cancels upload if the user declines replacement", async () => {
    const mockStorageRef = {};
    const mockDownloadURL = "https://example.com/testFile.txt";
    (ref as jest.Mock).mockReturnValue(mockStorageRef);
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
    (global.confirm as jest.Mock).mockReturnValue(false);

    await expect(uploadFileToStorage(mockFile, storagePath)).rejects.toThrow("Upload cancelled by user");
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("throws an error if the user is not authenticated", async () => {
    (auth as any).currentUser = null;

    await expect(uploadFileToStorage(mockFile, storagePath)).rejects.toThrow("User not authenticated.");
  });
});
