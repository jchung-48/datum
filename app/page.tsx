// Example in index.tsx or layout.tsx
import Link from 'next/link';
import React from 'react';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <ul>
        <li>
          {/* Link to the route, not the file */}
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
          {/* Link to the route, not the file */}
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
      </ul>
    </div>
  );
}
