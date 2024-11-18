import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LogisticsDepartment from './page';
import '@testing-library/jest-dom';
import { uploadFileToStorage, updateFirestore } from '../Utilities/Upload/uploadUtils';

// Mock dependencies
jest.mock('../Utilities/ListFiles/listFiles', () => ({
  FileList: jest.fn(() => <div data-testid="file-list"></div>),
}));
jest.mock('../Utilities/Upload/uploadUtils', () => ({
  uploadFileToStorage: jest.fn(),
  updateFirestore: jest.fn(),
}));
jest.mock('../aiAddon/aiButton', () => jest.fn(() => <button data-testid="ai-button">AI Button</button>));
jest.mock('../Utilities/SearchBar/searchBar', () => jest.fn(() => <input data-testid="search-bar" />));
jest.mock('../Utilities/Upload/uploadComponent', () => jest.fn(() => <button data-testid="upload-component">Upload Component</button>));

describe('LogisticsDepartment Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with DATUM and profile icon', () => {
    render(<LogisticsDepartment />);
    expect(screen.getByText(/DATUM/i)).toBeInTheDocument();
    expect(screen.getByTestId('ai-button')).toBeInTheDocument();
  });

  it('renders the department title', () => {
    render(<LogisticsDepartment />);
    expect(screen.getByText(/Logistics/i)).toBeInTheDocument();
  });

  it('renders upload component and search bar', () => {
    render(<LogisticsDepartment />);
    expect(screen.getByTestId('upload-component')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('renders all file lists', () => {
    render(<LogisticsDepartment />);
    expect(screen.getAllByTestId('file-list')).toHaveLength(3); // Transportation, Customs, Financial
  });

  it('handles file upload correctly', async () => {
    (uploadFileToStorage as jest.Mock).mockResolvedValue('https://example.com/file-url');
    (updateFirestore as jest.Mock).mockResolvedValue({});

    render(<LogisticsDepartment />);

    const uploadButton = screen.getByTestId('upload-component');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(uploadFileToStorage).toHaveBeenCalled();
      expect(updateFirestore).toHaveBeenCalled();
    });
  });

  it('displays upload success message on successful upload', async () => {
    (uploadFileToStorage as jest.Mock).mockResolvedValue('https://example.com/file-url');
    (updateFirestore as jest.Mock).mockResolvedValue({});

    render(<LogisticsDepartment />);

    const uploadButton = screen.getByTestId('upload-component');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/File uploaded successfully!/i)).toBeInTheDocument();
    });
  });

  it('displays upload error message on failure', async () => {
    (uploadFileToStorage as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    render(<LogisticsDepartment />);

    const uploadButton = screen.getByTestId('upload-component');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to upload file/i)).toBeInTheDocument();
    });
  });

  it('renders AIButton component', () => {
    render(<LogisticsDepartment />);
    expect(screen.getByTestId('ai-button')).toBeInTheDocument();
  });

  it('updates file list when a file is uploaded', async () => {
    render(<LogisticsDepartment />);
    const uploadButton = screen.getByTestId('upload-component');

    fireEvent.click(uploadButton);
    await waitFor(() => {
      expect(screen.getAllByTestId('file-list')).toHaveLength(3); // Transportation, Customs, Financial
    });
  });
});
