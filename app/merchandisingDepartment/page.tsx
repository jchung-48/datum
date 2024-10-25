import Link from "next/link";
const merchandisingDepartment = () => {
    return (
      <div>

        <Link href="/">
          <button style={{ marginBottom: '20px' }}>Home</button>
        </Link>
        <h1>Welcome to Merchandising!</h1>
        <p>These are the Merchandising files.</p>
      </div>
    );
  };
  
  export default merchandisingDepartment;