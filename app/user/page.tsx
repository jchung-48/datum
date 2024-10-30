"use client";
import { useState, useEffect } from "react";
import { getDepartments, createUser, signInUser } from "../authentication"; // Import your department fetching function
import { useRouter } from "next/navigation";
import React from 'react';

const Page = () => {
  const router = useRouter(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [departments, setDepartments] = useState<string[]>([]); // Departments list state
  const [selectedDepartment, setSelectedDepartment] = useState(""); // Store selected department
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [errorMessage, setErrorMessage] = useState(""); // Track error messages

  // Automatically clear the error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(""); // Clear error message after 3 seconds
      }, 3000);

      return () => clearTimeout(timer); // Cleanup timeout if component unmounts or error changes
    }
    return undefined;
  }, [errorMessage]);

  // Fetch departments when the component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsList = await getDepartments("mh3VZ5IrZjubXUCZL381");
        console.log("Fetched departments:", departmentsList); // Debugging log
        if (departmentsList.length > 0) {
          setDepartments(departmentsList); // Store fetched departments in state
          setSelectedDepartment(departmentsList[0]); // Set default selected department
        } else {
          setErrorMessage("No departments available.");
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setErrorMessage("Failed to fetch departments");
      }
    };

    fetchDepartments();
  }, []);

  const handleSignUp = async () => {
    try {
      const additionalData = {
        name,
        phone,
        departments: selectedDepartment, // Use the selected department
        role,
        companyName,
      };
      const result = await createUser(email, password, additionalData);
      if (result) {
        if (result === "auth/email-already-in-use") {
          setErrorMessage("This email is already in use. Please use a different email.");
        } else if (result === "auth/weak-password") {
          setErrorMessage("Password should be at least 6 characters long.");
        } else if (result === "auth/invalid-email") {
          setErrorMessage("Invalid email format.");
        } else {
          setErrorMessage("An error occurred during sign up. Please try again.");
        }
      } else {
        alert("User created successfully!");
      }
    } catch (error) {
      setErrorMessage("Error creating user: ");
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInUser(email, password, companyName);
      alert("User signed in successfully!");
      // Navigate to department1 page after successful sign-in
      let path = "./" + selectedDepartment
      router.push(path); // Navigates to department1 page
    } catch (error: any) {
      if (error.message === "Company name does not match.") {
        setErrorMessage("Company name does not match.");
      } else if (error.message === "No user found for the given company.") {
        setErrorMessage("No user found for the given company.");
      } else {
        setErrorMessage("Error signing in: " + error.message);
      }
    }

    setTimeout(() => {
      setErrorMessage("");
    }, 3000);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{isSignUp ? "Create New Employee" : "Sign In"}</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {isSignUp && (
        <>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginRight: "10px" }}
            />
            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            {/* Department Dropdown */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{ marginRight: "10px" }}
            >
              {departments.length > 0 ? (
                departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))
              ) : (
                <option value="">No departments available</option>
              )}
            </select>
            <input
              type="text"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <button onClick={isSignUp ? handleSignUp : handleSignIn}>
        {isSignUp ? "Create Employee" : "Sign In"}
      </button>

      {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>} {/* Display error message */}

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default Page;
