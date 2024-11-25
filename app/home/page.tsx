
'use client';
import Link from 'next/link';
import React, {useEffect, useState} from 'react';
import {auth, db} from '@/lib/firebaseClient';
import {doc, getDoc, DocumentReference} from 'firebase/firestore';
import {useRouter} from 'next/navigation';
import {logoutUser} from '../authentication';
import {LuCloudLightning} from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';
import styles from './home.module.css'; // Correct import for CSS Modules
import {getEmployeeProfile} from '../authentication'; // Adjust the import path if needed

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userDepartments, setUserDepartments] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // New state for admin status

  const departmentMapping = {
    qa: 'Eq2IDInbEQB5nI5Ar6Vj',
    hr: 'NpaV1QtwGZ2MDNOGAlXa',
    logistics: 'KZm56fUOuTobsTRCfknJ',
    merchandising: 'ti7yNByDOzarVXoujOog',
  };

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async user => {
          if (user) {
            const employeeProfile = await getEmployeeProfile(user.uid);
            const employeeName = employeeProfile?.name;
            console.log('Signed-in employee name:', employeeName);

            const companyDocRef = doc(db, 'Company', 'mh3VZ5IrZjubXUCZL381');
            const companyDocSnap = await getDoc(companyDocRef);

            if (companyDocSnap.exists()) {
              const companyData = companyDocSnap.data();
              const admins: DocumentReference[] = companyData?.admins || [];

              const adminNames = await Promise.all(
                admins.map(async (ref: DocumentReference) => {
                  const adminSnap = await getDoc(ref);
                  return adminSnap.exists() ? adminSnap.data()?.name : null;
                }),
              );

              console.log('Admin Names:', adminNames);

              const isEmployeeAdmin = adminNames.includes(employeeName);
              setIsAdmin(isEmployeeAdmin); // Update admin status
              console.log(
                isEmployeeAdmin
                  ? 'Employee is an admin.'
                  : 'Employee is NOT an admin.'
              );
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching admins:', error);
        return null;
      }
    };

    fetchAdmins();
  }, []);

  useEffect(() => {
    document.body.classList.add('home-page');

    //const [userDepartments, setUserDepartments] = useState<string[]>([]);

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        setIsSignedIn(true);

        try {
          const profile: {departments: DocumentReference[]} =
            await getEmployeeProfile(user.uid);

          const resolvedDepartments = await Promise.all(
            profile.departments.map(async (ref: DocumentReference) => {
              const departmentSnap = await getDoc(ref);
              return departmentSnap.id; // departmentSnap.id is a string
            }),
          );

          setUserDepartments(resolvedDepartments); // resolvedDepartments is string[]
        } catch (error) {
          console.error('Error fetching profile info:', error);
        }
      } else {
        setIsSignedIn(false);
      }
    });

    // Clean up the effect by removing the home-page class on unmount
    return () => {
      document.body.classList.remove('home-page');
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await logoutUser();
    router.push('/workplaces');
  };

  const isDepartmentEnabled = (
    departmentKey: keyof typeof departmentMapping,
  ): boolean => {
    const departmentId = departmentMapping[departmentKey];
    return userDepartments.includes(departmentId);
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.home}>
          <LuCloudLightning className={styles.cloudIcon}/>
        </div>
        
        {isDepartmentEnabled('qa') || isAdmin ? (
          <Link href="/departments/qa">
            <div
              className={styles.topButtons}
              style={{marginBottom: '20px', opacity: 1}}
            >
              Quality Assurance
            </div>
          </Link>
        ) : (
          <div
            className={styles.topButtons}
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

        {isDepartmentEnabled('hr') || isAdmin ? (
          <Link href="/departments/hr">
            <div
              className={styles.topButtons}
              style={{marginBottom: '20px', opacity: 1}}
            >
              Human Resources
            </div>
          </Link>
        ) : (
          <div
            className={styles.topButtons}
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
        {isDepartmentEnabled('logistics') || isAdmin ? (
          <Link href="/departments/logistics">
            <div
              className={styles.topButtons}
              style={{marginBottom: '20px', opacity: 1}}
            >
              Logistics
            </div>
          </Link>
        ) : (
          <div
            className={styles.topButtons}
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

        {isDepartmentEnabled('merchandising') || isAdmin ? (
          <Link href="/departments/merchandising">
            <div
              className={styles.topButtons}
              style={{marginBottom: '20px', opacity: 1}}
            >
              Merchandising
            </div>
          </Link>
        ) : (
          <div
            className={styles.topButtons}
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
            <div
              className={styles.createUser}
              style={{marginBottom: '20px', opacity: 1}}
            >
              Create Employee
            </div>
          </Link>
        ) : (
          <div
            className={styles.createUser}
            style={{
              marginBottom: '20px',
              opacity: 0.5,
              cursor: 'not-allowed',
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
          <div style={{marginBottom: '20px'}}>FAQ</div>
        </Link>
      </div>
    </div>
  );
}
