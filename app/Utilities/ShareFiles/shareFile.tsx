// shareFile.tsx
import React, { useState, useEffect } from 'react';
import { moveDocument } from '../Upload/uploadUtils';
import { fetchContacts } from '@/app/editCompanyContacts/editContactUtils';
import { Buyer, Manufacturer } from '@/app/types';
import { getDocs, collection } from 'firebase/firestore';
import { db, auth } from "@/lib/firebaseClient";
import styles from './shareFile.module.css';
import { MdClose } from 'react-icons/md';

type ShareFileModalProps = {
    companyId: string;
    documentId: string;
    departmentId: string;
    isOpen: boolean;
    onClose: () => void;
};

const ShareFileModal: React.FC<ShareFileModalProps> = ({
    companyId,
    documentId,
    departmentId,
    isOpen,
    onClose,
}) => {
    const [selectedCollectionType, setSelectedCollectionType] = useState<
        'Departments' | 'Buyers' | 'Manufacturers' | ''
    >('');
    const [destinationId, setDestinationId] = useState('');
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [isCopy, setIsCopy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                // Fetch departments, buyers, and manufacturers
                const departmentsList = await fetchDepartments(companyId);
                const buyersList = await fetchContacts(companyId, 'Buyer');
                const manufacturersList = await fetchContacts(companyId, 'Manufacturer');
                setDepartments(departmentsList);
                setBuyers(buyersList as Buyer[]);
                setManufacturers(manufacturersList as Manufacturer[]);
            };
            fetchData();
        }
    }, [isOpen, companyId]);

    const fetchDepartments = async (companyId: string) => {
        // Fetch department names and IDs
        const departmentsSnapshot = await getDocs(collection(db, 'Company', companyId, 'Departments'));
        return departmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name, // Adjust if the name field is named differently
        }));
    };
    

    const handleMoveOrCopy = async () => {
        if (!selectedCollectionType || !destinationId) {
            alert('Please select a destination');
            return;
        }

        try {
            await moveDocument(
                {
                    collectionType: 'Departments',
                    companyId,
                    departmentId,
                },
                {
                    collectionType: selectedCollectionType,
                    companyId,
                    [selectedCollectionType === 'Departments'
                        ? 'departmentId'
                        : selectedCollectionType === 'Buyers'
                            ? 'buyerId'
                            : 'manufacturerId']: destinationId,
                },
                documentId,
                isCopy,
            );
            alert(`File ${isCopy ? 'copied' : 'moved'} successfully!`);
            onClose();
        } catch (error) {
            console.error('Error moving/copying file:', error);
            alert('Failed to move/copy file.');
        }
    };

    return isOpen ? (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <MdClose />
                </button>
                <div className={styles.modalContent}>
                    <h2>Share File</h2>
                    <label>Choose Destination Type:</label>
                    <select
                        value={selectedCollectionType}
                        onChange={(e) =>
                            setSelectedCollectionType(e.target.value as 'Departments' | 'Buyers' | 'Manufacturers')
                        }
                    >
                        <option value="">Select</option>
                        <option value="Departments">Departments</option>
                        <option value="Buyers">Buyers</option>
                        <option value="Manufacturers">Manufacturers</option>
                    </select>

                    {selectedCollectionType && (
                        <>
                            <label>Select {selectedCollectionType}</label>
                            <select
                                value={destinationId}
                                onChange={(e) => setDestinationId(e.target.value)}
                            >
                                <option value="">Select</option>
                                {selectedCollectionType === 'Departments'
                                    ? departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))
                                    : selectedCollectionType === 'Buyers'
                                        ? buyers.map((buyer) => (
                                            <option key={buyer.id} value={buyer.id}>
                                                {buyer.name}
                                            </option>
                                        ))
                                        : manufacturers.map((manufacturer) => (
                                            <option key={manufacturer.id} value={manufacturer.id}>
                                                {manufacturer.name}
                                            </option>
                                        ))}
                            </select>
                        </>
                    )}

                    <label>
                        <input
                            type="checkbox"
                            checked={isCopy}
                            onChange={() => setIsCopy((prev) => !prev)}
                        />
                        Copy
                    </label>

                    <button className={`${styles.modal} ${styles.shareButton}`} onClick={handleMoveOrCopy}>
                        {isCopy ? 'Copy' : 'Move'} File
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default ShareFileModal;
