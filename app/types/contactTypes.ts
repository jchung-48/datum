export type Contact = {
    name: string;
    phone: string;
    email: string;
    role: string;
};

export type CatalogItem = {
    productName: string;
    productCode: string;
};

export type Manufacturer = {
    id?: string; // Firestore document ID, optional for new manufacturers
    contacts: Contact[];
    catalog: CatalogItem[];
    email: string;
    industry: string;
    name: string;
    phone: string;
};

export type Buyer = {
    id?: string; // Firestore document ID, optional for new buyers
    contacts: Contact[];
    email: string;
    industry: string;
    name: string;
    phone: string;
  };