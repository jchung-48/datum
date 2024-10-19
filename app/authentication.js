// authentication.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase.js'; // Import initialized Firebase instances

// Create a new user with email and password
export const createUser = async (email, password, additionalData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional data in Firestore under the specific company and Employees collection
    await setDoc(doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", user.uid), {
      name: additionalData.name,
      email: user.email,
      phone: additionalData.phone,
      role: additionalData.role,
      departments: additionalData.departments,
      companyName: additionalData.companyName
    });

    console.log("User created and additional data saved in Firestore");
  } catch (error) {
    console.error("Error creating user:", error);
    return error.code; // Return Firebase error code to handle it in UI
  }
};

// Sign in the user and confirm the company name
export const signInUser = async (email, password, companyName) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Retrieve user document from Firestore
    const userDocRef = doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("No user found for the given company.");
    }

    // Check if the company name matches
    const userData = userDoc.data();
    if (userData.companyName !== companyName) {
      throw new Error("Company name does not match.");
    }

    console.log("Sign in successful and company name confirmed");
    return userData; // Return user data for further use
  } catch (error) {
    console.error("Error signing in:", error);
    throw error; // Throw the error to be handled in the UI
  }
};

