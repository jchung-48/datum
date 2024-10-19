// authentication.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase.js'; // Import initialized Firebase instances

// Create a new user with email and password
export const createUser = async (email, password, additionalData) => {
  try {
    // Create user with email and password in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional data in Firestore under the specific company and Employees collection
    // Replace "XQWWSPojHPpuP1ZiHCEe" with user.uid or a new ID for each employee
    await setDoc(doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", user.uid), {
      name: additionalData.name,           // Name of the employee
      email: user.email,                   // User email from auth
      phone: additionalData.phone,         // Phone number
      role: additionalData.role,           // Employee role
      departments: additionalData.departments,
      companyName: additionalData.companyName // List of departments or single department
    });
    
    console.log("User created and additional data saved in Firestore");
  } catch (error) {
    console.error("Error creating user:", error);
  }
};



// Sign in the user and confirm the company name
export const signInUser = async (email, password, companyName) => {
  try {
    // Sign in the user using email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Retrieve user document from Firestore using companyName and user ID
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
    console.error("Error signing in or confirming company name:", error.message);
    throw error;
  }
};

