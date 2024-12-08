'use client';

import React, {useState, useEffect} from 'react';
import merchStyles from './merch.module.css';
import deptStyles from '../departments.module.css';
import {FileList} from '../../Utilities/ListFiles/listFiles';
import {MdClose} from 'react-icons/md';
import {fetchContacts} from '../../editCompanyContacts/editContactUtils';
import {Buyer, Manufacturer} from '../../types';
import UploadComponent from '../../Utilities/Upload/uploadComponent';
import AIButton from '../../aiAddon/aiButton';
import SearchBar from '../../Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';
import {doc, getDoc, DocumentReference} from 'firebase/firestore';
import {auth, db} from '@/lib/firebaseClient';

const MerchandisingDepartment = () => {
    const styles = {...deptStyles, ...merchStyles};
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'ti7yNByDOzarVXoujOog';
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [fileListUpdated, setFileListUpdated] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [selectedContactFilesPath, setSelectedContactFilesPath] = useState<
        string[]
    >([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const loadBuyersAndManufacturers = async () => {
            try {
                const buyersList = await fetchContacts(COMPANYID, 'Buyer');
                const manufacturersList = await fetchContacts(
                    COMPANYID,
                    'Manufacturer',
                );
                setBuyers(buyersList as Buyer[]);
                setManufacturers(manufacturersList as Manufacturer[]);
            } catch (error) {
                console.error('Error fetching contacts:', error);
            }
        };

        loadBuyersAndManufacturers();
    }, []);

    const deptFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'files',
    ] as [string, ...string[]];

    const deptRecordsPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'records',
    ] as [string, ...string[]];

    const updateLists = () => {
        setFileListUpdated(prev => !prev);
    }

    const handleCardClick = (
        type: 'Buyer' | 'Manufacturer',
        id: string,
        name: string,
    ) => {
        setSelectedContactFilesPath([
            'Company',
            COMPANYID,
            type === 'Buyer' ? 'Buyers' : 'Manufacturers',
            id,
            type === 'Buyer' ? 'Quotes' : 'Products',
        ]);
        setModalTitle(`${name} - ${type} Files`);
        setShowModal(true);
    };

    const checkAdminStatus = async (uid: string) => {
        try {
            const companyDocRef = doc(db, 'Company', COMPANYID);
            const companyDocSnapshot = await getDoc(companyDocRef);

            if (companyDocSnapshot.exists()) {
                const adminRefs: DocumentReference[] =
                    companyDocSnapshot.data().admins;

                if (Array.isArray(adminRefs)) {
                    const adminIds = await Promise.all(
                        adminRefs.map(async ref => {
                            const adminDoc = await getDoc(ref);
                            return adminDoc.id;
                        }),
                    );

                    setIsAdmin(adminIds.includes(uid));
                } else {
                    console.warn('Admins field is not an array.');
                    setIsAdmin(false);
                }
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                checkAdminStatus(user.uid);
            } else {
                setIsAdmin(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="Page">
            <Header department="Merchandising" isProfile={false} />

            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="Merchandising"
                        collections={['files']}
                        onUploadSuccess={updateLists}
                    />
                    <div className={styles.search}>
                        <SearchBar paths={['ti7yNByDOzarVXoujOog']} />
                    </div>
                </div>

                <div className={styles.files}>
                    <FileTitle title="Department Files" />
                    <FileList
                        collectionPath={deptFilesPath}
                        title=""
                        initialDisplay="grid"
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                    <FileTitle title="Records" />
                    <FileList
                        collectionPath={deptRecordsPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                </div>

                <div className={styles.contactListsContainer}>
                    <div className={styles.contactList}>
                        <div className={styles.contactListHeader}>
                            <h2>Buyers</h2>
                            {isAdmin && (
                                <button
                                    className={styles.adminButton}
                                    onClick={() => {
                                        window.location.href =
                                            '/editCompanyContacts/crudBuyer'; 
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        {buyers.map(buyer =>
                            buyer.id ? (
                                <div
                                    key={buyer.id}
                                    className={styles.contactCard}
                                    onClick={() =>
                                        handleCardClick(
                                            'Buyer',
                                            buyer.id ? buyer.id : '',
                                            buyer.name,
                                        )
                                    }
                                >
                                    <div className={styles.contactName}>
                                        {buyer.name}
                                    </div>
                                    <div className={styles.contactDetails}>
                                        {buyer.email}
                                    </div>
                                    <div className={styles.contactDetails}>
                                        {buyer.phone}
                                    </div>
                                </div>
                            ) : null,
                        )}
                    </div>

                    <div className={styles.contactList}>
                        <div className={styles.contactListHeader}>
                            <h2>Manufacturers</h2>
                            {isAdmin && (
                                <button
                                    className={styles.adminButton}
                                    onClick={() => {
                                        window.location.href =
                                            '/editCompanyContacts/crudManufacturer';
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        {manufacturers.map(manufacturer =>
                            manufacturer.id ? (
                                <div
                                    key={manufacturer.id}
                                    className={styles.contactCard}
                                    onClick={() =>
                                        handleCardClick(
                                            'Manufacturer',
                                            manufacturer.id
                                                ? manufacturer.id
                                                : '',
                                            manufacturer.name,
                                        )
                                    }
                                >
                                    <div className={styles.contactName}>
                                        {manufacturer.name}
                                    </div>
                                    <div className={styles.contactDetails}>
                                        {manufacturer.email}
                                    </div>
                                    <div className={styles.contactDetails}>
                                        {manufacturer.phone}
                                    </div>
                                </div>
                            ) : null,
                        )}
                    </div>
                </div>

                {showModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowModal(false)}
                            >
                                <MdClose />
                            </button>
                            <FileList
                                collectionPath={
                                    selectedContactFilesPath as [
                                        string,
                                        ...string[],
                                    ]
                                }
                                title={modalTitle}
                                initialDisplay="grid"
                            />
                        </div>
                    </div>
                )}
                <AIButton paths={['ti7yNByDOzarVXoujOog']} />
            </div>
        </div>
    );
};

export default MerchandisingDepartment;
