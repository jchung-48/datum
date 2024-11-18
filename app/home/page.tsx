"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseClient'; 
import { useRouter } from 'next/navigation';
import { logoutUser } from '../authentication';
import { LuCloudLightning } from 'react-icons/lu';
import './styles.css';

export default function Home() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      setIsSignedIn(Boolean(user));
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/workplaces");
  }

  return (
    <div>
      <div className="header">
        <div className="home">
          <LuCloudLightning className="cloud-icon"/>
        </div>
          <Link href="/departments/qa">
            <div className="top-buttons" style={{ marginBottom: '20px' }}>Quality Assurance</div>
          </Link>
          <Link href="/departments/hr">
            <div className="top-buttons" style={{ marginBottom: '20px' }}>Human Resources</div>
          </Link>
          <Link href="/departments/logistics">
            <div className="top-buttons" style={{ marginBottom: '20px' }}>Logistics</div>
          </Link>
          <Link href="/departments/merchandising">
            <div className="top-buttons" style={{ marginBottom: '20px' }}>Merchandising</div>
          </Link>
          <Link className="user-container" href="/createUser">
            <div className="create-user"style={{ marginBottom: '20px' }}>Create Employee</div>
          </Link>

        {isSignedIn && (
          <button onClick={handleSignOut} style={{ marginTop: '20px' }}>
            Sign Out
          </button>
        )}
      </div>
      <div className="motto">
        Knowledge<br></br>
        is Power
      </div>
      <div className="description">
        Check out Datum, your source for excellence in supply <br></br>
        chain management and knowledge sharing!
      </div>
      <div className="bottom-buttons">
        <Link className="faq-button" href="/faq">
          <div style={{ marginBottom: '20px' }}>FAQ</div>
        </Link>
        <Link className="ai-button" href="/pdfSummary">
          <div style={{ marginBottom: '20px' }}>AI Summarizer</div>
        </Link>
      </div>
    </div>
  );
}
