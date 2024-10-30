export type Company = {
    address?:string;
    admin?: string;
    id: string; // The Firestore document ID for the company
    name: string; // The name field from the company document
    email?: string;
    office_id?: string;
    phone_number?: number;
    website?: string;
};
  