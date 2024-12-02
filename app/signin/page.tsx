"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React from "react";
import { useState, useEffect } from "react";
import styles from './styles.module.css';
import { auth, db } from '@/lib/firebaseClient'; 
import { signInUser, getUserDepartments, resetPassword } from "../authentication";
import { doc, getDoc } from "firebase/firestore";

const Page = () => {
  const searchParams = useSearchParams(); // Get access to the search parameters (query parameters)
  const workplaceId = searchParams.get("workplaceId"); // Get the companyId from query parameters
  const firestoreIdPattern = /^[a-zA-Z0-9]{20}$/; // regex pattern for firestore IDs
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        const companyId = (await user.getIdTokenResult()).claims.companyId as string;
        const employeeRef = doc(db, "Company", companyId, "Employees", user.uid);
        const emSnap = await getDoc(employeeRef);
        if (emSnap.exists()) {
          const depRef = emSnap.get("departments")[0];
          const depSnap = await getDoc(depRef);
          if (depSnap.exists()) {
            const url = depSnap.get("URL");
            router.push(`/${url}`);
          }
        }
      } else if (!workplaceId || !firestoreIdPattern.test(workplaceId)) {
        router.push("/workplaces"); // Redirect to an error page if validation fails
      }
    });

    return () => unsubscribe();
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
      const userData = await signInUser(email, password, workplaceId);

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

    setTimeout(() => {
      setErrorMessage("");
    }, 3000);
  };

  const handlePassReset = async () => {
    if (email) {
      resetPassword(email);
    } else {
      alert("Please enter an email in order to reset your password!");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topLeftCircle}></div>
      <div className={styles.bottomRightCircle}></div>
      <div className={styles.boxContainer}>
        <div className={styles.box}>
          <h1 className={styles.login}>Login</h1>
          <h3 className={styles.loginWords}>Please login to continue</h3>
          <input
            className={styles.email}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={styles.password}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className={styles.submit} onClick={handleSignIn}>Sign In</button>
          {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}
        </div>
        <div className={styles.boxRight}>
          <div className={styles.triangleRight}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle2}></div>
          <h1 className={styles.new}>New Here?</h1>
          <h2 className={styles.datum}>Join Datum today!</h2>
        </div>
      </div>
    </div>
  );
};

export default Page;