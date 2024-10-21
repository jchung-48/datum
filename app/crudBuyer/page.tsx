"use client";

import AddBuyer from './addBuyer';
import Link from 'next/link';

function App() {
  return (
    <div>
      {/* Home Button */}
      <Link href="/">
        <button style={{ marginBottom: '20px' }}>Home</button>
      </Link>

      <AddBuyer />
    </div>
  );
}

export default App;
