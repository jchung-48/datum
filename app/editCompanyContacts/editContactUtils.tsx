import {collection, getDocs} from 'firebase/firestore';
import {db} from '@/lib/firebaseClient';
import {Company, Contact, Manufacturer, Buyer} from '@/app/types';

type EntityType = 'Manufacturer' | 'Buyer';

/**
 * fetchCompanies
 * 
 * @returns {Promise<Company[]>} - A promise that resolves to an array of company objects.
 * 
 * Fetches a list of companies from Firestore and returns their ID and name.
 */
export const fetchCompanies = async (): Promise<Company[]> => {
    const companiesCollectionRef = collection(db, 'Company');
    const companySnapshot = await getDocs(companiesCollectionRef);
    return companySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
    }));
};

/**
 * fetchContacts
 * 
 * @param {string} companyId - The ID of the company for which contacts are fetched.
 * @param {EntityType} type - The type of entity to fetch, either 'Buyer' or 'Manufacturer'.
 * @returns {Promise<(Buyer | Manufacturer)[]>} - A promise that resolves to an array of Buyer or Manufacturer objects.
 * 
 * Fetches a list of contacts (either Buyers or Manufacturers) for a given company.
 */
export const fetchContacts = async (
    companyId: string,
    type: EntityType,
): Promise<(Buyer | Manufacturer)[]> => {
    const collectionPath =
        type === 'Buyer'
            ? `Company/${companyId}/Buyers`
            : `Company/${companyId}/Manufacturers`;
    const contactsCollectionRef = collection(db, collectionPath);
    const contactsSnapshot = await getDocs(contactsCollectionRef);
    return contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as (Buyer | Manufacturer)[];
};

export const checkForDuplicate = async (
    companyId: string,
    data: Buyer | Manufacturer,
    type: EntityType,
    selectedId?: string,
) => {
    const collectionPath =
        type === 'Buyer'
            ? `Company/${companyId}/Buyers`
            : `Company/${companyId}/Manufacturers`;
    const contactsCollectionRef = collection(db, collectionPath);
    const contactsSnapshot = await getDocs(contactsCollectionRef);
    const contactList = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as (Buyer | Manufacturer)[];

    const nameExists = contactList.some(
        contact => contact.name === data.name && contact.id !== selectedId,
    );
    const emailExists = contactList.some(
        contact => contact.email === data.email && contact.id !== selectedId,
    );
    const phoneExists = contactList.some(
        contact => contact.phone === data.phone && contact.id !== selectedId,
    );

    if (nameExists)
        throw new Error(`A ${type} with the same name already exists.`);
    if (emailExists)
        throw new Error(`A ${type} with the same email already exists.`);
    if (phoneExists)
        throw new Error(`A ${type} with the same phone number already exists.`);
};

/**
 * handleAddOrEditContact
 *
 * @param {string} companyId - The ID of the company where the contact exists.
 * @param {(Buyer | Manufacturer)} data - The Buyer or Manufacturer data to check for duplicates.
 * @param {EntityType} type - The type of contact, either 'Buyer' or 'Manufacturer'.
 * @param {string} [selectedId] - Optional ID of the contact being edited, to exclude from the check.
 * 
 * @returns {Promise<void>} - A promise that resolves when the check is complete, or throws an error if a duplicate is found.
 * 
 * Checks for duplicate Buyer or Manufacturer based on name, email, or phone in a given company.
 */
export const handleAddOrEditContact = (
    contacts: Contact[],
    contactData: Contact,
    editingIndex: number | null,
): Contact[] => {
    if (editingIndex !== null) {
        const updatedContacts = [...contacts];
        updatedContacts[editingIndex] = contactData;
        return updatedContacts;
    }
    return [...contacts, contactData];
};


/**
 * handleDeleteContact
 *
 * @param {Contact[]} contacts - The list of contacts.
 * @param {number} index - The index of the contact to be deleted.
 * 
 * @returns {Contact[]} - A new array of contacts with the contact at the specified index removed.
 * 
 * Deletes a contact from the list based on the given index.
 */
export const handleDeleteContact = (
    contacts: Contact[],
    index: number,
): Contact[] => {
    return contacts.filter((_, contactIndex) => contactIndex !== index);
};
