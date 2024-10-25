"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { signInUser } from "../authentication";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const Page = () => {
  const searchParams = useSearchParams(); // Get access to the search parameters (query parameters)
  const workplaceId = searchParams.get("workplaceId"); // Get the companyId from query parameters

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Track error messages

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(""); // Clear error message after 3 seconds
      }, 3000);

      return () => clearTimeout(timer); // Cleanup timeout if component unmounts or error changes
    }
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
    </div>
  );
};

export default Page;