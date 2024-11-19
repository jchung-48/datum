import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';
import { auth } from '@/lib/firebaseClient';
import {
  getEmployeeProfile,
  getUserDepartmentsNew,
  resetPassword,
  sendVerificationCode,
  verifyAndUpdatePhoneNumber,
  logoutUser,
} from '@/app/authentication';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/firebaseClient', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: 'test-uid' },
  },
}));

jest.mock('@/app/authentication', () => ({
  getEmployeeProfile: jest.fn(),
  getUserDepartmentsNew: jest.fn(),
  resetPassword: jest.fn(),
  sendVerificationCode: jest.fn(),
  verifyAndUpdatePhoneNumber: jest.fn(),
  logoutUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ProfilePage', () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
  });

  it('should render loading state initially', () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => callback(null));

    render(<ProfilePage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect unauthenticated users to login', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => callback(null));

    render(<ProfilePage />);

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/login'));
  });

  it('should display error if fetching profile data fails', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ uid: 'test-uid' })
    );
    (getEmployeeProfile as jest.Mock).mockRejectedValue(new Error('Failed to fetch profile'));

    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByText('Error fetching profile data')).toBeInTheDocument());
  });

  it('should display employee data and departments', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ uid: 'test-uid' })
    );
    (getEmployeeProfile as jest.Mock).mockResolvedValue({
      name: 'Test User',
      companyName: 'Datum',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      role: 'Manager',
      createdAt: '2023-01-01',
      departments: ['dep1'],
    });
    (getUserDepartmentsNew as jest.Mock).mockResolvedValue(['HR', 'Engineering']);

    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    expect(screen.getByText('Employee at Datum since 2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('should handle password reset', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ uid: 'test-uid' })
    );
    (getEmployeeProfile as jest.Mock).mockResolvedValue({
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      role: 'Manager',
      createdAt: '2023-01-01',
    });

    render(<ProfilePage />);

    fireEvent.click(screen.getByText('Change Password'));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith('test@example.com')
    );
  });

  it('should send verification code for updating phone number', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ uid: 'test-uid' })
    );
    (getEmployeeProfile as jest.Mock).mockResolvedValue({
      name: 'Test User',
      phoneNumber: '1234567890',
      createdAt: '2023-01-01',
    });
    (sendVerificationCode as jest.Mock).mockResolvedValue('test-verification-id');

    render(<ProfilePage />);

    fireEvent.change(screen.getByPlaceholderText('New Phone Number'), {
      target: { value: '9876543210' },
    });
    fireEvent.click(screen.getByText('Send Verification Code'));

    await waitFor(() =>
      expect(sendVerificationCode).toHaveBeenCalledWith('9876543210')
    );
    expect(screen.getByPlaceholderText('Enter verification code')).toBeInTheDocument();
  });

  it('should verify and update phone number', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ uid: 'test-uid' })
    );
    (getEmployeeProfile as jest.Mock).mockResolvedValue({
      name: 'Test User',
      phoneNumber: '1234567890',
      createdAt: '2023-01-01',
    });

    render(<ProfilePage />);

    fireEvent.change(screen.getByPlaceholderText('New Phone Number'), {
      target: { value: '9876543210' },
    });
    fireEvent.click(screen.getByText('Send Verification Code'));

    await waitFor(() => screen.getByPlaceholderText('Enter verification code'));

    fireEvent.change(screen.getByPlaceholderText('Enter verification code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('Verify and Update'));

    await waitFor(() =>
      expect(verifyAndUpdatePhoneNumber).toHaveBeenCalledWith('123456', 'test-verification-id')
    );
  });

  it('should sign out the user', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ uid: 'test-uid' })
    );

    render(<ProfilePage />);

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => expect(logoutUser).toHaveBeenCalled());
    expect(mockRouterPush).toHaveBeenCalledWith('/workplaces');
  });
});
