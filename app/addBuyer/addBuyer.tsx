import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
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
  id?: string; // Firestore document ID, optional for new buyers
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

const AddOrEditBuyer = () => {
  const [companies, setCompanies] = useState<Company[]>([]); // List of companies
  const [selectedCompanyId, setSelectedCompanyId] = useState(''); // Selected company ID
  const [buyers, setBuyers] = useState<Buyer[]>([]); // List of buyers for the selected company
  const [selectedBuyerId, setSelectedBuyerId] = useState(''); // Selected buyer ID (for editing)
  const [isNewBuyer, setIsNewBuyer] = useState(true); // Flag to check if it's a new buyer
  const [buyerData, setBuyerData] = useState<Buyer>({ contacts: [], email: '', industry: '', name: '', phone: '' }); // Buyer data

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

  // Fetch buyers once a company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      const fetchBuyers = async () => {
        try {
          const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
          const buyersSnapshot = await getDocs(buyersCollectionRef);
          const buyerList: Buyer[] = buyersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Buyer[];
          setBuyers(buyerList);
        } catch (error) {
          console.error('Error fetching buyers:', error);
        }
      };
      fetchBuyers();
    }
  }, [selectedCompanyId]);

  // Handler for adding a new contact to the contacts array
  const addContact = () => {
    setBuyerData({
      ...buyerData,
      contacts: [
        ...buyerData.contacts,
        { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole },
      ],
    });
    // Reset contact fields after adding
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRole('');
  };

  // Handler for selecting a buyer from the list and updating the form fields
  const handleSelectBuyer = (buyerId: string) => {
    const selectedBuyer = buyers.find((buyer) => buyer.id === buyerId);
    if (selectedBuyer) {
      setBuyerData(selectedBuyer);
      setSelectedBuyerId(buyerId);
      setIsNewBuyer(false); // Set the flag to indicate editing mode
    }
  };

  // Handler for adding or updating a buyer in Firestore
  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }

    if (isNewBuyer) {
      // Add a new buyer
      try {
        const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
        await addDoc(buyersCollectionRef, buyerData);
        alert('Buyer added successfully!');
        // Reset form
        setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
        setIsNewBuyer(true);
      } catch (error) {
        console.error('Error adding buyer:', error);
        alert('Error adding buyer');
      }
    } else {
      // Update existing buyer
      try {
        const buyerDocRef = doc(db, `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`);
        await updateDoc(buyerDocRef, buyerData);
        alert('Buyer updated successfully!');
        // Reset form
        setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
        setIsNewBuyer(true);
      } catch (error) {
        console.error('Error updating buyer:', error);
        alert('Error updating buyer');
      }
    }
  };

  return (
    <div>
      <h2>{isNewBuyer ? 'Add New Buyer' : 'Edit Buyer'}</h2>

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

      {/* Buyer Dropdown */}
      {selectedCompanyId && buyers.length > 0 && (
        <div>
          <label>Select Existing Buyer:</label>
          <select value={selectedBuyerId} onChange={(e) => handleSelectBuyer(e.target.value)}>
            <option value="">Select a buyer</option>
            {buyers.map((buyer) => (
              <option key={buyer.id} value={buyer.id}>
                {buyer.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Buyer Form Fields */}
      <div>
        <label>Buyer Name:</label>
        <input
          type="text"
          value={buyerData.name}
          onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={buyerData.email}
          onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
        />
      </div>
      <div>
        <label>Industry:</label>
        <input
          type="text"
          value={buyerData.industry}
          onChange={(e) => setBuyerData({ ...buyerData, industry: e.target.value })}
        />
      </div>
      <div>
        <label>Phone:</label>
        <input
          type="tel"
          value={buyerData.phone}
          onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
        />
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
        {buyerData.contacts.map((contact, index) => (
          <li key={index}>
            {contact.name} - {contact.phone} - {contact.email} - {contact.role}
          </li>
        ))}
      </ul>

      {/* Submit Button */}
      <button onClick={handleSubmit}>{isNewBuyer ? 'Add Buyer' : 'Update Buyer'}</button>
    </div>
  );
};

export default AddOrEditBuyer;
