// authentication.js
import Cookies from "js-cookie";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, query, where, arrayUnion, setDoc, doc, getDoc, collection, listCollections, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from '../firebase.js'; // Import initialized Firebase instances


onAuthStateChanged(auth, (user) => {
  if (user) {
    // Set a cookie with the user's ID token to remember the session
    user.getIdToken().then((token) => {
      Cookies.set("authToken", token, { expires: 7 }); // Expires in 7 days
    });
  } else {
    // Remove the authToken cookie if the user signs out
    Cookies.remove("authToken");
  }
});

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
}
// Fetch departments from Firestore
export const getDepartments = async (companyId) => {
  try {
    const departmentsRef = collection(db, `Company/${companyId}/Departments`);
    const departmentsSnapshot = await getDocs(departmentsRef);
    
    const departments = departmentsSnapshot.docs.map(doc => doc.data().name); // Extract department names
    
    return departments; // List of department names
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error; // Throw the error for further handling
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


// Create a new user with email and password
export const createUser = async (email, password, additionalData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional data in Firestore under the specific company and Employees collection
    const employeeRef = doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", user.uid);
    await setDoc(employeeRef, {
      name: additionalData.name,
      email: user.email,
      phone: additionalData.phone,
      role: additionalData.role,
      departments: additionalData.departments,
      companyName: additionalData.companyName,
    });

    console.log("User created and additional data saved in Firestore");

    // Ensure departments field is not empty or undefined
    if (additionalData.departments) {
      // Query the Departments collection to find the document where the 'name' field matches the selected department
      const departmentsRef = collection(db, "Company/mh3VZ5IrZjubXUCZL381/Departments");
      const q = query(departmentsRef, where("name", "==", additionalData.departments)); // Match department by name

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Assuming the department name is unique, we get the first document that matches
        const departmentDoc = querySnapshot.docs[0];
        const departmentRef = doc(db, `Company/mh3VZ5IrZjubXUCZL381/Departments`, departmentDoc.id);

        // Update the department's 'users' array by adding a reference to the new employee document
        await updateDoc(departmentRef, {
          users: arrayUnion(employeeRef), // Use a reference to the newly created employee document
        });

        console.log("User added to the department's users array successfully as a reference.");
      } else {
        console.error("No matching department found with name:", additionalData.departments);
        throw new Error("No matching department found");
      }
      
    } else {
      console.error("No department selected, cannot update the department's users array.");
      throw new Error("No department selected");
    }

  } catch (error) {
    console.error("Error creating user or adding to department:", error);
    return error.code; // Return Firebase error code to handle it in UI
  }
};



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
    // if (userData.companyName !== companyName) {
    //   throw new Error("Company name does not match.");
    // }

    console.log("Sign in successful");
    return userData; // Return user data for further use
  } catch (error) {
    console.error("Error signing in:", error);
    throw error; // Throw the error to be handled in the UI
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    Cookies.remove("authToken"); // Remove the cookie on sign out
    console.log("User signed out successfully.");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};