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
import { Buyer, Company } from '../../types';

const AddOrEditBuyer = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [isNewBuyer, setIsNewBuyer] = useState(false);
  const [buyerData, setBuyerData] = useState<Buyer>({ contacts: [], email: '', industry: '', name: '', phone: '' });
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
      const loadBuyers = async () => {
        const buyerList = await fetchContacts(selectedCompanyId, 'Buyer');
        setBuyers(buyerList as Buyer[]);
      };
      loadBuyers();
    }
  }, [selectedCompanyId]);

  const handleSelectBuyer = (buyerId: string) => {
    if (buyerId === 'new') {
      setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
      setSelectedBuyerId('new');
      setIsNewBuyer(true);
    } else {
      const selectedBuyer = buyers.find((buyer) => buyer.id === buyerId);
      if (selectedBuyer) {
        setBuyerData(selectedBuyer);
        setSelectedBuyerId(buyerId);
        setIsNewBuyer(false);
      }
    }
  };

  const handleContactAddOrEdit = () => {
    const updatedContacts = handleAddOrEditContact(
      buyerData.contacts,
      { name: contactName, phone: contactPhone, email: contactEmail, role: contactRole },
      editingContactIndex
    );

    setBuyerData({ ...buyerData, contacts: updatedContacts });
    setEditingContactIndex(null);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRole('');
  };

  const handleContactDelete = (index: number) => {
    const updatedContacts = handleDeleteContact(buyerData.contacts, index);
    setBuyerData({ ...buyerData, contacts: updatedContacts });
  };

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('Please select a company');
      return;
    }

    try {
      await checkForDuplicate(selectedCompanyId, buyerData, 'Buyer', selectedBuyerId);

      if (isNewBuyer) {
        const buyersCollectionRef = collection(db, `Company/${selectedCompanyId}/Buyers`);
        await addDoc(buyersCollectionRef, buyerData);
        alert('Buyer added successfully!');
      } else {
        const buyerDocRef = doc(db, `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`);
        await updateDoc(buyerDocRef, buyerData);
        alert('Buyer updated successfully!');
      }

      setBuyerData({ contacts: [], email: '', industry: '', name: '', phone: '' });
      setSelectedBuyerId('new');
      setIsNewBuyer(true);
      setBuyers(await fetchContacts(selectedCompanyId, 'Buyer') as Buyer[]);
    } catch (error) {
      console.error('Error:', error);
      alert(error);
    }
  };

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

      {/* Buyer Form Fields */}
      {(isNewBuyer || selectedBuyerId) && (
        <>
          <div>
            <input
              type="text"
              value={buyerData.name}
              onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
              placeholder="Buyer Name"
            />
          </div>
          <div>
            <input
              type="tel"
              value={buyerData.phone}
              onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
              placeholder="Phone"
            />
          </div>
          <div>
            <input
              type="email"
              value={buyerData.email}
              onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
              placeholder="Email"
            />
          </div>
          <div>
            <input
              type="text"
              value={buyerData.industry}
              onChange={(e) => setBuyerData({ ...buyerData, industry: e.target.value })}
              placeholder="Industry"
            />
          </div>

          {/* Contact Management */}
          <h3>Contacts</h3>
          <ul>
            {buyerData.contacts.map((contact, index) => (
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
          <button onClick={handleSubmit}>{isNewBuyer ? 'Add Buyer' : 'Update Buyer'}</button>
          {!isNewBuyer && <button onClick={handleDeleteBuyer}>Delete Buyer</button>}
        </>
      )}
    </div>
  );
};

export default AddOrEditBuyer;
