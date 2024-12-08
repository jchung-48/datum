import {collection, getDocs} from 'firebase/firestore';
import {db} from '@/lib/firebaseClient';
import {Company, Contact, Manufacturer, Buyer} from '@/app/types';

type EntityType = 'Manufacturer' | 'Buyer';

export const fetchCompanies = async (): Promise<Company[]> => {
    const companiesCollectionRef = collection(db, 'Company');
    const companySnapshot = await getDocs(companiesCollectionRef);
    return companySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
    }));
};

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

export const handleDeleteContact = (
    contacts: Contact[],
    index: number,
): Contact[] => {
    return contacts.filter((_, contactIndex) => contactIndex !== index);
};
