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
        <Link href="/home">
          <div className={styles.home}>
            <LuCloudLightning className={styles.cloudIcon}/>
          </div>
        </Link>
          <Link href="/departments/qa">
            <div className={styles.topButtons} style={{ marginBottom: '20px' }}>Quality Assurance</div>
          </Link>
          <Link href="/departments/hr">
            <div className={styles.topButtons} style={{ marginBottom: '20px' }}>Human Resources</div>
          </Link>
          <Link href="/departments/logistics">
            <div className={styles.topButtons} style={{ marginBottom: '20px' }}>Logistics</div>
          </Link>
          <Link href="/departments/merchandising">
            <div className={styles.topButtons} style={{ marginBottom: '20px' }}>Merchandising</div>
          </Link>
          <Link className={styles.userContainer} href="/createUser">
            <div className={styles.createUser}style={{ marginBottom: '20px' }}>Create Employee</div>
          </Link>
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
