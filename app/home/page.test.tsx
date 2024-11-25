import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // For extended matchers
import Home from "./page"; // Adjust the path as needed
import { auth } from "@/lib/firebaseClient"; // Mock Firebase auth
import { useRouter } from "next/navigation";

// Mock Firebase and router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/firebaseClient", () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}));

jest.mock("../authentication", () => ({
  getEmployeeProfile: jest.fn(),
}));

describe("Home Component", () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });

    jest.clearAllMocks();
  });

  it("renders the Home component correctly", () => {
    render(<Home />);
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.getByText("is Power")).toBeInTheDocument();
  });

  it("disables department links if the user does not have permissions", () => {
    const userDepartments: string[] = []; // No access
    const isAdmin = false;

    render(
      <Home
        isAdmin={isAdmin}
        userDepartments={userDepartments}
      />
    );

    // Check for disabled state
    const qaButton = screen.getByText("Quality Assurance");
    expect(qaButton).toHaveStyle("opacity: 0.5");
    expect(qaButton).toHaveAttribute("aria-disabled", "true");

    const hrButton = screen.getByText("Human Resources");
    expect(hrButton).toHaveStyle("opacity: 0.5");
    expect(hrButton).toHaveAttribute("aria-disabled", "true");
  });

  it("enables department links if the user has permissions", () => {
    const userDepartments: string[] = ["Eq2IDInbEQB5nI5Ar6Vj"]; // QA department ID
    const isAdmin = false;

    render(
      <Home
        isAdmin={isAdmin}
        userDepartments={userDepartments}
      />
    );

    // Check for enabled state
    const qaButton = screen.getByText("Quality Assurance");
    expect(qaButton).toHaveStyle("opacity: 1");
    expect(qaButton.closest("a")).toHaveAttribute("href", "/departments/qa");
  });

  it("enables all department links for admin users", () => {
    const userDepartments: string[] = [];
    const isAdmin = true;

    render(
      <Home
        isAdmin={isAdmin}
        userDepartments={userDepartments}
      />
    );

    // All buttons should be enabled
    const qaButton = screen.getByText("Quality Assurance");
    const hrButton = screen.getByText("Human Resources");
    const logisticsButton = screen.getByText("Logistics");
    const merchandisingButton = screen.getByText("Merchandising");

    [qaButton, hrButton, logisticsButton, merchandisingButton].forEach((button) => {
      expect(button).toHaveStyle("opacity: 1");
      expect(button.closest("a")).toBeInTheDocument();
    });
  });

  it("calls the logout function and redirects to /workplaces on sign out", () => {
    const userDepartments: string[] = ["Eq2IDInbEQB5nI5Ar6Vj"];
    const isAdmin = true;

    render(
      <Home
        isAdmin={isAdmin}
        userDepartments={userDepartments}
      />
    );

    const signOutButton = screen.getByText("Sign Out");
    fireEvent.click(signOutButton);

    expect(mockRouterPush).toHaveBeenCalledWith("/workplaces");
  });
});
