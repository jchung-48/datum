// authentication.js
import { signInWithEmailAndPassword, signOut, updatePhoneNumber, PhoneAuthProvider, reauthenticateWithCredential, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from '../lib/firebaseClient.js'; // Import initialized Firebase instances

// Fetch departments from Firestore
export const getDepartments = async (companyId) => {
  try {
    const departmentsRef = collection(db, `Company/${companyId}/Departments`);
    const departmentsSnapshot = await getDocs(departmentsRef);
    
    const departments = departmentsSnapshot.docs.map(doc => ({
      id: doc.id,           // Get the document ID
      name: doc.data().name // Get the "name" field from the document
    })); // Extract department names
    
    return departments; // List of department names
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error; // Throw the error for further handling
  }
};

export const getUserDepartments = async (userData) => {
  try {
    // const userRef = doc(db, `Company/${companyId}/Employees`, userId);
    // const userSnap = await getDoc(userRef);
    // const userData = userSnap.data();
    const departmentRefs = userData.departments;// get list of departments from references
    const firstDepartmentRef = departmentRefs[0]; // get first department
    const departmentSnap = await getDoc(firstDepartmentRef);
    const departmentData = departmentSnap.data();
    return departmentData;
  } catch (error) {
    console.error("Error fetching departments for user:", error);
    throw error;
  }
};

// Fetch companies from Firestore
export const getCompanies = async () => {
  try {
    const companiesRef = collection(db, "Company/");
    const companiesSnapshot = await getDocs(companiesRef);
    
    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,           // Get the document ID
      name: doc.data().name // Get the "name" field from the document
    }));
    
    return companies; // List of company names
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error; // Throw the error for further handling
  }
}

// Sign in the user and confirm the company name
export const signInUser = async (email, password, companyId) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Retrieve user document from Firestore
    const userDocRef = doc(db, `Company/${companyId}/Employees`, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("No user found for the given company.");
    }

    // Check if the company name matches (not sure why necessary)
    const userData = userDoc.data();
    console.log("Sign in successful");
    return userData; // Return user data for further use
  } catch (error) {
    console.error("Error signing in:", error);
    throw error; // Throw the error to be handled in the UI
  }
};

export const resetPassword = async (email) => { // Pete
  try {
    const response = await fetch("/api/resetPass", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      setSuccessMessage(`${data.message}`);
      setErrorMessage("");
      console.log(successMessage);
      alert("Reset link sent to your email!");
    } else {
      const errorData = await response.json();
      setErrorMessage(errorData.message || "Failed to create user");
    }
  } catch (error) {
    setErrorMessage("Error reseting password");
  }
};

export const updatePhoneNumberForUser = async (newPhoneNumber, verificationCode) => { // Pete
  window.recaptchaVerifier = new RecaptchaVerifier(
    "recaptcha-container",
    {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA solved", response);
      },
    },
    auth
  );

  try {
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, newPhoneNumber, appVerifier);
    setVerificationId(confirmationResult.verificationId);
    console.log("Verification code sent to:", newPhoneNumber);

    const user = auth.currentUser;
    const phoneCredential = PhoneAuthProvider.credential(
      newPhoneNumber.verificationCode,
      verificationCode
    );

    await updatePhoneNumber(user, phoneCredential);
    console.log("Phone number updated successfully.");
  } catch (error) {
    console.error("Error updating phone number:", error);
    setErrorMessage(`Error reseting password: ${error}`);
  }
};

export const changeDisplayName = async (newDisplayName) => { // Pete
  const user = auth.currentUser;
  try {
    user.updateProfile({
      displayName: newDisplayName
    }).then(() => {
      console.log('Display name updated successfully!');
    }).catch(error => {
      console.error('Error updating display name:', error);
    });

    const companyId = (await user.getIdTokenResult()).claims.companyId;
    const docRef = doc(db, `/Company/${companyId}/Employees`, user.uid);
    await updateDoc(docRef, {
      name: newDisplayName
    });
  } catch (error) {
    console.error("Error changing name: ", error);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};