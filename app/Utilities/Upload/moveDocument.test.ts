// // moveDocument.test.ts
// import { moveDocument } from './uploadUtils';  // Adjust import path as needed
// import { firebase, admin } from '@lib/firebase/';  // Firebase emulation imports
// import { getFirestoreRef } from '@/lib/';  // Your helper function, if any

// // Test implementation as discussed earlier.

// const PROJECT_ID = 'my-project-id';  // Replace with your project ID

// // Initialize Firestore emulator app
// function getFirestore(auth) {
//   return firebase.initializeTestApp({ projectId: PROJECT_ID, auth }).firestore();
// }

// // Setup Firestore with mock data
// async function setupFirestore() {
//   const db = admin.firestore();

//   // Create mock company, departments, and files
//   const companyRef = db.collection('Company').doc('companyID');
//   const departmentRef = companyRef.collection('Departments').doc('departmentID');
//   const buyerRef = companyRef.collection('Buyers').doc('buyerID');
//   const manufacturerRef = companyRef.collection('Manufacturers').doc('manufacturerID');

//   await companyRef.set({ name: 'Example Company' });
//   await departmentRef.set({ name: 'Sales' });
//   await buyerRef.set({ name: 'Buyer ABC' });
//   await manufacturerRef.set({ name: 'Manufacturer XYZ' });

//   // Add files to the departments and collections
//   await departmentRef.collection('files').add({
//     fileName: 'file1.txt',
//     filePath: 'Company/Departments/Sales/file1.txt',
//     uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//   });

//   await departmentRef.collection('files').add({
//     fileName: 'file2.txt',
//     filePath: 'Company/Departments/Sales/file2.txt',
//     uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//   });

//   await buyerRef.collection('files').add({
//     fileName: 'file3.txt',
//     filePath: 'Company/Buyers/Buyer ABC/file3.txt',
//     uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//   });

//   await manufacturerRef.collection('files').add({
//     fileName: 'file4.txt',
//     filePath: 'Company/Manufacturers/Manufacturer XYZ/file4.txt',
//     uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//   });
// }

// beforeAll(async () => {
//   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'; // Ensure the Firestore emulator is running
//   await setupFirestore();
// });

// afterAll(async () => {
//   await firebase.clearFirestoreData({ projectId: PROJECT_ID });
//   await firebase.apps().forEach(app => app.delete());
// });

// // Test the moveDocument function
// describe('moveDocument', () => {
//   test('should move document from one department to another', async () => {
//     const db = getFirestore({ uid: 'user123' });

//     // First, get the file that will be moved
//     const sourceDocRef = db.collection('Company')
//       .doc('companyID')
//       .collection('Departments')
//       .doc('departmentID')
//       .collection('files')
//       .doc('file1.txt');
      
//     const sourceDocSnapshot = await sourceDocRef.get();
//     const documentData = sourceDocSnapshot.data();

//     // Ensure the document exists in the source
//     expect(sourceDocSnapshot.exists).toBe(true);
//     expect(documentData.fileName).toBe('file1.txt');

//     // Call moveDocument to move the file to a new department
//     await moveDocument(
//       {
//         collectionType: 'Departments',
//         companyId: 'companyID',
//         departmentId: 'departmentID',
//       },
//       {
//         collectionType: 'Departments',
//         companyId: 'companyID',
//         departmentId: 'newDepartmentID',
//       },
//       'file1.txt'
//     );

//     // Verify that the document has been moved
//     const destinationDocRef = db.collection('Company')
//       .doc('companyID')
//       .collection('Departments')
//       .doc('newDepartmentID')
//       .collection('files')
//       .doc('file1.txt');

//     const destinationDocSnapshot = await destinationDocRef.get();
//     expect(destinationDocSnapshot.exists).toBe(true);
//     expect(destinationDocSnapshot.data().fileName).toBe('file1.txt');

//     // Ensure the document no longer exists in the source department
//     const movedDocSnapshot = await sourceDocRef.get();
//     expect(movedDocSnapshot.exists).toBe(false);
//   });

//   test('should copy document to another department without deleting the source', async () => {
//     const db = getFirestore({ uid: 'user123' });

//     // First, get the file that will be copied
//     const sourceDocRef = db.collection('Company')
//       .doc('companyID')
//       .collection('Departments')
//       .doc('departmentID')
//       .collection('files')
//       .doc('file2.txt');
      
//     const sourceDocSnapshot = await sourceDocRef.get();
//     const documentData = sourceDocSnapshot.data();

//     // Ensure the document exists in the source
//     expect(sourceDocSnapshot.exists).toBe(true);
//     expect(documentData.fileName).toBe('file2.txt');

//     // Call moveDocument to copy the file to a new department (copy flag is true)
//     await moveDocument(
//       {
//         collectionType: 'Departments',
//         companyId: 'companyID',
//         departmentId: 'departmentID',
//       },
//       {
//         collectionType: 'Departments',
//         companyId: 'companyID',
//         departmentId: 'newDepartmentID',
//       },
//       'file2.txt',
//       true // copy
//     );

//     // Verify that the document has been copied to the destination department
//     const destinationDocRef = db.collection('Company')
//       .doc('companyID')
//       .collection('Departments')
//       .doc('newDepartmentID')
//       .collection('files')
//       .doc('file2.txt');

//     const destinationDocSnapshot = await destinationDocRef.get();
//     expect(destinationDocSnapshot.exists).toBe(true);
//     expect(destinationDocSnapshot.data().fileName).toBe('file2.txt');

//     // Ensure the document still exists in the source department
//     const originalDocSnapshot = await sourceDocRef.get();
//     expect(originalDocSnapshot.exists).toBe(true);
//     expect(originalDocSnapshot.data().fileName).toBe('file2.txt');
//   });
// });
