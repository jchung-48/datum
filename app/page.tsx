"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseClient'; 
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        const companyId = (await user.getIdTokenResult()).claims.companyId as string;
        const employeeRef = doc(db, "Company", companyId, "Employees", user.uid);
        const emSnap = await getDoc(employeeRef);
        if (emSnap.exists()) {
          const depRef = emSnap.get("departments")[0];
          const depSnap = await getDoc(depRef);
          if (depSnap.exists()) {
            const url = depSnap.get("URL");
            router.push(`/${url}`);
          }
        }
      } else {
        router.push('/workplaces');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div>
      <h1>Validating User..</h1>
    </div>
  );
}
