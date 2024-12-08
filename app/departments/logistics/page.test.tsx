import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import LogisticsDepartment from './page';
import {
    uploadFileToStorage,
    updateFirestore,
} from '@/app/Utilities/Upload/uploadUtils';
import {FileList} from '@/app/Utilities/ListFiles/listFiles';
import AIButton from '@/app/aiAddon/aiButton';

jest.mock('@/upload/uploadUtils', () => ({
    uploadFileToStorage: jest.fn(),
    updateFirestore: jest.fn(),
}));

jest.mock('@/upload/listFiles', () => ({
    FileList: jest.fn(() => <div data-testid="file-list" />),
}));

jest.mock('@/upload/Upload/uploadComponent', () =>
    jest.fn(() => <div data-testid="upload-component" />),
);

jest.mock('@/aiAddon/aiButton', () =>
    jest.fn(() => <div data-testid="ai-button" />),
);

jest.mock('@/upload/SearchBar/searchBar', () =>
    jest.fn(() => <div data-testid="search-bar" />),
);

describe('LogisticsDepartment Component', () => {
    it('renders the Logistics department page with all components', () => {
        render(<LogisticsDepartment />);

        expect(screen.getByText('Logistics')).toBeInTheDocument();
        expect(screen.getByTestId('upload-component')).toBeInTheDocument();
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
        expect(screen.getByTestId('ai-button')).toBeInTheDocument();
        expect(screen.getAllByTestId('file-list')).toHaveLength(3); // For Transportation, Customs, and Financial Files
    });

    it('handles file selection in FileList', () => {
        const mockOnFileSelect = jest.fn();

        (FileList as jest.Mock).mockImplementation(({onFileSelect}) => {
            return (
                <div
                    onClick={() => onFileSelect('testFileId')}
                    data-testid="file-list-item"
                >
                    File Item
                </div>
            );
        });

        render(<LogisticsDepartment />);

        const fileItem = screen.getByText('File Item');
        fireEvent.click(fileItem);

        expect(mockOnFileSelect).toHaveBeenCalledWith('testFileId');
    });

    it('handles collection selection change', () => {
        render(<LogisticsDepartment />);

        const collectionSelect = screen.getByRole('combobox'); // Assuming it's a <select>
        fireEvent.change(collectionSelect, {target: {value: 'customsFiles'}});

        expect(collectionSelect).toBe('customsFiles');
    });

    it('handles successful file upload', async () => {
        const mockUpdateFirestore = jest.fn().mockResolvedValueOnce(true);
        (updateFirestore as jest.Mock).mockImplementation(mockUpdateFirestore);
        (uploadFileToStorage as jest.Mock).mockResolvedValueOnce(
            'mockDownloadUrl',
        );

        render(<LogisticsDepartment />);

        const fileInput = screen.getByLabelText('Upload File'); // Assuming label exists in UploadComponent
        const file = new File(['test content'], 'testfile.txt', {
            type: 'text/plain',
        });
        fireEvent.change(fileInput, {target: {files: [file]}});

        const uploadButton = screen.getByText('Upload'); // Assuming the button is labeled "Upload"
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(uploadFileToStorage).toHaveBeenCalledWith(
                file,
                `Company/Departments/Logistics/testfile.txt`,
            );
            expect(updateFirestore).toHaveBeenCalledWith(
                {
                    collectionType: 'Departments',
                    companyId: 'mh3VZ5IrZjubXUCZL381',
                    departmentId: 'KZm56fUOuTobsTRCfknJ',
                    customCollectionName: 'transportationFiles', // Default collection
                },
                'mockDownloadUrl',
                'testfile.txt',
                'Company/Departments/Logistics/testfile.txt',
            );
        });

        expect(
            screen.getByText('File uploaded successfully!'),
        ).toBeInTheDocument();
    });

    it('handles file upload failure', async () => {
        (uploadFileToStorage as jest.Mock).mockRejectedValueOnce(
            new Error('Upload failed'),
        );

        render(<LogisticsDepartment />);

        const fileInput = screen.getByLabelText('Upload File');
        const file = new File(['test content'], 'testfile.txt', {
            type: 'text/plain',
        });
        fireEvent.change(fileInput, {target: {files: [file]}});

        const uploadButton = screen.getByText('Upload');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(
                screen.getByText('Failed to upload file.'),
            ).toBeInTheDocument();
        });
    });

    it('refreshes file list on successful upload', async () => {
        (updateFirestore as jest.Mock).mockResolvedValueOnce(true);
        (uploadFileToStorage as jest.Mock).mockResolvedValueOnce(
            'mockDownloadUrl',
        );

        render(<LogisticsDepartment />);

        const fileInput = screen.getByLabelText('Upload File');
        const file = new File(['test content'], 'testfile.txt', {
            type: 'text/plain',
        });
        fireEvent.change(fileInput, {target: {files: [file]}});

        const uploadButton = screen.getByText('Upload');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(
                screen.getByText('File uploaded successfully!'),
            ).toBeInTheDocument();
        });

        // Assert that FileList component refreshes (via `refreshTrigger` prop toggle)
        const fileLists = screen.getAllByTestId('file-list');
        fileLists.forEach(list => {
            expect(list).toHaveAttribute('refreshtrigger', 'true');
        });
    });

    it('triggers AIButton functionality', () => {
        const mockAIButtonHandler = jest.fn();
        (AIButton as jest.Mock).mockImplementation(() => (
            <button data-testid="ai-button" onClick={mockAIButtonHandler}>
                AI Button
            </button>
        ));

        render(<LogisticsDepartment />);

        const aiButton = screen.getByTestId('ai-button');
        fireEvent.click(aiButton);

        expect(mockAIButtonHandler).toHaveBeenCalled();
    });
});
