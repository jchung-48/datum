// Example in index.tsx or layout.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      
      <ul>
        <li>
          {/* Link to the route, not the file */}
          <Link href="/upload">Go to Upload Page</Link>
        </li>
        <li>
          <Link href="/crudBuyer">Add/Edit Buyers</Link>
        </li>
      </ul>
    </div>

  );
}