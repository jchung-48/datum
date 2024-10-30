"use client";

import React from "react";
import { useState, useEffect } from "react";
import { signInUser, logoutUser } from "../authentication";
import { useRouter , useSearchParams} from "next/navigation";
import Cookies from "js-cookie";
        
        
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
  const [errorMessage, setErrorMessage] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Check if the user is already signed in by looking for the authToken cookie
    const token = Cookies.get("authToken");
    if (token) {
      setIsSignedIn(true); // User is already signed in
      alert("User is already signed in.");
      //router.push("./"); // Navigates to a dashboard or home page
    }
  }, [router]);

  useEffect(() => {
    // Validate the workplaceId format before allowing access
    if (!workplaceId || !firestoreIdPattern.test(workplaceId)) {
      router.push("/workplaces"); // Redirect to an error page if validation fails
    }
  }, [workplaceId, router]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [errorMessage]);

  const handleSignIn = async () => {
    try {
      await signInUser(email, password, workplaceId);
      setIsSignedIn(true); // Update state to show user is signed in
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
  };

  const handleSignOut = async () => {
    try {
      await logoutUser(); // Sign the user out
      setIsSignedIn(false); // Update state to show user is signed out
      router.push("./"); // Redirect to the sign-in page or a different route
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div>

      
      {!isSignedIn ? (
        <>
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
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </>
      ) : (
        <button onClick={handleSignOut}>Sign Out</button>
      )}

    </div>
  );
};

export default Page;
