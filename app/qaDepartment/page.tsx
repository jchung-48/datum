import Link from 'next/link';

const qaDepartment = () => {
    return (
      <div>

        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to Quality Assurance!</h1>
        <p>These are the QA files.</p>
        
      </div>
    );
  };
  
  export default qaDepartment;