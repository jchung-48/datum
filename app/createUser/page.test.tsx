import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from '@/app/createUser/page';
import { auth } from '@/lib/firebaseClient';
import { getDepartments } from '@/app/authentication';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/firebaseClient', () => ({
  auth: {
    currentUser: { getIdToken: jest.fn(() => Promise.resolve('test-id-token')) },
    onAuthStateChanged: jest.fn(),
  },
}));

jest.mock('@/app/authentication', () => ({
  getDepartments: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

global.fetch = jest.fn();

describe('createUser Page', () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
  });

  it('should render the form fields', () => {
    render(<Page />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Role')).toBeInTheDocument();
    expect(screen.getByText('Create User Account')).toBeInTheDocument();
  });

  it('should fetch and display departments on user authentication', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ getIdTokenResult: jest.fn(() => Promise.resolve({ claims: { companyId: 'test-company-id' } })) })
    );
    (getDepartments as jest.Mock).mockResolvedValue([
      { id: 'dep1', name: 'HR' },
      { id: 'dep2', name: 'Engineering' },
    ]);

    render(<Page />);

    await waitFor(() => expect(getDepartments).toHaveBeenCalledWith('test-company-id'));

    const departmentOptions = screen.getAllByRole('option');
    expect(departmentOptions).toHaveLength(3); // Including the "Select a Department" placeholder
    expect(departmentOptions[1]).toHaveTextContent('HR');
    expect(departmentOptions[2]).toHaveTextContent('Engineering');
  });

  it('should display an error message if no departments are available', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) =>
      callback({ getIdTokenResult: jest.fn(() => Promise.resolve({ claims: { companyId: 'test-company-id' } })) })
    );
    (getDepartments as jest.Mock).mockResolvedValue([]);

    render(<Page />);

    await waitFor(() => expect(getDepartments).toHaveBeenCalledWith('test-company-id'));
    expect(screen.getByText('No departments available.')).toBeInTheDocument();
  });

  it('should handle account creation successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'User created successfully!' }),
    });

    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Role'), { target: { value: 'Manager' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dep1' } });

    fireEvent.click(screen.getByText('Create User Account'));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/createUser', expect.anything()));

    expect(screen.getByText('User created successfully!')).toBeInTheDocument();
  });

  it('should display an error message if account creation fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Failed to create user' }),
    });

    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByText('Create User Account'));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/createUser', expect.anything()));

    expect(screen.getByText('Failed to create user')).toBeInTheDocument();
  });

  it('should redirect unauthenticated users', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => callback(null));

    render(<Page />);

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/workplaces'));
  });
});
