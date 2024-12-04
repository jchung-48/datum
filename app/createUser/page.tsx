"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { auth } from "@/lib/firebaseClient";
import { getDepartments } from "../authentication";
import Header from '@/app/Utilities/Header/header';

interface Department {
  id: string;
  name: string;
}

const Page = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]); // Departments list state
  const [selectedDepartment, setSelectedDepartment] = useState(""); // Store selected department
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(""); // Clear error message after 3 seconds
      }, 3000);

      return () => clearTimeout(timer); // Cleanup timeout if component unmounts or error changes
    }
    return undefined;
  }, [errorMessage]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        const companyId = (await user.getIdTokenResult()).claims.companyId;
        const departmentList = await getDepartments(companyId);
        if (departmentList.length > 0) {
          setDepartments(departmentList); // Store fetched departments in state
        } else {
          setErrorMessage("No departments available.");
        }
      } else {
        router.push("/workplaces");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAccountCreation = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorMessage("You must be signed in to create a user.");
        return;
      }
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch("/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email,
          displayName: name,
          phoneNumber: phone,
          departmentId: selectedDepartment,
          role,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`${data.message}`);
        setErrorMessage("");
        console.log(successMessage);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to create user");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    }
  }

  const departmentSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(event.target.value);
  };

  return (
    <div>
      <Header department="                    " isProfile={false} />
      <h1>Create New Employee</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <select value={selectedDepartment} onChange={departmentSelect}>
        <option value="" disabled>Select a Department</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <button onClick={handleAccountCreation}>Create User Account</button>
      {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>} {/* Display error message */}
    </div>
  )
};

export default Page;