"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // Import Firestore instance

// Contact type definition with role
type Contact = {
  name: string;
  phone: string;
  email: string;
  role: string;
};

// Catalog item type definition
type CatalogItem = {
  productName: string;
  productCode: string;
};

// Manufacturer type definition
type Manufacturer = {
  id?: string; // Firestore document ID, optional for new manufacturers
  contacts: Contact[];
  catalog: CatalogItem[];
  email: string;
  industry: string;
  name: string;
  phone: string;
};

// Company type definition (shared with buyers)
type Company = {
  id: string; // The Firestore document ID for the company
  name: string; // The name field from the company document
};

const AddOrEditManufacturer = () => {
  const [companies, setCompanies] = useState<Company[]>([]); // List of companies
  const [selectedCompanyId, setSelectedCompanyId] = useState(''); // Selected company ID
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]); // List of manufacturers for the selected company
  const [selectedManufacturerId, setSelectedManufacturerId] = useState(''); // Selected manufacturer ID (for editing)
  const [isNewManufacturer, setIsNewManufacturer] = useState(true); // Flag to check if it's a new manufacturer
  const [manufacturerData, setManufacturerData] = useState<Manufacturer>({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' }); // Manufacturer data
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null); // Index of contact being edited
  const [editingCatalogIndex, setEditingCatalogIndex] = useState<number | null>(null); // Index of catalog being edited

  // State for each new or edited contact
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('');

  // State for each new or edited catalog item
  const [catalogProductName, setCatalogProductName] = useState('');
  const [catalogProductCode, setCatalogProductCode] = useState('');

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

  // Function to fetch manufacturers based on selected company
  const fetchManufacturers = async (companyId: string) => {
    if (!companyId) return;
    
    try {
      const manufacturersCollectionRef = collection(db, `Company/${companyId}/Manufacturers`);
      const manufacturersSnapshot = await getDocs(manufacturersCollectionRef);
      const manufacturerList: Manufacturer[] = manufacturersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Manufacturer[];
      setManufacturers(manufacturerList); // Set the fetched manufacturers into state
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  // useEffect to fetch manufacturers when a company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      fetchManufacturers(selectedCompanyId); // Fetch manufacturers when a company is selected
    }
  }, [selectedCompanyId]);
  

  // Handler for adding or editing a contact
  const handleAddOrEditContact = () => {
    if (editingContactIndex !== null) {
      const updatedContacts = [...manufacturerData.contacts];
      updatedContacts[editingContactIndex] = { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole };
      setManufacturerData({ ...manufacturerData, contacts: updatedContacts });
      setEditingContactIndex(null); // Exit editing mode
    } else {
      setManufacturerData({
        ...manufacturerData,
        contacts: [...manufacturerData.contacts, { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole }],
      });
    }
    // Reset contact fields after adding or editing
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRole('');
  };

  const handleDeleteContact = (index: number) => {
    const updatedContacts = manufacturerData.contacts.filter((_, contactIndex) => contactIndex !== index);
    setManufacturerData({ ...manufacturerData, contacts: updatedContacts });
  };  

  // Handler for adding or editing a catalog item
  const handleAddOrEditCatalog = () => {
    if (editingCatalogIndex !== null) {
      const updatedCatalog = [...manufacturerData.catalog];
      updatedCatalog[editingCatalogIndex] = { productName: catalogProductName, productCode: catalogProductCode };
      setManufacturerData({ ...manufacturerData, catalog: updatedCatalog });
      setEditingCatalogIndex(null); // Exit editing mode
    } else {
      setManufacturerData({
        ...manufacturerData,
        catalog: [...manufacturerData.catalog, { productName: catalogProductName, productCode: catalogProductCode }],
      });
    }
    // Reset catalog fields after adding or editing
    setCatalogProductName('');
    setCatalogProductCode('');
  };

  const handleDeleteCatalogItem = (index: number) => {
    const updatedCatalog = manufacturerData.catalog.filter((_, catalogIndex) => catalogIndex !== index);
    setManufacturerData({ ...manufacturerData, catalog: updatedCatalog });
  };  

  // Handler for selecting a manufacturer from the list or choosing "New Manufacturer"
  const handleSelectManufacturer = (manufacturerId: string) => {
    if (manufacturerId === 'new') {
      setManufacturerData({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' });
      setSelectedManufacturerId('new'); // Ensure 'new' is set in the selectedManufacturerId
      setIsNewManufacturer(true); // Set to new manufacturer mode
    } else {
      const selectedManufacturer = manufacturers.find((manufacturer) => manufacturer.id === manufacturerId);
      if (selectedManufacturer) {
        setManufacturerData(selectedManufacturer);
        setSelectedManufacturerId(manufacturerId);
        setIsNewManufacturer(false); // Set to editing mode
      }
    }    
  };

  // Handler for adding or updating a manufacturer in Firestore

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }
  
    // Function to check for duplicate manufacturer
    const checkForDuplicate = async () => {
      const manufacturersCollectionRef = collection(db, `Company/${selectedCompanyId}/Manufacturers`);
      
      const manufacturersSnapshot = await getDocs(manufacturersCollectionRef);
      const manufacturerList = manufacturersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Manufacturer[];
  
      // Check for duplicates in name, email, or phone (excluding the current manufacturer in case of update)
      const nameExists = manufacturerList.some((manufacturer) => 
        manufacturer.name === manufacturerData.name && manufacturer.id !== selectedManufacturerId
      );
      const emailExists = manufacturerList.some((manufacturer) => 
        manufacturer.email === manufacturerData.email && manufacturer.id !== selectedManufacturerId
      );
      const phoneExists = manufacturerList.some((manufacturer) => 
        manufacturer.phone === manufacturerData.phone && manufacturer.id !== selectedManufacturerId
      );
  
      if (nameExists) {
        throw new Error('A manufacturer with the same name already exists.');
      }
  
      if (emailExists) {
        throw new Error('A manufacturer with the same email already exists.');
      }
  
      if (phoneExists) {
        throw new Error('A manufacturer with the same phone number already exists.');
      }
    };
  
    try {
      // Check for duplicates before adding or updating
      await checkForDuplicate();
  
      if (isNewManufacturer) {
        // Add a new manufacturer
        const manufacturersCollectionRef = collection(db, `Company/${selectedCompanyId}/Manufacturers`);
        await addDoc(manufacturersCollectionRef, manufacturerData);
        alert('Manufacturer added successfully!');
      } else {
        // Update existing manufacturer
        const manufacturerDocRef = doc(db, `Company/${selectedCompanyId}/Manufacturers/${selectedManufacturerId}`);
        await updateDoc(manufacturerDocRef, manufacturerData);
        alert('Manufacturer updated successfully!');
      }
  
      // Reset form and refetch manufacturers
      setManufacturerData({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' });
      setSelectedManufacturerId('new');
      setIsNewManufacturer(true);
      fetchManufacturers(selectedCompanyId);
    } catch (error) {
      console.error('Error:', error);
      alert(error); // Show the error to the user
    }
  };   

  // Handler for deleting a manufacturer
  const handleDeleteManufacturer = async () => {
    if (!selectedManufacturerId) return;
    try {
      const manufacturerDocRef = doc(db, `Company/${selectedCompanyId}/Manufacturers/${selectedManufacturerId}`);
      await deleteDoc(manufacturerDocRef);
      alert('Manufacturer deleted successfully!');
      setManufacturerData({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' });
      setIsNewManufacturer(true);
      setSelectedManufacturerId('');
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      alert('Error deleting manufacturer');
    }
  };

  return (
    <div>
      <h2>{isNewManufacturer ? 'Add New Manufacturer' : 'Edit Manufacturer'}</h2>

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

      {/* Manufacturer Dropdown */}
      {selectedCompanyId && (
        <div>
          <label>Select Manufacturer:</label>
          <select value={selectedManufacturerId} onChange={(e) => handleSelectManufacturer(e.target.value)}>
            <option value="new">New Manufacturer</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manufacturer Form - Show only after selecting a company */}
      {selectedCompanyId && (
        <>
          <div>
            <input
            value={manufacturerData.name}
            onChange={(e) => setManufacturerData({ ...manufacturerData, name: e.target.value })}
            placeholder = "Manufacturer Name"
            />
          </div>

          <div>
            <input
            value={manufacturerData.phone}
            onChange={(e) => setManufacturerData({ ...manufacturerData, phone: e.target.value })}
            placeholder = "Phone"
            />
          </div>

          <div>
            <input
            value={manufacturerData.email}
            onChange={(e) => setManufacturerData({ ...manufacturerData, email: e.target.value })}
            placeholder = "Email"
            />
          </div>

          <div>
            <input
            value={manufacturerData.industry}
            onChange={(e) => setManufacturerData({ ...manufacturerData, industry: e.target.value })}
            placeholder = "Industry"
            />
          </div>

          {/* Contacts Section */}
          <h3>Contacts</h3>
          <ul>
            {manufacturerData.contacts.map((contact, index) => (
              <li key={index}>
                {contact.name} ({contact.role}) - {contact.phone} - {contact.email}
                <button
                  onClick={() => {
                    setEditingContactIndex(index);
                    setContactName(contact.name);
                    setContactPhone(contact.phone);
                    setContactEmail(contact.email);
                    setContactRole(contact.role);
                  }}
                >
                  Edit
                </button>

                {/* Delete Button */}
                <button onClick={() => handleDeleteContact(index)}>Delete</button>
              </li>
            ))}
          </ul>
          <div>
            <div>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" />
            </div>
            <div>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" />
            </div>
            <div>
              <input value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="Role" />
            </div>
            <button onClick={handleAddOrEditContact}>
              {editingContactIndex !== null ? 'Update' : 'Add'} Contact
            </button>
          </div>

          {/* Catalog Section */}
          <h3>Catalog</h3>
          <ul>
            {manufacturerData.catalog.map((item, index) => (
              <li key={index}>
                {item.productName} - {item.productCode}
                <button
                  onClick={() => {
                    setEditingCatalogIndex(index);
                    setCatalogProductName(item.productName);
                    setCatalogProductCode(item.productCode);
                  }}
                >
                  Edit
                </button>

                {/* Delete Button */}
                <button onClick={() => handleDeleteCatalogItem(index)}>Delete</button>
              </li>
            ))}
          </ul>
          <div>
            <div>
              <input value={catalogProductName} onChange={(e) => setCatalogProductName(e.target.value)} placeholder="Product Name" />
            </div>
            <div>
              <input value={catalogProductCode} onChange={(e) => setCatalogProductCode(e.target.value)} placeholder="Product Code" />
            </div>
            <button onClick={handleAddOrEditCatalog}>
              {editingCatalogIndex !== null ? 'Update' : 'Add'} Catalog Item
            </button>
          </div>

          {/* Submit or Delete Manufacturer */}
          <button onClick={handleSubmit}>{isNewManufacturer ? 'Add Manufacturer' : 'Update Manufacturer'}</button>
          {!isNewManufacturer && <button onClick={handleDeleteManufacturer}>Delete Manufacturer</button>}
        </>
      )}
    </div>
  );
};

export default AddOrEditManufacturer;