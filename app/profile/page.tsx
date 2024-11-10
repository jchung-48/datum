"use client";

import React, { useEffect, useState } from "react";
import { getEmployeeProfile, getUserDepartmentsNew } from "../authentication"; // Adjust path as needed
import { auth } from "../../firebase"; // Ensure auth is imported correctly
import { onAuthStateChanged } from "firebase/auth"; // Import listener
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase"; // Adjust path as needed



export default function ProfilePage() {
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  type EmployeeData = {
    name: string;
    companyName: string;
    email: string;
    phoneNumber: string;
    role: string;
    createdAt: string; // Adjust type if needed (e.g., `Date` if you parse it)
    departments?: any[]; // Add this if you plan to include departments later
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const data = await getEmployeeProfile(user.uid);
          setEmployeeData(data);
            console.log(data)
          // Fetch department names using the new function
          if (data.departments && data.departments.length > 0) {
            console.log("here");
            const departmentNames = await getUserDepartmentsNew(data);
            setDepartments(departmentNames);
          }
        } catch (err) {
          setError("Error fetching profile data");
          console.error("Error fetching employee profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setError("User not authenticated.");
        router.push("/login"); // Redirect to login if not authenticated
        setLoading(false);
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!employeeData) {
    return <p>No employee data available.</p>;
  }
/*
  const handleChangePhoneNumber = async (uid) => {
    const newPhoneNumber = prompt("Enter your new phone number:");
  
    if (newPhoneNumber) {
      try {
        const employeeRef = doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", uid);
        await updateDoc(employeeRef, {
          phoneNumber: newPhoneNumber,
        });
  
        // Re-fetch updated profile data
        const updatedData = await getEmployeeProfile(uid);
        //setEmployeeData(updatedData);
  
        alert("Phone number updated successfully!");
      } catch (error) {
        console.error("Error updating phone number:", error);
        alert("Failed to update phone number.");
      }
    }
  };
*/
const handleChangePhoneNumber = async () => {
    // Check if a user is authenticated
    const user = auth.currentUser;
  
    if (!user) {
      alert("User not authenticated. Please log in again.");
      return;
    }
  
    const newPhoneNumber = prompt("Enter your new phone number:");
  
    if (newPhoneNumber) {
      try {
        // Reauthenticate the user if necessary (e.g., for security-sensitive actions)
        // You might need to use a reauthentication method such as phone verification.
        
        // Example placeholder for reauthentication logic (could involve a phone OTP):
        // const credential = PhoneAuthProvider.credential(user.phoneNumber, verificationCode);
        // await reauthenticateWithCredential(user, credential);
  
        // Update phone number in Firestore
        const employeeRef = doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", user.uid);
        await updateDoc(employeeRef, {
          phoneNumber: newPhoneNumber,
        });
  
        // Re-fetch updated profile data
        const updatedData = await getEmployeeProfile(user.uid);
        setEmployeeData(updatedData);
  
        alert("Phone number updated successfully!");
      } catch (error) {
        console.error("Error updating phone number:", error);
  
        // Clarify error types for better debugging
        if (error.code === 'auth/requires-recent-login') {
          alert("Please log in again to change your phone number for security reasons.");
        } else {
          alert("Failed to update phone number.");
        }
      }
    }
  };
  return (
    <div>
      <h1>{employeeData.name}</h1>
      <h2>
        Employee at Datum since {employeeData.createdAt}
      </h2>
      <h3>Additional Information:</h3>
      <ul>
        <li>Email: {employeeData.email}</li>
        <li>Phone Number: {employeeData.phoneNumber}</li>
        <li>Role: {employeeData.role}</li>
      </ul>
      
      <h3>Authorized Departments</h3>
      {departments.length > 0 ? (
        <ul>
          {departments}
        </ul>
      ) : (
        <p>No departments assigned.</p>
      )}
       <button>Change Password</button>
       <button onClick={() => handleChangePhoneNumber(auth.currentUser.uid)}>
        Change Phone Number
      </button>
    </div>
  );
}
