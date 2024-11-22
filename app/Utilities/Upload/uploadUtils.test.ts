import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { Firestore, doc, getDoc, setDoc, initializeFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";  // Import Firebase App initialization
import { uploadFileToStorage, updateFirestore, handleFileDelete} from "./uploadUtils";
import { FirestorePath } from "../../../app/types";

let testEnv: RulesTestEnvironment;
let db: Firestore;

// Setup and teardown
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "test-project",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /Company/{companyId}/Departments/{departmentId}/files/{fileId} {
              allow read, write: if request.auth != null;
            }
          }
        }
      `,
      // Firestore Emulator Setup
      host: "localhost", // Use localhost for emulator
      port: 8080,        // Default port for Firestore emulator
    },
    storage: {
      rules: `
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /Company/{companyId}/Departments/{departmentId}/{fileName} {
              allow read, write: if request.auth != null;
            }
          }
        }
      `,
    },
  });

  // Initialize Firebase app for testing
  const app = initializeApp({ projectId: "test-project" }); // Initialize Firebase app

  const userContext = testEnv.authenticatedContext("test-user");
  db = userContext.firestore() as unknown as Firestore;

  // Initialize Firestore using the app instance
  db = initializeFirestore(app, {
    host: "localhost:8080", // Emulator host and port
    ssl: false,             // Disable SSL for emulator
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// Tests
describe("uploadUtils", () => {
  test("uploadFileToStorage: uploads a file and returns the download URL", async () => {
    const file = new File(["Hello World"], "test-file.txt", { type: "text/plain" });
    const storagePath = "Company/Departments/123/files/test-file.txt";

    const mockStorageRef = testEnv
      .authenticatedContext("test-user")
      .storage()
      .ref(storagePath);

    const uploadURL = await uploadFileToStorage(file, storagePath);

    expect(uploadURL).toBeDefined();

    const metadata = await mockStorageRef.getMetadata();
    expect(metadata.name).toBe("test-file.txt");
  });

  test("updateFirestore: updates Firestore document with file info", async () => {
    const firestorePath: FirestorePath = {
      collectionType: "Departments",
      companyId: "company-123",
      departmentId: "department-123",
      collectionName: "files",
    };

    const downloadURL = "https://example.com/test-file.txt";
    const fileName = "test-file.txt";
    const storagePath = "Company/Departments/123/files/test-file.txt";

    await updateFirestore(firestorePath, downloadURL, fileName, storagePath);

    const docRef = doc(
      db,
      "Company",
      firestorePath.companyId,
      "Departments",
      firestorePath.departmentId as string,
      "files",
      fileName
    );
    const docSnap = await getDoc(docRef);

    expect(docSnap.exists()).toBe(true);
    expect(docSnap.data()).toEqual({
      fileName,
      download: downloadURL,
      filePath: storagePath,
      uploadedBy: "test-user",
      userDisplayName: null,
      uploadTimeStamp: expect.anything(),
      tags: [],
    });
  });

  test("handleFileDelete: deletes a file from storage and Firestore", async () => {
    const firestorePath: FirestorePath = {
      collectionType: "Departments",
      companyId: "company-123",
      departmentId: "department-123",
      collectionName: "files",
    };

    const fileName = "test-file.txt";
    const fileFullPath = `Company/Departments/${firestorePath.departmentId}/files/${fileName}`;

    const docRef = doc(
      db,
      "Company",
      firestorePath.companyId,
      "Departments",
      firestorePath.departmentId as string,
      "files",
      fileName
    );

    await setDoc(docRef, {
      fileName,
      filePath: fileFullPath,
      uploadedBy: "test-user",
      tags: [],
    });

    // Ensure the document exists before deletion
    let docSnap = await getDoc(docRef);
    expect(docSnap.exists()).toBe(true);

    // Perform deletion
    await handleFileDelete(fileFullPath, firestorePath);

    // Verify the document and storage file are deleted
    docSnap = await getDoc(docRef);
    expect(docSnap.exists()).toBe(false);

    const storageRef = testEnv
      .authenticatedContext("test-user")
      .storage()
      .ref(fileFullPath);

    await expect(storageRef.getMetadata()).rejects.toThrow("object-not-found");
  });
});
