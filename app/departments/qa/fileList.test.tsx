import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {FileList} from '@/app/Utilities/ListFiles/listFiles';
import {FileListProps} from '@/app/types';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    getDocs: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
    getDownloadURL: jest.fn().mockResolvedValue('mock-download-url'),
    ref: jest.fn(),
}));

const mockProps: FileListProps = {
    collectionPath: [
        'Company',
        'mockCompanyId',
        'Departments',
        'mockDeptId',
        'files',
    ],
    title: 'Mock Department Files',
};

describe('FileList Component', () => {
    it('renders loading state', () => {
        render(<FileList {...mockProps} />);
        expect(
            screen.getByText('Loading mock department files...'),
        ).toBeInTheDocument();
    });

    it('renders error message when loading fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error output
        render(<FileList {...mockProps} />);
        expect(
            await screen.findByText('Failed to load mock department files.'),
        ).toBeInTheDocument();
    });

    it('renders no files available message when there are no files', async () => {
        render(<FileList {...mockProps} />);
        expect(
            await screen.findByText('No files available.'),
        ).toBeInTheDocument();
    });

    it('renders a list of files when data is fetched', async () => {
        const mockFiles = [
            {
                id: '1',
                fileName: 'File1.pdf',
                download: 'mock-url-1',
                filePath: 'path1',
            },
            {
                id: '2',
                fileName: 'File2.docx',
                download: 'mock-url-2',
                filePath: 'path2',
            },
        ];

        jest.mocked(mockFiles);
        render(<FileList {...mockProps} />);

        expect(await screen.findByText('File1.pdf')).toBeInTheDocument();
        expect(await screen.findByText('File2.docx')).toBeInTheDocument();
    });
});
