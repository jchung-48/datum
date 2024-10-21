import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';  // Import Firestore instance

// Contact type definition with role
type Contact = {
  name: string;
  phone: string;
  email: string;
  role: string;
};

// Buyer type definition
type Buyer = {
  contacts: Contact[];
  email: string;
  industry: string;
  name: string;
  phone: string;
};

// Company type definition
type Company = {
  id: string; // The Firestore document ID for the company
  name: string; // The name field from the company document
};

const AddBuyer = () => {
  const [companies, setCompanies] = useState<Company[]>([]); // List of companies
  const [selectedCompanyId, setSelectedCompanyId] = useState(''); // Selected company ID
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  // State for each new contact being added
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('');

  // Fetch companies from Firestore when the component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesCollectionRef = collection(db, 'Company');
        const companySnapshot = await getDocs(companiesCollectionRef);
        const companyList: Company[] = companySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setCompanies(companyList); // Set fetched companies in state
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Handler for adding a new contact to the contacts array
  const addContact = () => {
    setContacts([...contacts, { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole }]);
    // Reset contact fields after adding
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRole('');
  };

  // Function to handle adding a new buyer document to Firestore
  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }

    const buyer: Buyer = {
      contacts,
      email,
      industry,
      name,
      phone,
    };

    try {
      const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
      await addDoc(buyersCollectionRef, buyer);
      alert('Buyer added successfully!');
      // Reset form
      setName('');
      setEmail('');
      setIndustry('');
      setPhone('');
      setContacts([]);
    } catch (error) {
      console.error('Error adding buyer: ', error);
      alert('Error adding buyer');
    }
  };

  return (
    <div>
      <h2>Add New Buyer</h2>

      {/* Company Dropdown */}
      <div>
        <label>Select Company:</label>
        <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Buyer Form Fields */}
      <div>
        <label>Buyer Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label>Industry:</label>
        <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} />
      </div>
      <div>
        <label>Phone:</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {/* Contact Form Fields */}
      <h3>Contacts</h3>
      <div>
        <label>Contact Name:</label>
        <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} />
      </div>
      <div>
        <label>Contact Phone:</label>
        <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
      </div>
      <div>
        <label>Contact Email:</label>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
      </div>
      <div>
        <label>Contact Role:</label>
        <input type="text" value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
      </div>

      {/* Add Contact Button */}
      <button onClick={addContact}>Add Contact</button>

      {/* Display Added Contacts */}
      <h4>Current Contacts:</h4>
      <ul>
        {contacts.map((contact, index) => (
          <li key={index}>
            {contact.name} - {contact.phone} - {contact.email} - {contact.role}
          </li>
        ))}
      </ul>

      {/* Submit Button */}
      <button onClick={handleSubmit}>Add Buyer</button>
    </div>
  );
};

export default AddBuyer;
