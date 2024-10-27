"use client";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useState, useEffect } from "react";
import { signInUser } from "../authentication";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const Page = () => {
  const searchParams = useSearchParams(); // Get access to the search parameters (query parameters)
  const workplaceId = searchParams.get("workplaceId"); // Get the companyId from query parameters
  const firestoreIdPattern = /^[a-zA-Z0-9]{20}$/; // regex pattern for firestore IDs
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Track error messages

  useEffect(() => {
    // Validate the workplaceId format before allowing access
    if (!workplaceId || !firestoreIdPattern.test(workplaceId)) {
      router.push("/workplaces"); // Redirect to an error page if validation fails
    }
  }, [workplaceId, router]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(""); // Clear error message after 3 seconds
      }, 3000);

      return () => clearTimeout(timer); // Cleanup timeout if component unmounts or error changes
    }
    return undefined;
  }, [errorMessage]);

  const handleSignIn = async () => {
    try {
      await signInUser(email, password, workplaceId);
      alert("User signed in successfully!");
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
    <div>
      <h1>Sign In</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignIn}>Sign In</button>
      {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>} {/* Display error message */}
    </div>
  );
};

export default Page;