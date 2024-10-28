"use client";

import React from 'react';
import AddOrEditManufactuter from './crudManufacturer';
import Link from 'next/link';

function App() {
  return (
    <div>
      {/* Home Button */}
      <Link href="/">
        <button style={{ marginBottom: '20px' }}>Home</button>
      </Link>

      <AddOrEditManufactuter />
    </div>
  );
}

export default App;
