import React, {useState, useEffect} from 'react';
import {moveDocument} from '../Upload/uploadUtils';
import {fetchContacts} from '@/app/editCompanyContacts/editContactUtils';
import {Buyer, Manufacturer, FileData, FirestorePath} from '@/app/types';
import {getDocs, collection} from 'firebase/firestore';
import {db} from '@/lib/firebaseClient';
import styles from './shareFile.module.css';
import {MdClose} from 'react-icons/md';
import {departmentCollectionsMap} from '../departmentCollectionsMap';

type ShareFileModalProps = {
    source: FirestorePath;
    filesToShare: FileData[];
    isOpen: boolean;
    onClose: () => void;
    buttonRef: React.RefObject<HTMLButtonElement>;
    onOperationComplete?: () => void;
};

const ShareFileModal: React.FC<ShareFileModalProps> = ({
    source,
    filesToShare = [],
    isOpen,
    onClose,
    buttonRef,
    onOperationComplete,
}) => {
    const [selectedCollectionType, setSelectedCollectionType] = useState<
        'Departments' | 'Buyers' | 'Manufacturers' | ''
    >('');
    const [destinationId, setDestinationId] = useState('');
    const [departments, setDepartments] = useState<
        {id: string; name: string}[]
    >([]);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [collections, setCollections] = useState<string[]>([]);
    const [selectedCollectionName, setSelectedCollectionName] = useState('');
    const [isCopy, setIsCopy] = useState(false);
    const [modalPosition, setModalPosition] = useState<{
        top: number;
        left: number;
    }>({top: 0, left: 0});

    useEffect(() => {
        /**
         * updateModalPosition
         * 
         * @param {void} None
         * @returns {void} - Does not return a value. Updates the modal position based on the button 
         * position and its parent elements' scroll offsets.
         * 
         * Calculates the position of the modal relative to the button and updates the state with the 
         * new modal position, accounting for scrolling within parent elements.
         */
        const updateModalPosition = () => {
            if (isOpen && buttonRef.current) {
                let buttonRect = buttonRef.current.getBoundingClientRect();
                let parentScrollTop = 0;
                let parentScrollLeft = 0;

                let parentElement = buttonRef.current.parentElement;
                while (parentElement) {
                    parentScrollTop += parentElement.scrollTop || 0;
                    parentScrollLeft += parentElement.scrollLeft || 0;
                    parentElement = parentElement.parentElement;
                }

                setModalPosition({
                    top:
                        buttonRect.bottom +
                        window.scrollY -
                        parentScrollTop +
                        10,
                    left: buttonRect.left + window.scrollX - parentScrollLeft,
                });
            }
        };

        if (isOpen) {
            updateModalPosition();
            window.addEventListener('scroll', updateModalPosition);
            window.addEventListener('resize', updateModalPosition);
        }

        return () => {
            window.removeEventListener('scroll', updateModalPosition);
            window.removeEventListener('resize', updateModalPosition);
        };
    }, [isOpen, buttonRef]);

    useEffect(() => {
        if (isOpen) {
            /**
             * fetchData
             * 
             * @param {void} None
             * @returns {void} - Does not return a value. Fetches data for departments, buyers, and manufacturers 
             * and updates the corresponding state variables.
             * 
             * Fetches lists of departments, buyers, and manufacturers for a given company and updates the 
             * relevant state variables with the fetched data.
             */
            const fetchData = async () => {
                const departmentsList = await fetchDepartments(
                    source.companyId,
                );
                const buyersList = await fetchContacts(
                    source.companyId,
                    'Buyer',
                );
                const manufacturersList = await fetchContacts(
                    source.companyId,
                    'Manufacturer',
                );
                setDepartments(departmentsList);
                setBuyers(buyersList as Buyer[]);
                setManufacturers(manufacturersList as Manufacturer[]);
            };
            fetchData();
        }
    }, [isOpen, source.companyId]);

    /**
     * fetchDepartments
     * 
     * @param {string} companyId - The ID of the company for which to fetch the departments.
     * @returns {Promise<{id: string, name: string}[]>} - A promise that resolves to an array of department objects, 
     * each containing an 'id' and 'name' property.
     * 
     * Fetches the list of departments for a given company from Firestore and returns an array of 
     * department objects.
     */
    const fetchDepartments = async (companyId: string) => {
        const departmentsSnapshot = await getDocs(
            collection(db, 'Company', companyId, 'Departments'),
        );
        return departmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
        }));
    };

    const fetchCollections = (departmentId: string): string[] => {
        return departmentCollectionsMap[departmentId] || [];
    };

    useEffect(() => {
        if (selectedCollectionType === 'Departments' && destinationId) {
            const availableCollections = fetchCollections(destinationId);
            setCollections(availableCollections);
        } else {
            setCollections([]);
        }
    }, [selectedCollectionType, destinationId]);

    /**
     * handleMoveOrCopy
     * 
     * @param {void} None
     * @returns {void} - Does not return a value. Moves or copies selected files to the specified 
     * destination collection and provides feedback on the operation's success or failure.
     * 
     * Validates the selection of destination and collection, performs the move or copy operation 
     * for each file, and alerts the user upon completion. Handles errors for any failed files.
     */
    const handleMoveOrCopy = async () => {
        if (
            !selectedCollectionType ||
            !destinationId ||
            (selectedCollectionType === 'Departments' &&
                !selectedCollectionName)
        ) {
            alert('Please select a destination and collection.');
            return;
        }

        try {
            let destCollection: FirestorePath = {
                collectionType: selectedCollectionType,
                companyId: source.companyId,
                departmentId:
                    selectedCollectionType === 'Departments'
                        ? destinationId
                        : undefined,
                buyerId:
                    selectedCollectionType === 'Buyers'
                        ? destinationId
                        : undefined,
                manufacturerId:
                    selectedCollectionType === 'Manufacturers'
                        ? destinationId
                        : undefined,
                collectionName:
                    selectedCollectionType === 'Departments'
                        ? selectedCollectionName
                        : undefined,
            };
            let errored_files = 0;
            for (const file of filesToShare) {
                try {
                    await moveDocument(source, destCollection, file.id, isCopy);
                } catch (error) {
                    errored_files += 1;
                }
            }

            if (onOperationComplete) {
                onOperationComplete();
            }

            if (errored_files == 0) {
                alert(`Files ${isCopy ? 'copied' : 'moved'} successfully!`);
            } else {
                throw new Error('Failed to move/copy one or more files.');
            }
            onClose();
        } catch (error) {
            console.error('Error moving/copying files:', error);
            if (
                error ==
                'Error: Copying to directory in the same department not permitted.'
            ) {
                alert(
                    'Copying to directory in the same department not permitted.',
                );
            } else {
                alert('Failed to move/copy one or more files.');
            }
            onClose();
        }
    };

    return isOpen ? (
        <div className={styles.modalOverlay}>
            <div
                className={styles.modal}
                style={{
                    top: `${modalPosition.top}px`,
                    left: `${modalPosition.left}px`,
                    position: 'absolute',
                }}
            >
                <button className={styles.closeButton} onClick={onClose}>
                    <MdClose />
                </button>
                <div className={styles.modalContent}>
                    <h2>Share Files</h2>
                    <p>
                        {filesToShare.length} file
                        {filesToShare.length > 1 ? 's' : ''} selected for
                        sharing.
                    </p>
                    <label>Choose Destination Type:</label>
                    <select
                        value={selectedCollectionType}
                        onChange={e =>
                            setSelectedCollectionType(
                                e.target.value as
                                    | 'Departments'
                                    | 'Buyers'
                                    | 'Manufacturers',
                            )
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
                                onChange={e => setDestinationId(e.target.value)}
                            >
                                <option value="">Select</option>
                                {selectedCollectionType === 'Departments'
                                    ? departments.map(dept => (
                                          <option key={dept.id} value={dept.id}>
                                              {dept.name}
                                          </option>
                                      ))
                                    : selectedCollectionType === 'Buyers'
                                      ? buyers.map(buyer => (
                                            <option
                                                key={buyer.id}
                                                value={buyer.id}
                                            >
                                                {buyer.name}
                                            </option>
                                        ))
                                      : manufacturers.map(manufacturer => (
                                            <option
                                                key={manufacturer.id}
                                                value={manufacturer.id}
                                            >
                                                {manufacturer.name}
                                            </option>
                                        ))}
                            </select>
                        </>
                    )}

                    {selectedCollectionType === 'Departments' &&
                        collections.length > 0 && (
                            <>
                                <label>Select Collection</label>
                                <select
                                    value={selectedCollectionName}
                                    onChange={e =>
                                        setSelectedCollectionName(
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select</option>
                                    {collections.map(collectionName => (
                                        <option
                                            key={collectionName}
                                            value={collectionName}
                                        >
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
                            onChange={() => setIsCopy(prev => !prev)}
                        />
                        Copy
                    </label>

                    <button
                        className={`${styles.modal} ${styles.shareButton}`}
                        onClick={handleMoveOrCopy}
                    >
                        {isCopy ? 'Copy' : 'Move'} Files
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default ShareFileModal;
