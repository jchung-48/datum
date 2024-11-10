"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseClient'; 
import { useRouter } from 'next/navigation';
import { logoutUser } from '../authentication';

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

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

  return (
    <div>
      <h1>Welcome to the Home Page real</h1>
      <ul>
        
        <li>
          <Link href="/createUser">
            <button style={{ marginBottom: '20px' }}>Create Employee</button>
          </Link>
        </li>
        <li>
          <Link href="/profile">
            <button style={{ marginBottom: '20px' }}>Your Profile</button>
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
