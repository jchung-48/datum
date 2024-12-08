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
import {Manufacturer, Company} from '../../types';
import styles from '../crudContacts.module.css';
import Header from '@/app/Utilities/Header/header';
import DropdownMenu from '@/app/Utilities/DropDownMenu/dropdownMenu';
import {FaEdit, FaTrashAlt} from 'react-icons/fa';

const AddOrEditManufacturer = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
    const [isNewManufacturer, setIsNewManufacturer] = useState(false);
    const [manufacturerData, setManufacturerData] = useState<Manufacturer>({
        contacts: [],
        catalog: [],
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
            const loadManufacturers = async () => {
                const manufacturerList = await fetchContacts(
                    selectedCompanyId,
                    'Manufacturer',
                );
                setManufacturers(manufacturerList as Manufacturer[]);
            };
            loadManufacturers();
        }
    }, [selectedCompanyId]);

    const handleSelectManufacturer = (manufacturerId: string) => {
        if (manufacturerId === 'new') {
            setManufacturerData({
                contacts: [],
                catalog: [],
                email: '',
                industry: '',
                name: '',
                phone: '',
            });
            setSelectedManufacturerId('new');
            setIsNewManufacturer(true);
        } else {
            const selectedManufacturer = manufacturers.find(
                manufacturer => manufacturer.id === manufacturerId,
            );
            if (selectedManufacturer) {
                setManufacturerData(selectedManufacturer);
                setSelectedManufacturerId(manufacturerId);
                setIsNewManufacturer(false);
            }
        }
    };

    const handleEditContact = (index: number) => {
        const contact = manufacturerData.contacts[index];
        setContactName(contact.name);
        setContactPhone(contact.phone);
        setContactEmail(contact.email);
        setContactRole(contact.role);
        setEditingContactIndex(index);
    };

    const handleContactAddOrEdit = () => {
        const updatedContacts = handleAddOrEditContact(
            manufacturerData.contacts,
            {
                name: contactName,
                phone: contactPhone,
                email: contactEmail,
                role: contactRole,
            },
            editingContactIndex,
        );

        setManufacturerData({...manufacturerData, contacts: updatedContacts});
        setEditingContactIndex(null);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactRole('');
    };

    const handleContactDelete = (index: number) => {
        const updatedContacts = handleDeleteContact(
            manufacturerData.contacts,
            index,
        );
        setManufacturerData({...manufacturerData, contacts: updatedContacts});
    };

    const handleSubmit = async () => {
        if (!selectedCompanyId) {
            alert('Please select a company');
            return;
        }

        try {
            await checkForDuplicate(
                selectedCompanyId,
                manufacturerData,
                'Manufacturer',
                selectedManufacturerId,
            );

            if (isNewManufacturer) {
                const manufacturersCollectionRef = collection(
                    db,
                    `Company/${selectedCompanyId}/Manufacturers`,
                );
                await addDoc(manufacturersCollectionRef, manufacturerData);
                alert('Manufacturer added successfully!');
            } else {
                const manufacturerDocRef = doc(
                    db,
                    `Company/${selectedCompanyId}/Manufacturers/${selectedManufacturerId}`,
                );
                await updateDoc(manufacturerDocRef, manufacturerData);
                alert('Manufacturer updated successfully!');
            }

            setManufacturerData({
                contacts: [],
                catalog: [],
                email: '',
                industry: '',
                name: '',
                phone: '',
            });
            setSelectedManufacturerId('new');
            setIsNewManufacturer(true);
            setManufacturers(
                (await fetchContacts(
                    selectedCompanyId,
                    'Manufacturer',
                )) as Manufacturer[],
            );
        } catch (error) {
            console.error('Error:', error);
            alert(error);
        }
    };

    const handleDeleteManufacturer = async () => {
        if (!selectedManufacturerId) return;
        try {
            const manufacturerDocRef = doc(
                db,
                `Company/${selectedCompanyId}/Manufacturers/${selectedManufacturerId}`,
            );
            await deleteDoc(manufacturerDocRef);
            alert('Manufacturer deleted successfully!');
            setManufacturerData({
                contacts: [],
                catalog: [],
                email: '',
                industry: '',
                name: '',
                phone: '',
            });
            setIsNewManufacturer(true);
            setSelectedManufacturerId('');
        } catch (error) {
            console.error('Error deleting manufacturer:', error);
            alert('Error deleting manufacturer');
        }
    };

    type ContactRowProps = {
        contact: Manufacturer['contacts'][0];
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
                department={
                    isNewManufacturer ? 'Add Manufacturer' : 'Edit Manufacturer'
                }
                isProfile={false}
            />
            <div className={styles.pageContainer}>
                <div className={styles.selectGroup}>
                    <label className={styles.selectLabel}>
                        Select Company:
                    </label>
                    <select
                        className={styles.select}
                        value={selectedCompanyId}
                        onChange={e => setSelectedCompanyId(e.target.value)}
                    >
                        <option value="">Select a company</option>
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedCompanyId && (
                    <div className={styles.selectGroup}>
                        <label className={styles.selectLabel}>
                            Select Manufacturer:
                        </label>
                        <select
                            className={styles.select}
                            value={selectedManufacturerId}
                            onChange={e =>
                                handleSelectManufacturer(e.target.value)
                            }
                        >
                            <option value="new">New Manufacturer</option>
                            {manufacturers.map(manufacturer => (
                                <option
                                    key={manufacturer.id}
                                    value={manufacturer.id}
                                >
                                    {manufacturer.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {(isNewManufacturer || selectedManufacturerId) && (
                    <>
                        <div className={styles.inputGroup}>
                            <div>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={manufacturerData.name}
                                    onChange={e =>
                                        setManufacturerData({
                                            ...manufacturerData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Manufacturer Name"
                                />
                            </div>
                            <div>
                                <input
                                    className={styles.input}
                                    type="tel"
                                    value={manufacturerData.phone}
                                    onChange={e =>
                                        setManufacturerData({
                                            ...manufacturerData,
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
                                    value={manufacturerData.email}
                                    onChange={e =>
                                        setManufacturerData({
                                            ...manufacturerData,
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
                                    value={manufacturerData.industry}
                                    onChange={e =>
                                        setManufacturerData({
                                            ...manufacturerData,
                                            industry: e.target.value,
                                        })
                                    }
                                    placeholder="Industry"
                                />
                            </div>
                        </div>

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
                                {manufacturerData.contacts.map(
                                    (contact, index) => (
                                        <ContactRow
                                            key={index}
                                            contact={contact}
                                            index={index}
                                            onEdit={handleEditContact}
                                            onDelete={handleContactDelete}
                                        />
                                    ),
                                )}
                            </tbody>
                        </table>

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

                        <div className={styles.actionButtons}>
                            <button
                                className={styles.save}
                                onClick={handleSubmit}
                            >
                                {isNewManufacturer
                                    ? 'Add Manufacturer'
                                    : 'Update Manufacturer'}
                            </button>
                            {!isNewManufacturer && (
                                <button
                                    className={styles.delete}
                                    onClick={handleDeleteManufacturer}
                                >
                                    Delete Manufacturer
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddOrEditManufacturer;
