import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';
import {auth, db} from '@/lib/firebaseClient';
import {useRouter} from 'next/navigation';
import {doc, getDoc} from 'firebase/firestore';

// Mock Firebase and Next.js dependencies
jest.mock('@/lib/firebaseClient', () => ({
    auth: {
        onAuthStateChanged: jest.fn(),
    },
    db: {},
}));
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
}));

describe('Home Page', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    });

    test('redirects authenticated user to department URL', async () => {
        // Mock Firebase auth to return a user
        const mockUser = {
            getIdTokenResult: jest
                .fn()
                .mockResolvedValue({claims: {companyId: 'company123'}}),
        };
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(mockUser),
        );

        // Mock Firestore document calls
        const mockDepartmentRef = {id: 'dep123'};
        const mockEmployeeSnap = {
            exists: () => true,
            get: () => [mockDepartmentRef],
        };
        const mockDepSnap = {exists: () => true, get: () => 'department-url'};
        (getDoc as jest.Mock)
            .mockResolvedValueOnce(mockEmployeeSnap) // First call for Employee document
            .mockResolvedValueOnce(mockDepSnap); // Second call for Department document

        render(<Home />);
        await waitFor(() =>
            expect(mockPush).toHaveBeenCalledWith('/department-url'),
        );
    });

    test('does not redirect authenticated user if department URL is missing', async () => {
        const mockUser = {
            getIdTokenResult: jest
                .fn()
                .mockResolvedValue({claims: {companyId: 'company123'}}),
        };
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(mockUser),
        );

        // Mock Firestore document calls
        const mockEmployeeSnap = {exists: () => true, get: () => [{}]}; // No department URL found
        (getDoc as jest.Mock).mockResolvedValueOnce(mockEmployeeSnap);

        render(<Home />);
        await waitFor(() => expect(mockPush).not.toHaveBeenCalled());
        expect(screen.getByText('Validating User..')).toBeInTheDocument();
    });

    test('redirects unauthenticated user to /workplaces', async () => {
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        ); // No user (unauthenticated)

        render(<Home />);
        await waitFor(() =>
            expect(mockPush).toHaveBeenCalledWith('/workplaces'),
        );
    });
});
