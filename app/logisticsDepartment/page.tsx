import Link from 'next/link';
import React from 'react';

const logisticsDepartment = () => {
    return (
      <div>

        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Logistics!</h1>
        <p>These are the Logi files.</p>
      </div>
    );
  };
  
  export default logisticsDepartment;