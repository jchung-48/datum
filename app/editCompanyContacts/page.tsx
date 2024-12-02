// Example in index.tsx or layout.tsx
import Link from 'next/link';
import React from 'react';

export default function Home() {
    return (
        <div>
            <h1>Add or Edit Company Contacts</h1>

            <ul>
                <li>
                    {/* Link to the route, not the file */}
                    <Link href="/editCompanyContacts/crudBuyer">
                        <button style={{marginBottom: '20px'}}>
                            Add/Edit Buyers
                        </button>
                    </Link>
                </li>
                <li>
                    <Link href="/editCompanyContacts/crudManufacturer">
                        <button style={{marginBottom: '20px'}}>
                            Add/Edit Manufacturers
                        </button>
                    </Link>
                </li>
            </ul>
        </div>
    );
}
