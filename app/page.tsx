// Example in index.tsx or layout.tsx
import Link from 'next/link';

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
      </ul>
    </div>

  );
}