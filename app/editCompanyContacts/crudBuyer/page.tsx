"use client";

import AddOrEditBuyer from './crudBuyer';
import Link from 'next/link';

function App() {
  return (
    <div>
      {/* Home Button */}
      <Link href="/">
        <button style={{ marginBottom: '20px' }}>Home</button>
      </Link>

      <AddOrEditBuyer />
    </div>
  );
}

export default App;
