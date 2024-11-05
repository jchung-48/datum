import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient'; // Import Firestore instance

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
  const [isNewBuyer, setIsNewBuyer] = useState(false); // Flag to check if it's a new buyer
  const [buyerData, setBuyerData] = useState<Buyer>({ contacts: [], email: '', industry: '', name: '', phone: '' }); // Buyer data
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null); // Index of contact being edited

  // State for each new or edited contact
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
  
        // Autopopulate buyerData when "New Buyer" is selected initially
        setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
        
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
  
    fetchCompanies();
  }, []);
  
  const fetchBuyers = async (companyId: string) => {
    if (!companyId) return;

    try {
      const buyersCollectionRef = collection(db, `Company/${companyId}/Buyers`);
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


  // Fetch buyers once a company is selected
  useEffect(() => {
    if (selectedCompanyId && !isNewBuyer) {
      fetchBuyers(selectedCompanyId);
    }
  }, [selectedCompanyId, isNewBuyer]);

  // Handler for adding a new contact to the contacts array or editing an existing one
  const handleAddOrEditContact = () => {
    if (editingContactIndex !== null) {
      const updatedContacts = [...buyerData.contacts];
      updatedContacts[editingContactIndex] = { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole };
      setBuyerData({ ...buyerData, contacts: updatedContacts });
      setEditingContactIndex(null); // Exit editing mode
    } else {
      setBuyerData({
        ...buyerData,
        contacts: [...buyerData.contacts, { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole }],
      });
    }
    // Reset contact fields after adding or editing
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRole('');
  };

  // Handler for editing an existing contact
  const handleEditContact = (index: number) => {
    const contactToEdit = buyerData.contacts[index];
    setContactName(contactToEdit.name);
    setContactPhone(contactToEdit.phone);
    setContactEmail(contactToEdit.email);
    setContactRole(contactToEdit.role);
    setEditingContactIndex(index);
  };

  // Handler for deleting a contact
  const handleDeleteContact = (index: number) => {
    const updatedContacts = buyerData.contacts.filter((_, i) => i !== index);
    setBuyerData({ ...buyerData, contacts: updatedContacts });
  };

  // Handler for selecting a buyer from the list or choosing "New Buyer"
  const handleSelectBuyer = (buyerId: string) => {
    if (buyerId === 'new') {
      setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
      setSelectedBuyerId('new'); // Ensure 'new' is set in the selectedBuyerId
      setIsNewBuyer(true); // Set to new buyer mode
    } else {
      const selectedBuyer = buyers.find((buyer) => buyer.id === buyerId);
      if (selectedBuyer) {
        setBuyerData(selectedBuyer);
        setSelectedBuyerId(buyerId);
        setIsNewBuyer(false); // Set to editing mode
      }
    }
  };

  // New function to be added to handle company selection
  const handleCompanySelect = async (companyId: string) => {
    setSelectedCompanyId(companyId); // Set selected company ID

    // Fetch buyers for the selected company
    const buyersCollectionRef = collection(db, `Company/${companyId}/Buyers`);
    const buyersSnapshot = await getDocs(buyersCollectionRef);
    const buyerList: Buyer[] = buyersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Buyer[];

    setBuyers(buyerList); // Set the buyers in state
    setSelectedBuyerId('new'); // Automatically select 'New Buyer'
    setIsNewBuyer(true); // Set to new buyer mode
    setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' }); // Reset buyer data
  };


  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }
  
    // Function to check for duplicate manufacturer
    const checkForDuplicate = async () => {
      const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
      
      const buyersSnapshot = await getDocs(buyersCollectionRef);
      const buyerList = buyersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Buyer[];
  
      // Check for duplicates in name, email, or phone (excluding the current buyer in case of update)
      const nameExists = buyerList.some((buyer) => 
        buyer.name === buyerData.name && buyer.id !== selectedBuyerId
      );
      const emailExists = buyerList.some((buyer) => 
        buyer.email === buyerData.email && buyer.id !== selectedBuyerId
      );
      const phoneExists = buyerList.some((buyer) => 
        buyer.phone === buyerData.phone && buyer.id !== selectedBuyerId
      );
  
      if (nameExists) {
        throw new Error('A buyer with the same name already exists.');
      }
  
      if (emailExists) {
        throw new Error('A buyer with the same email already exists.');
      }
  
      if (phoneExists) {
        throw new Error('A buyer with the same phone number already exists.');
      }
    };
  
    try {
      // Check for duplicates before adding or updating
      await checkForDuplicate();
  
      if (isNewBuyer) {
        // Add a new manufacturer
        const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
        await addDoc(buyersCollectionRef, buyerData);
        alert('Manufacturer added successfully!');
      } else {
        // Update existing manufacturer
        const manufacturerDocRef = doc(db, `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`);
        await updateDoc(manufacturerDocRef, buyerData);
        alert('Manufacturer updated successfully!');
      }
  
      // Reset form and refetch buyers
      setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
      setSelectedBuyerId('new');
      setIsNewBuyer(true);
      fetchBuyers(selectedCompanyId);
    } catch (error) {
      console.error('Error:', error);
      alert(error); // Show the error to the user
    }
  };
  

  // Handler for adding or updating a buyer in Firestore with duplicate check
  // const handleSubmit = async () => {
  //   if (!selectedCompanyId) {
  //     alert('Please select a company');
  //     return;
  //   }

  //   try {
  //     // Fetch existing buyers to check for duplicates
  //     const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
  //     const buyersSnapshot = await getDocs(buyersCollectionRef);
  //     const existingBuyers = buyersSnapshot.docs.map((doc) => doc.data()) as Buyer[];

  //     // Check for duplicate name, email, or phone number
  //     const duplicateBuyer = existingBuyers.find(
  //       (buyer) =>
  //         buyer.name.toLowerCase() === buyerData.name.toLowerCase() ||
  //         buyer.email.toLowerCase() === buyerData.email.toLowerCase() ||
  //         buyer.phone === buyerData.phone
  //     );

  //     if (duplicateBuyer) {
  //       // Prevent submission if a duplicate is found
  //       alert(
  //         `A buyer with the same ${duplicateBuyer.name === buyerData.name ? 'name' : 
  //             duplicateBuyer.email === buyerData.email ? 'email' : 'phone number'} already exists.`
  //       );
  //       return;
  //     }

  //     // Proceed with adding or updating the buyer
  //     if (isNewBuyer) {
  //       // Add a new buyer
  //       await addDoc(buyersCollectionRef, buyerData);
  //       alert('Buyer added successfully!');
  //     } else {
  //       // Update existing buyer
  //       const buyerDocRef = doc(db, `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`);
  //       await updateDoc(buyerDocRef, buyerData);
  //       alert('Buyer updated successfully!');
  //     }

  //     // Reset form to prepare for adding a new buyer
  //     setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
  //     setSelectedBuyerId('new'); // Switch back to "New Buyer"
  //     setIsNewBuyer(true); // Set to new buyer mode

  //   } catch (error) {
  //     console.error('Error adding or updating buyer:', error);
  //     alert('Error adding or updating buyer');
  //   }
  // };


  // Handler for deleting a buyer
  const handleDeleteBuyer = async () => {
    if (!selectedBuyerId) return;
    try {
      const buyerDocRef = doc(db, `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`);
      await deleteDoc(buyerDocRef);
      alert('Buyer deleted successfully!');
      setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
      setIsNewBuyer(true);
      setSelectedBuyerId('');
    } catch (error) {
      console.error('Error deleting buyer:', error);
      alert('Error deleting buyer');
    }
  };

  return (
    <div>
      <h2>{isNewBuyer ? 'Add New Buyer' : 'Edit Buyer'}</h2>

      {/* Company Dropdown */}
      <div>
        <label>Select Company:</label>
        <select value={selectedCompanyId} onChange={(e) => handleCompanySelect(e.target.value)}>
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

      </div>

      {/* Buyer Dropdown */}
      {selectedCompanyId && (
        <div>
          <label>Select Buyer:</label>
          <select value={selectedBuyerId} onChange={(e) => handleSelectBuyer(e.target.value)}>
            <option value="new">New Buyer</option>
            {buyers.map((buyer) => (
              <option key={buyer.id} value={buyer.id}>
                {buyer.name}
              </option>
            ))}
          </select>
        </div>
      )}


      {/* Buyer Form Fields (only show if buyer selected or adding new buyer) */}
      {(isNewBuyer || selectedBuyerId) && (
        <>
          <div>
            <input
              type="text"
              value={buyerData.name}
              onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
              placeholder = "Buyer Name"
            />
          </div>
          <div>
            <input
              type="tel"
              value={buyerData.phone}
              onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
              placeholder = "Phone"
            />
          </div>
          <div>
            <input
              type="email"
              value={buyerData.email}
              onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
              placeholder = "Email"
            />
          </div>
          <div>
            <input
              type="text"
              value={buyerData.industry}
              onChange={(e) => setBuyerData({ ...buyerData, industry: e.target.value })}
              placeholder = "Industry"
            />
          </div>
          

          
          <h3>Contacts</h3>
          {/* Display Added Contacts */}
          <ul>
            {buyerData.contacts.map((contact, index) => (
              <li key={index}>
                {contact.name} ({contact.role}) - {contact.phone} - {contact.email}
                <button onClick={() => handleEditContact(index)}>Edit</button>
                <button onClick={() => handleDeleteContact(index)}>Delete</button>
              </li>
            ))}
          </ul>
          {/* Contact Form Fields */}
          <div>
            <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder = "Name"
            />
          </div>
          <div>
            <input type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder = "Phone"
            />
          </div>
          <div>
            <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder = "Email"
            />
          </div>
          <div>
            <input
            type="text"
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
            placeholder = "Role"
            />
          </div>

          {/* Add/Edit Contact Button */}
          <div>
            <button onClick={handleAddOrEditContact}>
              {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>

          {/* Submit Button */}
          <button onClick={handleSubmit}>{isNewBuyer ? 'Add Buyer' : 'Update Buyer'}</button>

          {/* Delete Buyer Button */}
          {!isNewBuyer && <button onClick={handleDeleteBuyer}>Delete Buyer</button>}
        </>
      )}
    </div>
  );
};

export default AddOrEditBuyer;
