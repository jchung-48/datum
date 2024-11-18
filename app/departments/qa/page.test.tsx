import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QaDepartment from './page'; // Use the corrected component name

describe('QaDepartment Component', () => {
  it('renders correctly', () => {
    render(<QaDepartment />);
    expect(screen.getByText('Welcome to Quality Assurance!')).toBeInTheDocument();
    expect(screen.getByText('These are the QA files.')).toBeInTheDocument();
  });

  it('renders file upload input', () => {
    render(<QaDepartment />);
    const fileInput = screen.getByLabelText(/department files/i);
    expect(fileInput).toBeInTheDocument();
  });

  it('handles file upload state', () => {
    render(<QaDepartment />);
    const uploadButton = screen.getByText(/upload to qa department/i);
    fireEvent.click(uploadButton);
    expect(screen.getByText('Please select a file before uploading.')).toBeInTheDocument();
  });

  it('renders FileList components', () => {
    render(<QaDepartment />);
    expect(screen.getByText('Department Files')).toBeInTheDocument();
    expect(screen.getByText('Inbox Files')).toBeInTheDocument();
  });
});
