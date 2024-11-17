import React, { useState, useEffect } from 'react';
import { moveDocument } from '../Upload/uploadUtils';
import { fetchContacts } from '@/app/editCompanyContacts/editContactUtils';
import { Buyer, Manufacturer } from '@/app/types';
import { getDocs, collection } from 'firebase/firestore';
import { db } from "@/lib/firebaseClient";
import styles from './shareFile.module.css';
import { MdClose } from 'react-icons/md';
import { departmentCollectionsMap } from '../departmentCollectionsMap';

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
    const [collections, setCollections] = useState<string[]>([]);
    const [selectedCollectionName, setSelectedCollectionName] = useState('');
    const [isCopy, setIsCopy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
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
        const departmentsSnapshot = await getDocs(collection(db, 'Company', companyId, 'Departments'));
        return departmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
        }));
    };

    const fetchCollections = (departmentId: string): string[] => {
        return departmentCollectionsMap[departmentId] || []; // Return an empty array if no collections are defined
    };     

    useEffect(() => {
        if (selectedCollectionType === 'Departments' && destinationId) {
            const availableCollections = fetchCollections(destinationId);
            setCollections(availableCollections);
        } else {
            setCollections([]);
        }
    }, [selectedCollectionType, destinationId]);    

    const handleMoveOrCopy = async () => {
        if (!selectedCollectionType || !destinationId || (selectedCollectionType === 'Departments' && !selectedCollectionName)) {
            alert('Please select a destination and collection.');
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
                    departmentId: selectedCollectionType === 'Departments' ? destinationId : undefined,
                    buyerId: selectedCollectionType === 'Buyers' ? destinationId : undefined,
                    manufacturerId: selectedCollectionType === 'Manufacturers' ? destinationId : undefined,
                    collectionName: selectedCollectionType === 'Departments' ? selectedCollectionName : undefined,
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

                    {selectedCollectionType === 'Departments' && collections.length > 0 && (
                        <>
                            <label>Select Collection</label>
                            <select
                                value={selectedCollectionName}
                                onChange={(e) => setSelectedCollectionName(e.target.value)}
                            >
                                <option value="">Select</option>
                                {collections.map((collectionName) => (
                                    <option key={collectionName} value={collectionName}>
                                        {collectionName}
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