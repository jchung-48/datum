'use client';

import React, {useEffect, useState} from 'react';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import {db} from '@/lib/firebaseClient';
import {
    fetchCompanies,
    fetchContacts,
    checkForDuplicate,
    handleAddOrEditContact,
    handleDeleteContact,
} from '../editContactUtils';
import {Buyer, Company} from '../../types';
import Header from '@/app/Utilities/Header/header';
import styles from '../crudContacts.module.css';
import DropdownMenu from '@/app/Utilities/DropDownMenu/dropdownMenu';
import {FaEdit, FaTrashAlt} from 'react-icons/fa';

const AddOrEditBuyer = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [selectedBuyerId, setSelectedBuyerId] = useState('');
    const [isNewBuyer, setIsNewBuyer] = useState(false);
    const [buyerData, setBuyerData] = useState<Buyer>({
        contacts: [],
        email: '',
        industry: '',
        name: '',
        phone: '',
    });
    const [editingContactIndex, setEditingContactIndex] = useState<
        number | null
    >(null);

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
                const buyerList = await fetchContacts(
                    selectedCompanyId,
                    'Buyer',
                );
                setBuyers(buyerList as Buyer[]);
            };
            loadBuyers();
        }
    }, [selectedCompanyId]);

    const handleSelectBuyer = (buyerId: string) => {
        if (buyerId === 'new') {
            setBuyerData({
                contacts: [],
                email: '',
                industry: '',
                name: '',
                phone: '',
            });
            setSelectedBuyerId('new');
            setIsNewBuyer(true);
        } else {
            const selectedBuyer = buyers.find(buyer => buyer.id === buyerId);
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
            {
                name: contactName,
                phone: contactPhone,
                email: contactEmail,
                role: contactRole,
            },
            editingContactIndex,
        );

        setBuyerData({...buyerData, contacts: updatedContacts});
        setEditingContactIndex(null);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactRole('');
    };

    const handleContactDelete = (index: number) => {
        const updatedContacts = handleDeleteContact(buyerData.contacts, index);
        setBuyerData({...buyerData, contacts: updatedContacts});
    };

    const handleSubmit = async () => {
        if (!selectedCompanyId) {
            alert('Please select a company');
            return;
        }

        try {
            await checkForDuplicate(
                selectedCompanyId,
                buyerData,
                'Buyer',
                selectedBuyerId,
            );

            if (isNewBuyer) {
                const buyersCollectionRef = collection(
                    db,
                    `Company/${selectedCompanyId}/Buyers`,
                );
                await addDoc(buyersCollectionRef, buyerData);
                alert('Buyer added successfully!');
            } else {
                const buyerDocRef = doc(
                    db,
                    `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`,
                );
                await updateDoc(buyerDocRef, buyerData);
                alert('Buyer updated successfully!');
            }

            setBuyerData({
                contacts: [],
                email: '',
                industry: '',
                name: '',
                phone: '',
            });
            setSelectedBuyerId('new');
            setIsNewBuyer(true);
            setBuyers(
                (await fetchContacts(selectedCompanyId, 'Buyer')) as Buyer[],
            );
        } catch (error) {
            console.error('Error:', error);
            alert(error);
        }
    };

    const handleDeleteBuyer = async () => {
        if (!selectedBuyerId) return;
        try {
            const buyerDocRef = doc(
                db,
                `Company/${selectedCompanyId}/Buyers/${selectedBuyerId}`,
            );
            await deleteDoc(buyerDocRef);
            alert('Buyer deleted successfully!');
            setBuyerData({
                contacts: [],
                email: '',
                industry: '',
                name: '',
                phone: '',
            });
            setIsNewBuyer(true);
            setSelectedBuyerId('');
        } catch (error) {
            console.error('Error deleting buyer:', error);
            alert('Error deleting buyer');
        }
    };

    // Handling edit button to populate the form with contact data
    useEffect(() => {
        if (editingContactIndex !== null && editingContactIndex >= 0) {
            const contactToEdit = buyerData.contacts[editingContactIndex];
            setContactName(contactToEdit.name);
            setContactPhone(contactToEdit.phone);
            setContactEmail(contactToEdit.email);
            setContactRole(contactToEdit.role);
        }
    }, [editingContactIndex, buyerData.contacts]);

    type ContactRowProps = {
        contact: Buyer['contacts'][0]; // Assuming contacts are part of the Buyer type
        index: number;
        onEdit: (index: number) => void;
        onDelete: (index: number) => void;
    };

    const ContactRow: React.FC<ContactRowProps> = ({
        contact,
        index,
        onEdit,
        onDelete,
    }) => {
        const menuItems = [
            {
                icon: <FaEdit />,
                label: 'Edit',
                action: () => onEdit(index),
            },
            {
                icon: <FaTrashAlt />,
                label: 'Delete',
                action: () => onDelete(index),
            },
        ];

        return (
            <tr className={styles.contactRow}>
                <td className={styles.name}>{contact.name}</td>
                <td>{contact.role}</td>
                <td>{contact.phone}</td>
                <td>{contact.email}</td>
                <td className={styles.action}>
                    <DropdownMenu iconColor="#333333" menuItems={menuItems} />
                </td>
            </tr>
        );
    };

    return (
        <div>
            <Header
                department={isNewBuyer ? 'Add Buyer' : 'Edit Buyer'}
                isProfile={false}
            />
            <div className={styles.pageContainer}>
                {/* Company selection dropdown */}
                <div className={styles.selectGroup}>
                    <label>Select Company</label>
                    <select
                        value={selectedCompanyId}
                        onChange={e => setSelectedCompanyId(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Select a Company</option>
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Only show this section if a company is selected */}
                {selectedCompanyId && (
                    <>
                        <div className={styles.selectGroup}>
                            <label>Select Buyer:</label>
                            <select
                                value={selectedBuyerId}
                                onChange={e =>
                                    handleSelectBuyer(e.target.value)
                                }
                                className={styles.select}
                            >
                                <option value="new">New Buyer</option>
                                {buyers.map(buyer => (
                                    <option key={buyer.id} value={buyer.id}>
                                        {buyer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Buyer Form Fields */}
                        {(isNewBuyer || selectedBuyerId) && (
                            <div className={styles.inputGroup}>
                                <div>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        value={buyerData.name}
                                        onChange={e =>
                                            setBuyerData({
                                                ...buyerData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Buyer Name"
                                    />
                                </div>
                                <div>
                                    <input
                                        className={styles.input}
                                        type="tel"
                                        value={buyerData.phone}
                                        onChange={e =>
                                            setBuyerData({
                                                ...buyerData,
                                                phone: e.target.value,
                                            })
                                        }
                                        placeholder="Phone"
                                    />
                                </div>
                                <div>
                                    <input
                                        className={styles.input}
                                        type="email"
                                        value={buyerData.email}
                                        onChange={e =>
                                            setBuyerData({
                                                ...buyerData,
                                                email: e.target.value,
                                            })
                                        }
                                        placeholder="Email"
                                    />
                                </div>
                                <div>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        value={buyerData.industry}
                                        onChange={e =>
                                            setBuyerData({
                                                ...buyerData,
                                                industry: e.target.value,
                                            })
                                        }
                                        placeholder="Industry"
                                    />
                                </div>

                                {/* Contact Management */}
                                <h3>Contacts</h3>
                                <table className={styles.contactTable}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Phone</th>
                                            <th>Email</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {buyerData.contacts.map(
                                            (contact, index) => (
                                                <ContactRow
                                                    key={index}
                                                    contact={contact}
                                                    index={index}
                                                    onEdit={
                                                        setEditingContactIndex
                                                    }
                                                    onDelete={
                                                        handleContactDelete
                                                    }
                                                />
                                            ),
                                        )}
                                    </tbody>
                                </table>

                                {/* Contact Form Fields */}
                                <div className={styles.inputGroup}>
                                    <div>
                                        <input
                                            className={styles.input}
                                            value={contactName}
                                            onChange={e =>
                                                setContactName(e.target.value)
                                            }
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className={styles.input}
                                            value={contactPhone}
                                            onChange={e =>
                                                setContactPhone(e.target.value)
                                            }
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className={styles.input}
                                            value={contactEmail}
                                            onChange={e =>
                                                setContactEmail(e.target.value)
                                            }
                                            placeholder="Email"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className={styles.input}
                                            value={contactRole}
                                            onChange={e =>
                                                setContactRole(e.target.value)
                                            }
                                            placeholder="Role"
                                        />
                                    </div>

                                    <button
                                        className={styles.contactButton}
                                        onClick={handleContactAddOrEdit}
                                    >
                                        {editingContactIndex !== null
                                            ? 'Update Contact'
                                            : 'Add Contact'}
                                    </button>
                                </div>

                                {/* Submit Buttons */}
                                <div className={styles.actionButtons}>
                                    <button
                                        className={styles.save}
                                        onClick={handleSubmit}
                                    >
                                        {isNewBuyer
                                            ? 'Add Buyer'
                                            : 'Update Buyer'}
                                    </button>
                                    {!isNewBuyer && (
                                        <button
                                            className={styles.delete}
                                            onClick={handleDeleteBuyer}
                                        >
                                            Delete Buyer
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AddOrEditBuyer;
