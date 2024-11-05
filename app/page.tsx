"use client";
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const authToken = Cookies.get('authToken'); // Use 'authToken' to match the cookie name
    console.log("Cookie authToken:", authToken);
    if (authToken) {
      // Redirect to Quality Assurance if user is authenticated
      router.push('/qaDepartment');
    } else {
      // Redirect to Workplaces selection if not signed in
      router.push('/workplaces');
    }
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
