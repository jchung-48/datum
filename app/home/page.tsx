"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { logoutUser } from '../authentication';
import { LuCloudLightning } from 'react-icons/lu';
import styles from './styles.module.css'; // Correct import for CSS Modules
import { getEmployeeProfile } from '../authentication'; // Adjust the import path if needed

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userDepartments, setUserDepartments] = useState([]);

  // Map department names to Firestore document IDs (or other identifiers)
  const departmentMapping = {
    qa: "Eq2IDInbEQB5nI5Ar6Vj",
    hr: "NpaV1QtwGZ2MDNOGAlXa",
    logistics: "KZm56fUOuTobsTRCfknJ",
    merchandising: "ti7yNByDOzarVXoujOog",
  };

  useEffect(() => {
    document.body.classList.add('home-page');

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsSignedIn(true);

        try {
          // Fetch the user's profile info
          const profile = await getEmployeeProfile(user.uid);

          // Resolve department references to their IDs/names
          const resolvedDepartments = await Promise.all(
            profile.departments.map(async (ref) => {
              const departmentSnap = await getDoc(ref); // Resolve reference to document
              return departmentSnap.id; // Or departmentSnap.data() if needed
            })
          );

          setUserDepartments(resolvedDepartments);
        } catch (error) {
          console.error("Error fetching profile info:", error);
        }
      } else {
        setIsSignedIn(false);
      }
    });

    return () => {
      document.body.classList.remove('home-page');
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/workplaces");
  };

  // Check if a department is in the user's list
  const isDepartmentEnabled = (departmentKey) => {
    const departmentId = departmentMapping[departmentKey];
    //console.log(userDepartments.includes(departmentId))
    return userDepartments.includes(departmentId);
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.home}>
          <LuCloudLightning className={styles.cloudIcon} />
        </div>
        
        {isDepartmentEnabled("qa") ? (
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

{isDepartmentEnabled("hr") ? (
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
        {isDepartmentEnabled("logistics") ? (
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

{isDepartmentEnabled("merchandising") ? (
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

        <Link className="user-container" href="/createUser">
          <div className="create-user" style={{ marginBottom: '20px' }}>Create Employee</div>
        </Link>

        {isSignedIn && (
          <button onClick={handleSignOut} style={{ marginTop: '20px' }}>
            Sign Out
          </button>
        )}
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
