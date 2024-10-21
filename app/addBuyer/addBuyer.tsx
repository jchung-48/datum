import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// // Initialize Firestore (Ensure this is initialized in your app)
// const db = getFirestore();

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

const AddBuyerPage = () => {
  const [companyId, setCompanyId] = useState(''); // To dynamically input the company ID
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
    const buyer: Buyer = {
      contacts,
      email,
      industry,
      name,
      phone,
    };

    try {
      const buyersCollectionRef = collection(db, `Company/${companyId}/Buyers`);
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
      {/* Company ID */}
      <div>
        <label>Company ID:</label>
        <input type="text" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
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

export default AddBuyerPage;