"use client";
import React, { useEffect, useState } from "react";
import { getEmployeeProfile, getUserDepartmentsNew, resetPassword, sendVerificationCode, verifyAndUpdatePhoneNumber } from "../authentication"; 
import { auth } from "../../lib/firebaseClient.js";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebaseClient.js";
import './style.modules.css';
import Link from "next/link";
import { logoutUser } from '../authentication';

export default function ProfilePage() {
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [verificationId, setVerificationId] = useState("");
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState("");
    const [isSignedIn, setIsSignedIn] = useState(false);

    type EmployeeData = {
        name: string;
        companyName: string;
        email: string;
        phoneNumber: string;
        role: string;
        createdAt: string;
        departments?: string[];
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
          setIsSignedIn(Boolean(user));
        });
        return () => unsubscribe();
      }, []);
    
      const handleSignOut = async () => {
        await logoutUser();
        router.push("/workplaces");
      }
      
    useEffect(() => {
        if (errorMessage) {
          const timer = setTimeout(() => {
            setErrorMessage(""); // Clear error message after 3 seconds
          }, 5000);
    
          return () => clearTimeout(timer); // Cleanup timeout if component unmounts or error changes
        }
        return undefined;
      }, [errorMessage]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const data = await getEmployeeProfile(user.uid);
                    setEmployeeData(data);
                    if (data.departments && data.departments.length > 0) {
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
                router.push("/login");
                setLoading(false);
            }
        });
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

    const handleVerificationCode = async () => {
        const verId = await sendVerificationCode(phoneNumber);
        if (verId) {
          setVerificationId(verId);
        }
      };
      
    return (
        <div className="profile-container">
            <h1>{employeeData.name}</h1>
            <h2>Employee at Datum since {employeeData.createdAt}</h2>
            <h3>Additional Information:</h3>
            <ul>
                <li>Email: {employeeData.email}</li>
                <li>Phone Number: {employeeData.phoneNumber}</li>
                <li>Role: {employeeData.role}</li>
            </ul>
            <h3>Authorized Departments</h3>
            {departments.length > 0 ? (
                <ul>
                    {departments.map((dept, index) => <li key={index}>{dept}</li>)}
                </ul>
            ) : (
                <p>No departments assigned.</p>
            )}
            <button onClick={() => resetPassword(employeeData.email)}>Change Password</button>
            
            <Link href="/home">
            <button>Back to Home</button>
            </Link>

            {isSignedIn && (
          <button onClick={handleSignOut} style={{ marginTop: '20px' }}>
            Sign Out
          </button>
        )}
            
            <div>
      <h1>Update Phone Number</h1>
      <input
        type="text"
        placeholder="New Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{ color: 'black' }}
      />
      <button onClick={handleVerificationCode}>Send Verification Code</button>
      
      {verificationId && (
        <>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            style={{ color: 'black' }}
          />
          <button onClick={() => verifyAndUpdatePhoneNumber(verificationCode,verificationId)}>Verify and Update</button>
        </>
      )}
      
      <div id="recaptcha-container"></div>
      {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}
    </div>
            
        </div>
        
    );
}
