"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseClient'; 
import { useRouter } from 'next/navigation';
import { logoutUser } from '../authentication';
import { LuCloudLightning } from 'react-icons/lu';
import styles from './home.module.css'; 
import { FaUserCircle } from 'react-icons/fa';

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Add the home-page class to the body when the component mounts
    document.body.classList.add('home-page');

    const unsubscribe = auth.onAuthStateChanged(async user => {
      setIsSignedIn(Boolean(user));
    });

    // Clean up the effect by removing the home-page class on unmount
    return () => {
      document.body.classList.remove('home-page');
      unsubscribe();
    };
  }, []);

  // const handleSignOut = async () => {
  //   await logoutUser();
  //   router.push("/workplaces");
  // }

  return (
    <div>
      <div className={styles.header}>

        <div className={styles.home}>
          <LuCloudLightning className={styles.cloudIcon} />
        </div>
        
        {isDepartmentEnabled("qa") || isAdmin ? (
  <Link href="/departments/qa">
    <div className="top-buttons" style={{ marginBottom: '20px', opacity: 1 }}>
      Quality Assurance
    </div>
  </Link>
  
) : (
  <div
    className="top-buttons"
    style={{
      marginBottom: '20px',
      opacity: 0.5,
      cursor: 'not-allowed', // Ensures proper cursor feedback
    }}
    role="button"
    aria-disabled="true" // Accessibility for disabled state
  >
    Quality Assurance
  </div>
)}

{isDepartmentEnabled("hr")  || isAdmin ? (
  <Link href="/departments/hr">
    <div className="top-buttons" style={{ marginBottom: '20px', opacity: 1 }}>
      Human Resources
    </div>
  </Link>
) : (
  <div
    className="top-buttons"
    style={{
      marginBottom: '20px',
      opacity: 0.5,
      cursor: 'not-allowed', // Ensures proper cursor feedback
    }}
    role="button"
    aria-disabled="true" // Accessibility for disabled state
  >
    Human Resources
  </div>
)}
        {isDepartmentEnabled("logistics")  || isAdmin ? (
  <Link href="/departments/logistics">
    <div className="top-buttons" style={{ marginBottom: '20px', opacity: 1 }}>
    Logistics
    </div>
  </Link>
) : (
  <div
    className="top-buttons"
    style={{
      marginBottom: '20px',
      opacity: 0.5,
      cursor: 'not-allowed', // Ensures proper cursor feedback
    }}
    role="button"
    aria-disabled="true" // Accessibility for disabled state
  >
    Logistics
  </div>
)}

{isDepartmentEnabled("merchandising")  || isAdmin ? (
  <Link href="/departments/merchandising">
    <div className="top-buttons" style={{ marginBottom: '20px', opacity: 1 }}>
    Merchandising
    </div>
  </Link>
) : (
  <div
    className="top-buttons"
    style={{
      marginBottom: '20px',
      opacity: 0.5,
      cursor: 'not-allowed', // Ensures proper cursor feedback
    }}
    role="button"
    aria-disabled="true" // Accessibility for disabled state
  >
    Merchandising
  </div>
)}

        {/* Lock Create Employee Button */}
        {isAdmin ? (
          <Link href="/createUser">
            <div className="create-user" style={{ marginBottom: "20px", opacity: 1 }}>
              Create Employee
            </div>
          </Link>
        ) : (
          <div
            className="create-user"
            style={{
              marginBottom: "20px",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
            role="button"
            aria-disabled="true"
          >
            Create Employee
          </div>
        )}

        {isSignedIn && (
          <div className={styles.profileHome}>
            <Link href="/profile">
              <FaUserCircle className={styles.profileIconHome} />
            </Link>
          </div>
        )}
        {/* {isSignedIn && (
          <button className={styles.signOut} onClick={handleSignOut}>
            Sign Out
          </button>
        )} */}
      </div>
      <div className={styles.motto}>
        Knowledge<br />
        is Power
      </div>
      <div className={styles.description}>
        Check out Datum, your source for excellence in supply <br />
        chain management and knowledge sharing!
      </div>
      <div className={styles.bottomButtons}>
        <Link className={styles.faqButton} href="/faq">
          <div style={{ marginBottom: '20px' }}>FAQ</div>
        </Link>
      </div>
    </div>
  );
}
