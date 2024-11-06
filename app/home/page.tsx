"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { logoutUser } from "../authentication"; // Import the logout function

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Check if the user is already signed in by looking for the authToken cookie
    const token = Cookies.get("authToken");
    setIsSignedIn(!!token); // Set sign-in status based on the presence of the token
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutUser(); // Sign the user out
      Cookies.remove("authToken"); // Remove the authToken cookie
      setIsSignedIn(false); // Update sign-in status
      router.push("/signin"); // Redirect to the sign-in page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div>
      <h1>Welcome to the Home Page real</h1>
      <ul>
        
        <li>
          <Link href="/user">
            <button style={{ marginBottom: '20px' }}>Create Employee</button>
          </Link>
        </li>
        <li>
          <Link href="/qaDepartment">
            <button style={{ marginBottom: '20px' }}>Quality Assurance</button>
          </Link>
        </li>
        <li>
          <Link href="/hrDepartment">
            <button style={{ marginBottom: '20px' }}>Human Resources</button>
          </Link>
        </li>
        <li>
          <Link href="/logisticsDepartment">
            <button style={{ marginBottom: '20px' }}>Logistics</button>
          </Link>
        </li>
        <li>
          <Link href="/merchandisingDepartment">
            <button style={{ marginBottom: '20px' }}>Merchandising</button>
          </Link>
        </li>
        <li>
          <Link href="/faq">
            <button style={{ marginBottom: '20px' }}>FAQ</button>
          </Link>
        </li>
        <li>
          <Link href="/pdfSummary">
            <button style={{ marginBottom: '20px' }}>PDF Summary</button>
          </Link>
        </li>
      </ul>

      {isSignedIn && (
        <button onClick={handleSignOut} style={{ marginTop: '20px' }}>
          Sign Out
        </button>
      )}
    </div>
  );
}
