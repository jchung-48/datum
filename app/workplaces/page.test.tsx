import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from '@/app/workplaces/page';
import { auth } from '@/lib/firebaseClient';
import { getCompanies } from '@/app/authentication';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/firebaseClient', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/authentication', () => ({
  getCompanies: jest.fn(),
}));

describe('Workplaces Page', () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
  });

  it('should display a loading indicator while fetching companies', () => {
    (getCompanies as jest.Mock).mockImplementation(() => new Promise(() => {})); // Mock pending promise

    render(<Page />);

    expect(screen.getByText('Loading companies...')).toBeInTheDocument();
  });

  it('should display fetched companies in a dropdown', async () => {
    const mockCompanies = [
      { id: 'company1', name: 'Company One' },
      { id: 'company2', name: 'Company Two' },
    ];
    (getCompanies as jest.Mock).mockResolvedValue(mockCompanies);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Select a Workplace')).toBeInTheDocument();
      expect(screen.getByText('Company One')).toBeInTheDocument();
      expect(screen.getByText('Company Two')).toBeInTheDocument();
    });
  });

  it('should redirect to signin page with selected company ID when a company is selected', async () => {
    const mockCompanies = [
      { id: 'company1', name: 'Company One' },
      { id: 'company2', name: 'Company Two' },
    ];
    (getCompanies as jest.Mock).mockResolvedValue(mockCompanies);

    render(<Page />);

    await waitFor(() => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'company1' } });
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/signin?workplaceId=company1');
  });

  it('should handle errors during company fetch', async () => {
    console.error = jest.fn(); // Silence expected error log in tests
    (getCompanies as jest.Mock).mockRejectedValue(new Error('Error fetching companies'));

    render(<Page />);

    await waitFor(() => {
      expect(screen.queryByText('Loading companies...')).not.toBeInTheDocument();
    });

    // Since error handling isn't shown in the component, we only test no crashing here
    expect(console.error).toHaveBeenCalledWith('Error fetching companies:', expect.any(Error));
  });

  it('should automatically redirect authenticated users to their department URL', async () => {
    const mockAuthUser = {
      uid: 'user1',
      getIdTokenResult: jest.fn().mockResolvedValue({ claims: { companyId: 'company1' } }),
    };
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => callback(mockAuthUser));
    const mockDepSnap = { exists: () => true, get: () => 'dashboard' };
    const mockGetDoc = jest.fn().mockResolvedValue(mockDepSnap);
    jest.mock('@/lib/firebaseClient', () => ({
      db: {},
      getDoc: mockGetDoc,
    }));

    render(<Page />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
