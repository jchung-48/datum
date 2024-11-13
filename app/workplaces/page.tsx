"use client";
import { useState, useEffect } from "react";
import { getCompanies } from "../authentication";
import { auth, db } from '@/lib/firebaseClient'; 
import { doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import { LuCloudLightning } from 'react-icons/lu';
import './styles.modules.css';
import { useRouter } from "next/navigation";
import { capitalize } from 'lodash';
import React from 'react';

interface Company {
  id: string;
  name: string;
}

const Page = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(true);
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
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesList = await getCompanies();
        setCompanies(companiesList);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false); // Set loading to false after the data is fetched
      }
    };
    fetchCompanies();
  }, []);  

  const companySelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(event.target.value);
    console.log(event.target.value);
    router.push(`/signin?workplaceId=${event.target.value}`);
  };

  if (loading) {
    return <div>Loading companies...</div>; // Loading indicator (can be styled or replaced with a spinner)
  }

  return (
    <div className="container">
      <Link href="/home">
        <div className="home">
          <LuCloudLightning className="cloud-icon"/>
          DATUM
        </div>
      </Link>
      <h1 className="title">Select a Workplace:</h1>
      <select value={selectedCompany} onChange={companySelect}>
        <option value="" disabled>Unselected</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {capitalize(company.name)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Page;