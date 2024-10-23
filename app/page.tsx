// Example in index.tsx or layout.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {/* Link to the route, not the file */}
      <Link href="/upload">Go to Upload Page</Link>
      <br></br>
      <Link href="/user">Go to User Page</Link>
    </div>
  );
}
 