import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import Page from '@/app/signin/page';
import {auth} from '@/lib/firebaseClient';
import {useRouter, useSearchParams} from 'next/navigation';
import {
    signInUser,
    getUserDepartments,
    resetPassword,
} from '@/app/authentication';

jest.mock('@/lib/firebaseClient', () => ({
    auth: {
        onAuthStateChanged: jest.fn(),
    },
    db: {},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/app/authentication', () => ({
    signInUser: jest.fn(),
    getUserDepartments: jest.fn(),
    resetPassword: jest.fn(),
}));

describe('SignIn Page', () => {
    const mockRouterPush = jest.fn();
    const mockSearchParams = new URLSearchParams();
    mockSearchParams.set('workplaceId', 'validWorkplaceId12345');

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({push: mockRouterPush});
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should redirect to /workplaces if workplaceId is invalid', () => {
        mockSearchParams.set('workplaceId', 'invalidID');
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        );

        render(<Page />);

        expect(mockRouterPush).toHaveBeenCalledWith('/workplaces');
    });

    it('should show error message if authentication fails', async () => {
        const errorMessage = 'Company name does not match.';
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        );
        (signInUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

        render(<Page />);

        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: {value: 'test@example.com'},
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: {value: 'password123'},
        });
        fireEvent.click(screen.getByText('Sign In'));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('should display error message if no user found for the given company', async () => {
        const errorMessage = 'No user found for the given company.';
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        );
        (signInUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

        render(<Page />);

        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: {value: 'test@example.com'},
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: {value: 'password123'},
        });
        fireEvent.click(screen.getByText('Sign In'));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('should navigate to department URL upon successful sign-in', async () => {
        const userData = {uid: 'user-123'};
        const departmentData = {URL: 'dashboard'};
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        );
        (signInUser as jest.Mock).mockResolvedValue(userData);
        (getUserDepartments as jest.Mock).mockResolvedValue(departmentData);

        render(<Page />);

        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: {value: 'test@example.com'},
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: {value: 'password123'},
        });
        fireEvent.click(screen.getByText('Sign In'));

        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('should reset password when reset button is clicked with email entered', async () => {
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        );

        render(<Page />);

        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: {value: 'test@example.com'},
        });
        fireEvent.click(screen.getByText('Sign In'));

        await waitFor(() => {
            expect(resetPassword).toHaveBeenCalledWith('test@example.com');
        });
    });

    it('should alert user to enter an email for password reset', () => {
        global.alert = jest.fn();
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback =>
            callback(null),
        );

        render(<Page />);

        fireEvent.click(screen.getByText('Sign In'));

        expect(global.alert).toHaveBeenCalledWith(
            'Please enter an email in order to reset your password!',
        );
    });
});
