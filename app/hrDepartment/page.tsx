import Link from 'next/link';
const hrDepartment = () => {
    return (
      <div>

        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>

        <h1>Welcome to HR!</h1>
        <p>These are the HR files.</p>
      </div>
    );
  };
  
  export default hrDepartment;