import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import hrDepartment from "./page";
import { uploadFileToStorage, updateFirestore } from "../upload/uploadUtils";
import { FileList } from "../upload/listFiles";

jest.mock("@/upload/uploadUtils", () => ({
  uploadFileToStorage: jest.fn(),
  updateFirestore: jest.fn(),
}));

jest.mock("@/upload/listFiles", () => ({
  FileList: jest.fn(() => <div data-testid="file-list" />),
}));

jest.mock("@/upload/Upload/uploadComponent", () => jest.fn(() => <div data-testid="upload-component" />));

jest.mock("@/aiAddon/aiButton", () => jest.fn(() => <div data-testid="ai-button" />));

jest.mock("@/upload/SearchBar/searchBar", () => jest.fn(() => <div data-testid="search-bar" />));

describe("hrDepartment Component", () => {
  it("renders the HR department page with all components", () => {
    render(<hrDepartment />);

    expect(screen.getByText("Welcome to Human Resources!")).toBeInTheDocument();
    expect(screen.getByText("These are the HR files.")).toBeInTheDocument();
    expect(screen.getByTestId("upload-component")).toBeInTheDocument();
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    expect(screen.getByTestId("ai-button")).toBeInTheDocument();
    expect(screen.getAllByTestId("file-list")).toHaveLength(2); // One for Department Files and one for Incident Files
  });

  it("handles file selection for upload", () => {
    render(<hrDepartment />);
    const fileInput = screen.getByLabelText("Upload File"); // Assuming label exists in UploadComponent

    const file = new File(["test content"], "testfile.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verify the file is selected (handled by UploadComponent internally)
    expect(fileInput.files[0]).toBe(file);
  });

  it("handles successful file upload", async () => {
    const mockUpdateFirestore = jest.fn().mockResolvedValueOnce(true);
    (updateFirestore as jest.Mock).mockImplementation(mockUpdateFirestore);
    (uploadFileToStorage as jest.Mock).mockResolvedValueOnce("mockDownloadUrl");

    render(<hrDepartment />);

    const fileInput = screen.getByLabelText("Upload File");
    const file = new File(["test content"], "testfile.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByText("Upload"); // Assuming the button is labeled "Upload"
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(uploadFileToStorage).toHaveBeenCalledWith(
        file,
        `Company/Departments/HumanResources/testfile.txt`
      );
      expect(updateFirestore).toHaveBeenCalledWith(
        {
          collectionType: "Departments",
          companyId: "mh3VZ5IrZjubXUCZL381",
          departmentId: "NpaV1QtwGZ2MDNOGAlXa",
          customCollectionName: "files",
        },
        "mockDownloadUrl",
        "testfile.txt",
        "Company/Departments/HumanResources/testfile.txt"
      );
    });

    expect(screen.getByText("File uploaded successfully!")).toBeInTheDocument();
  });

  it("handles file upload failure", async () => {
    (uploadFileToStorage as jest.Mock).mockRejectedValueOnce(new Error("Upload failed"));

    render(<hrDepartment />);

    const fileInput = screen.getByLabelText("Upload File");
    const file = new File(["test content"], "testfile.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByText("Upload");
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to upload file.")).toBeInTheDocument();
    });
  });

  it("handles file selection in FileList", () => {
    const mockOnFileSelect = jest.fn();

    (FileList as jest.Mock).mockImplementation(({ onFileSelect }) => {
      return <div onClick={() => onFileSelect("testFileId")} data-testid="file-list-item">File Item</div>;
    });

    render(<hrDepartment />);

    const fileItem = screen.getByText("File Item");
    fireEvent.click(fileItem);

    expect(mockOnFileSelect).toHaveBeenCalledWith("testFileId");
  });

  it("refreshes file list on successful upload", async () => {
    (updateFirestore as jest.Mock).mockResolvedValueOnce(true);
    (uploadFileToStorage as jest.Mock).mockResolvedValueOnce("mockDownloadUrl");

    render(<hrDepartment />);

    const fileInput = screen.getByLabelText("Upload File");
    const file = new File(["test content"], "testfile.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByText("Upload");
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("File uploaded successfully!")).toBeInTheDocument();
    });

    // Assert that FileList component refreshes (via `refreshTrigger` prop toggle)
    const fileLists = screen.getAllByTestId("file-list");
    fileLists.forEach((list) => {
      expect(list).toHaveAttribute("refreshtrigger", "true");
    });
  });
});
