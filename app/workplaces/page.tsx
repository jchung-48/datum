"use client";
import { useState, useEffect } from "react";
import { getCompanies } from "../authentication";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import React from 'react';

interface Company {
  id: string;
  name: string;
}

const Page = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(true); // Loading state to track fetch status
  const router = useRouter(); 

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
    <div>
      <h1>Select a Workplace</h1>
      <select value={selectedCompany} onChange={companySelect}>
        <option value="" disabled>Select a Workplace</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} {/* Display company name */}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Page;