// authentication.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
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
      departments: additionalData.departments // List of departments or single department
    });
    
    console.log("User created and additional data saved in Firestore");
  } catch (error) {
    console.error("Error creating user:", error);
  }
};



// Sign in an existing user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User signed in", user);
    return user;
  } catch (error) {
    console.error("Error signing in", error);
  }
};
