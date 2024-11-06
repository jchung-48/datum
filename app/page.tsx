"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseClient'; 
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    auth.onAuthStateChanged(async user => {
      if (user) {
        const companyId = (await user.getIdTokenResult()).claims.companyId as string;
        const employeeRef = doc(db, "Company", companyId, "Employees", user.uid);
        const emSnap = await getDoc(employeeRef);
        const depRef = emSnap.get("departments")[0];
        const depSnap = await getDoc(depRef);
        const url = depSnap.get("URL");
        router.push(`/${url}`);
      } else {
        router.push('/workplaces');
      }
    });
  }, [router]);

  return (
    <div>
      <h1>Validating User..</h1>
      
      {/* <ul>
        <li>
          <Link href="/upload">
            <button style={{ marginBottom: '20px' }}>Upload Documents</button>
          </Link>
        </li>
        <li>
          <Link href="/editCompanyContacts">
            <button style={{ marginBottom: '20px' }}>Add/Edit Company Contacts</button>
          </Link>
        </li>
        <li>
          <Link href="/user">
            <button style={{ marginBottom: '20px' }}>Log In/Sign up</button>
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
          <Link href="/pdfSummary">
            <button style={{ marginBottom: '20px' }}>PDF Summary Generator</button>
          </Link>
        </li>
      </ul>
     */}
     </div>
  );
}
