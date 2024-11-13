// pages/faq.tsx
"use client"
import React, { useState } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import Link from "next/link";
import { LuCloudLightning } from 'react-icons/lu';
import './styles.modules.css';

// Define the structure of FAQ data
interface FAQ {
  id: string;
  question: string;
  answer: string;
  role: string;
  product_category: string;
  faq_category: string;
}

const FAQPage: React.FC = () => {
  // State for dropdown selections with types
  const [role, setRole] = useState<string>("");
  const [productCategory, setProductCategory] = useState<string>("");
  const [faqCategory, setFaqCategory] = useState<string>("");

  // State for search results and error messages with types
  const [faqResults, setFaqResults] = useState<FAQ[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Handler for search button
  const handleSearch = async () => {
    if (!role && !productCategory && !faqCategory) {
      setErrorMessage("No search criteria has been selected. You must choose at least one.");
      setFaqResults([]);
      return;
    }

    setErrorMessage("");
    setFaqResults([]);

    // Build Firestore query based on selected fields
    const faqCollectionRef = collection(db, "/Company/mh3VZ5IrZjubXUCZL381/faq");
    let q = query(faqCollectionRef);

    // Add query conditions based on selections
    if (role) q = query(q, where("role", "==", role));
    if (productCategory) q = query(q, where("product_category", "==", productCategory));
    if (faqCategory) q = query(q, where("faq_category", "==", faqCategory));

    try {
      const querySnapshot = await getDocs(q);
      const results: FAQ[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FAQ[]; // Type assertion to match FAQ type
      setFaqResults(results);
    } catch (error) {
      setErrorMessage("An error occurred while fetching data.");
    }
  };

  return (
    <div className="header">
        <Link href="/home">
        <div className="home">
          <LuCloudLightning className="cloud-icon"/>
          DATUM
        </div>
      </Link>
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 className="title">FAQ</h1>
      <p className="prompt">Please select from the following dropdown menus: </p>

      {/* Dropdown for Role */}
      <div>
        <label className="role">
          <div className="role-title">ROLE</div>
          <select className="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select One</option>
            <option value="Merchandiser">Merchandiser</option>
            <option value="QA Manager">QA Manager</option>
            <option value="Logistics Manager">Logistics Manager</option>
            <option value="Buyer">Buyer</option>
          </select>
        </label>
      </div>

      <div>
        <label className="role">
          <div className="role-title">PRODUCT CATEGORY</div>
          <select className="role-select" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
            <option value="">Select One</option>
            <option value="Small Kitchen Appliances">Small Kitchen Appliances</option>
            <option value="Furniture">Furniture</option>
            <option value="Textiles and Apparel">Textiles and Apparel</option>
            <option value="Heavy Machinery">Heavy Machinery</option>
          </select>
        </label>
      </div>

      {/* Dropdown for FAQ Category */}
      <div>
        <label className="role">
          <div className="role-title">FAQ CATEGORY</div>
          <select value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)}>
            <option value="">Select One</option>
            <option value="Product Availability">Product Availability</option>
            <option value="Product Quality">Product Quality</option>
            <option value="Logistics Scheduling">Logistics Scheduling</option>
            <option value="Competitive Pricing">Competitive Pricing</option>
          </select>
        </label>
      </div>

      <div className="button">
        <button className="search-button" onClick={handleSearch} style={{ marginTop: "10px", padding: "5px 15px" }}>
          Search
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {/* Display Results */}
      <div className="response" style={{ marginTop: "20px" }}>
        {faqResults.length > 0 ? (
          <ul>
            {faqResults.map((faq) => (
              <li key={faq.id} style={{ marginBottom: "15px" }}>
                <strong>Question:</strong> {faq.question} <br />
                <strong>Answer:</strong> {faq.answer} <br />
                <strong>Role:</strong> {faq.role} <br />
                <strong>Product Category:</strong> {faq.product_category} <br />
                <strong>FAQ Category:</strong> {faq.faq_category}
              </li>
            ))}
          </ul>
        ) : (
          !errorMessage && <p>No results found.</p>
        )}
      </div>
    </div>
  </div>
  );
};

export default FAQPage;
