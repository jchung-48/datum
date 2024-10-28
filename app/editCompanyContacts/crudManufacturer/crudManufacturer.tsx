import React, { useEffect, useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { 
  fetchCompanies,
  fetchContacts,
  checkForDuplicate,
  handleAddOrEditContact,
  handleDeleteContact
} from '../editContactUtils';
import { Manufacturer, Company } from '../../types';

const AddOrEditManufacturer = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [isNewManufacturer, setIsNewManufacturer] = useState(false);
  const [manufacturerData, setManufacturerData] = useState<Manufacturer>({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' });
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('');

  useEffect(() => {
    const loadCompanies = async () => {
      const companyList = await fetchCompanies();
      setCompanies(companyList);
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      const loadManufacturers = async () => {
        const manufacturerList = await fetchContacts(selectedCompanyId, 'Manufacturer');
        setManufacturers(manufacturerList as Manufacturer[]);
      };
      loadManufacturers();
    }
  }, [selectedCompanyId]);

  const handleSelectManufacturer = (manufacturerId: string) => {
    if (manufacturerId === 'new') {
      setManufacturerData({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' });
      setSelectedManufacturerId('new');
      setIsNewManufacturer(true);
    } else {
      const selectedManufacturer = manufacturers.find((manufacturer) => manufacturer.id === manufacturerId);
      if (selectedManufacturer) {
        setManufacturerData(selectedManufacturer);
        setSelectedManufacturerId(manufacturerId);
        setIsNewManufacturer(false);
      }
    }
  };

  const handleContactAddOrEdit = () => {
    const updatedContacts = handleAddOrEditContact(
      manufacturerData.contacts,
      { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole },
      editingContactIndex
    );

    setManufacturerData({ ...manufacturerData, contacts: updatedContacts });
    setEditingContactIndex(null);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRole('');
  };

  const handleContactDelete = (index: number) => {
    const updatedContacts = handleDeleteContact(manufacturerData.contacts, index);
    setManufacturerData({ ...manufacturerData, contacts: updatedContacts });
  };

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }

    try {
      await checkForDuplicate(selectedCompanyId, manufacturerData, 'Manufacturer', selectedManufacturerId);

      if (isNewManufacturer) {
        const manufacturersCollectionRef = collection(db, `Company/${selectedCompanyId}/Manufacturers`);
        await addDoc(manufacturersCollectionRef, manufacturerData);
        alert('Manufacturer added successfully!');
      } else {
        const manufacturerDocRef = doc(db, `Company/${selectedCompanyId}/Manufacturers/${selectedManufacturerId}`);
        await updateDoc(manufacturerDocRef, manufacturerData);
        alert('Manufacturer updated successfully!');
      }

      setManufacturerData({ contacts: [], catalog: [], email: '', industry: '', name: '', phone: '' });
      setSelectedManufacturerId('new');
      setIsNewManufacturer(true);
      setManufacturers(await fetchContacts(selectedCompanyId, 'Manufacturer') as Manufacturer[]);
    } catch (error) {
      console.error('Error:', error);
      alert(error);
    }
  };

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

      {/* Manufacturer Form Fields */}
      {(isNewManufacturer || selectedManufacturerId) && (
        <>
          <div>
            <input
              type="text"
              value={manufacturerData.name}
              onChange={(e) => setManufacturerData({ ...manufacturerData, name: e.target.value })}
              placeholder="Manufacturer Name"
            />
          </div>
          <div>
            <input
              type="tel"
              value={manufacturerData.phone}
              onChange={(e) => setManufacturerData({ ...manufacturerData, phone: e.target.value })}
              placeholder="Phone"
            />
          </div>
          <div>
            <input
              type="email"
              value={manufacturerData.email}
              onChange={(e) => setManufacturerData({ ...manufacturerData, email: e.target.value })}
              placeholder="Email"
            />
          </div>
          <div>
            <input
              type="text"
              value={manufacturerData.industry}
              onChange={(e) => setManufacturerData({ ...manufacturerData, industry: e.target.value })}
              placeholder="Industry"
            />
          </div>

          {/* Contact Management */}
          <h3>Contacts</h3>
          <ul>
            {manufacturerData.contacts.map((contact, index) => (
              <li key={index}>
                {contact.name} ({contact.role}) - {contact.phone} - {contact.email}
                <button onClick={() => setEditingContactIndex(index)}>Edit</button>
                <button onClick={() => handleContactDelete(index)}>Delete</button>
              </li>
            ))}
          </ul>

          {/* Contact Form Fields */}
          <div>
            <div>
              <input 
                value={contactName} 
                onChange={(e) => setContactName(e.target.value)} 
                placeholder="Name" 
              />
            </div>
            <div>
              <input 
                value={contactPhone} 
                onChange={(e) => setContactPhone(e.target.value)} 
                placeholder="Phone" 
              />
            </div>
            <div>
              <input 
                value={contactEmail} 
                onChange={(e) => setContactEmail(e.target.value)} 
                placeholder="Email" 
              />
            </div>
            <div>
              <input 
                value={contactRole} 
                onChange={(e) => setContactRole(e.target.value)} 
                placeholder="Role" 
              />
            </div>

            <button onClick={handleContactAddOrEdit}>
              {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>

          {/* Submit Buttons */}
          <button onClick={handleSubmit}>{isNewManufacturer ? 'Add Manufacturer' : 'Update Manufacturer'}</button>
          {!isNewManufacturer && <button onClick={handleDeleteManufacturer}>Delete Manufacturer</button>}
        </>
      )}
    </div>
  );
};

export default AddOrEditManufacturer;
