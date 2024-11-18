import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { getDocs } from "firebase/firestore";
import FAQPage from './page';

// Mock Firestore `getDocs` to simulate Firestore behavior
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe("FAQPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the FAQ page with dropdowns and search button", () => {
    render(<FAQPage />);

    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("ROLE")).toBeInTheDocument();
    expect(screen.getByText("PRODUCT CATEGORY")).toBeInTheDocument();
    expect(screen.getByText("FAQ CATEGORY")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("displays error message when no search criteria is selected", async () => {
    render(<FAQPage />);

    const searchButton = screen.getByText("Search");
    fireEvent.click(searchButton);

    expect(await screen.findByText("No search criteria has been selected. You must choose at least one.")).toBeInTheDocument();
  });

  it("fetches and displays FAQ results when valid criteria is selected", async () => {
    // Mocking Firestore response
    const mockFAQs = [
      {
        id: "1",
        question: "What is the return policy?",
        answer: "The return policy is 30 days.",
        role: "Buyer",
        product_category: "Furniture",
        faq_category: "Product Quality",
      },
    ];
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockFAQs.map((faq) => ({
        id: faq.id,
        data: () => faq,
      })),
    });

    render(<FAQPage />);

    // Select criteria
    fireEvent.change(screen.getByLabelText(/ROLE/i), { target: { value: "Buyer" } });
    fireEvent.change(screen.getByLabelText(/PRODUCT CATEGORY/i), { target: { value: "Furniture" } });

    // Trigger search
    fireEvent.click(screen.getByText("Search"));

    // Wait for results to render
    await waitFor(() => {
      expect(screen.getByText("What is the return policy?")).toBeInTheDocument();
      expect(screen.getByText("The return policy is 30 days.")).toBeInTheDocument();
    });
  });

  it("displays an error message when Firestore query fails", async () => {
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error("Firestore error"));

    render(<FAQPage />);

    fireEvent.change(screen.getByLabelText(/ROLE/i), { target: { value: "Buyer" } });
    fireEvent.click(screen.getByText("Search"));

    await waitFor(() => {
      expect(screen.getByText("An error occurred while fetching data.")).toBeInTheDocument();
    });
  });

  it("shows no results message when no matching FAQs are found", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });

    render(<FAQPage />);

    fireEvent.change(screen.getByLabelText(/ROLE/i), { target: { value: "Buyer" } });
    fireEvent.click(screen.getByText("Search"));

    await waitFor(() => {
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });
  });
});
