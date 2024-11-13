"use client";
import React, { useEffect, useState } from "react";
import { getEmployeeProfile, getUserDepartmentsNew } from "../authentication"; 
import { auth } from "../../lib/firebaseClient.js";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebaseClient.js";
import './style.modules.css';
import Link from "next/link";

export default function ProfilePage() {
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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

    const handleChangePhoneNumber = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("User not authenticated. Please log in again.");
            return;
        }
        const newPhoneNumber = prompt("Enter your new phone number:");
        if (newPhoneNumber) {
            try {
                const employeeRef = doc(db, "Company/mh3VZ5IrZjubXUCZL381/Employees", user.uid);
                await updateDoc(employeeRef, { phoneNumber: newPhoneNumber });
                const updatedData = await getEmployeeProfile(user.uid);
                setEmployeeData(updatedData);
                alert("Phone number updated successfully!");
            } catch (error) {
                console.error("Error updating phone number:", error);
                alert(error.code === 'auth/requires-recent-login'
                    ? "Please log in again to change your phone number for security reasons."
                    : "Failed to update phone number.");
            }
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
            <button>Change Password</button>
            <button onClick={handleChangePhoneNumber}>Change Phone Number</button>
            <Link href="/home">
            <button>Back to Home</button>
            </Link>
        </div>
    );
}
