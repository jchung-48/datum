import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

// Mock Firebase auth and logout functionality
jest.mock("@/lib/firebaseClient", () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Home Component Tests", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("renders the Home page with department links", () => {
    render(<Home />);

    expect(screen.getByText("Quality Assurance")).toBeInTheDocument();
    expect(screen.getByText("Human Resources")).toBeInTheDocument();
    expect(screen.getByText("Logistics")).toBeInTheDocument();
    expect(screen.getByText("Merchandising")).toBeInTheDocument();
    expect(screen.getByText("Create Employee")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("AI Summarizer")).toBeInTheDocument();
    expect(screen.getByText("Knowledge is Power")).toBeInTheDocument();
  });

  it("shows the Sign Out button when a user is signed in", async () => {
    const mockOnAuthStateChanged = (callback: (user: object | null) => void) =>
      callback({ uid: "12345" }); // Simulating a signed-in user
    (auth.onAuthStateChanged as jest.Mock).mockImplementation(mockOnAuthStateChanged);

    render(<Home />);

    expect(await screen.findByText("Sign Out")).toBeInTheDocument();
  });

  it("does not show the Sign Out button when no user is signed in", async () => {
    const mockOnAuthStateChanged = (callback: (user: object | null) => void) =>
      callback(null); // Simulating no user signed in
    (auth.onAuthStateChanged as jest.Mock).mockImplementation(mockOnAuthStateChanged);

    render(<Home />);

    expect(screen.queryByText("Sign Out")).not.toBeInTheDocument();
  });

  it("navigates to the correct department pages when links are clicked", () => {
    render(<Home />);

    fireEvent.click(screen.getByText("Quality Assurance"));
    expect(mockPush).toHaveBeenCalledWith("/qaDepartment");

    fireEvent.click(screen.getByText("Human Resources"));
    expect(mockPush).toHaveBeenCalledWith("/hrDepartment");

    fireEvent.click(screen.getByText("Logistics"));
    expect(mockPush).toHaveBeenCalledWith("/logisticsDepartment");

    fireEvent.click(screen.getByText("Merchandising"));
    expect(mockPush).toHaveBeenCalledWith("/merchandisingDepartment");
  });

  it("navigates to FAQ and AI Summarizer pages when bottom buttons are clicked", () => {
    render(<Home />);

    fireEvent.click(screen.getByText("FAQ"));
    expect(mockPush).toHaveBeenCalledWith("/faq");

    fireEvent.click(screen.getByText("AI Summarizer"));
    expect(mockPush).toHaveBeenCalledWith("/pdfSummary");
  });
});
