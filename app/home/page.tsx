"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);


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
      </ul>
    </div>
  );
}
