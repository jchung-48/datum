"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React from "react";
import { useState, useEffect } from "react";
import { signInUser, logoutUser, getUserDepartments } from "../authentication";
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
      const userData = await signInUser(email, password, workplaceId);
  
      // Set the authToken cookie for the session, e.g., a token or user ID from `userData`
      if (userData && userData.authToken) {
        Cookies.set("authToken", userData.authToken, { expires: 1 }); // Expires in 1 day
        setIsSignedIn(true); // Update sign-in status
        console.log("authToken cookie set:", userData.authToken); // Confirm cookie in console
      }
  
      // Navigate to the user's department
      const department = await getUserDepartments(userData);
      router.push(`/${department.URL}`);
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
