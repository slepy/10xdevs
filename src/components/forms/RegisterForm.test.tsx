import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";
import { useRegister } from "./hooks/useRegister";

// Mock the useRegister hook
vi.mock("./hooks/useRegister", () => ({
  useRegister: vi.fn(),
}));

describe("RegisterForm (React Hook Form)", () => {
  const mockRegister = vi.fn();
  const mockUseRegister = vi.mocked(useRegister);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRegister.mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
  });

  it("should render all required fields", () => {
    render(<RegisterForm />);

    expect(screen.getByPlaceholderText("Wprowadź swoje imię")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Wprowadź swoje nazwisko")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Wprowadź swój e-mail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Utwórz bezpieczne hasło")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Wprowadź hasło ponownie")).toBeInTheDocument();
    expect(screen.getByTestId("register-submit-button")).toBeInTheDocument();
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
  });

  it("should show required field indicators", () => {
    render(<RegisterForm />);

    // Check for required asterisks or indicators
    const requiredFields = screen.getAllByText("*");
    expect(requiredFields).toHaveLength(5); // All fields are required
  });

  it("should show password help text", () => {
    render(<RegisterForm />);

    expect(
      screen.getByText(/hasło musi zawierać min\. 8 znaków, wielką literę, cyfrę i znak specjalny/i)
    ).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/imię jest wymagane/i)).toBeInTheDocument();
      expect(screen.getByText(/nazwisko jest wymagane/i)).toBeInTheDocument();
      expect(screen.getByText(/e-mail jest wymagany/i)).toBeInTheDocument();
      expect(screen.getByText(/hasło jest wymagane/i)).toBeInTheDocument();
      expect(screen.getByText(/potwierdzenie hasła jest wymagane/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailField = screen.getByPlaceholderText("Wprowadź swój e-mail");
    await user.type(emailField, "invalid-email");
    await user.tab(); // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy format e-mail/i)).toBeInTheDocument();
    });
  });

  it("should validate password requirements", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordField = screen.getByPlaceholderText("Utwórz bezpieczne hasło");
    await user.type(passwordField, "weak");
    await user.tab(); // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/hasło musi mieć minimum 8 znaków/i)).toBeInTheDocument();
    });
  });

  it("should validate password confirmation", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // Test password field visibility
    const passwordField = screen.getByPlaceholderText("Utwórz bezpieczne hasło");
    const confirmPasswordField = screen.getByPlaceholderText("Wprowadź hasło ponownie");

    await user.type(passwordField, "Password123!");
    await user.type(confirmPasswordField, "DifferentPassword123!");
    await user.tab(); // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/hasła muszą być identyczne/i)).toBeInTheDocument();
    });
  });

  it("should validate name fields with Polish characters", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const firstNameField = screen.getByPlaceholderText("Wprowadź swoje imię");
    const lastNameField = screen.getByPlaceholderText("Wprowadź swoje nazwisko");

    // Test valid Polish names
    await user.type(firstNameField, "Jan");
    await user.type(lastNameField, "Kowalski");
    await user.tab();

    // Should not show errors for valid names
    await waitFor(() => {
      expect(screen.queryByText(/imię może zawierać tylko litery/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/nazwisko może zawierać tylko litery/i)).not.toBeInTheDocument();
    });

    // Test with Polish characters
    await user.clear(firstNameField);
    await user.clear(lastNameField);
    await user.type(firstNameField, "Paweł");
    await user.type(lastNameField, "Żółć");
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByText(/imię może zawierać tylko litery/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/nazwisko może zawierać tylko litery/i)).not.toBeInTheDocument();
    });
  });

  it("should reject invalid characters in name fields", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const firstNameField = screen.getByPlaceholderText("Wprowadź swoje imię");
    await user.type(firstNameField, "Jan123");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/imię może zawierać tylko litery/i)).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<RegisterForm onSuccess={onSuccess} />);

    // Fill out all fields with valid data
    await user.type(screen.getByPlaceholderText("Wprowadź swoje imię"), "Jan");
    await user.type(screen.getByPlaceholderText("Wprowadź swoje nazwisko"), "Kowalski");
    await user.type(screen.getByPlaceholderText("Wprowadź swój e-mail"), "jan@example.com");
    await user.type(screen.getByPlaceholderText("Utwórz bezpieczne hasło"), "Password123!");
    await user.type(screen.getByPlaceholderText("Wprowadź hasło ponownie"), "Password123!");

    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: "Jan",
        lastName: "Kowalski",
        email: "jan@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    });
  });

  it("should show loading state during submission", async () => {
    mockUseRegister.mockReturnValue({
      register: mockRegister,
      isLoading: true,
    });

    render(<RegisterForm />);

    const submitButton = screen.getByRole("button", { name: /rejestracja/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/rejestracja/i)).toBeInTheDocument();
  });

  it("should handle registration errors with field-specific messages", async () => {
    const user = userEvent.setup();
    const fieldError = new Error("email: Email already exists, password: Password too weak");
    mockRegister.mockRejectedValueOnce(fieldError);

    render(<RegisterForm />);

    // Fill out form with valid data that will pass Zod validation but fail API validation
    await user.type(screen.getByPlaceholderText("Wprowadź swoje imię"), "Jan");
    await user.type(screen.getByPlaceholderText("Wprowadź swoje nazwisko"), "Kowalski");
    await user.type(screen.getByPlaceholderText("Wprowadź swój e-mail"), "existing@example.com");
    await user.type(screen.getByPlaceholderText("Utwórz bezpieczne hasło"), "ValidPass123!");
    await user.type(screen.getByPlaceholderText("Wprowadź hasło ponownie"), "ValidPass123!");

    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    await user.click(submitButton);

    // Should show field-specific errors from API response
    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
      expect(screen.getByText("Password too weak")).toBeInTheDocument();
    });

    expect(mockRegister).toHaveBeenCalledWith({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "existing@example.com",
      password: "ValidPass123!",
      confirmPassword: "ValidPass123!",
    });
  });

  it("should handle general registration errors", async () => {
    const user = userEvent.setup();
    const generalError = new Error("Server error");
    mockRegister.mockRejectedValueOnce(generalError);

    render(<RegisterForm />);

    // Fill out valid form and submit
    await user.type(screen.getByPlaceholderText("Wprowadź swoje imię"), "Jan");
    await user.type(screen.getByPlaceholderText("Wprowadź swoje nazwisko"), "Kowalski");
    await user.type(screen.getByPlaceholderText("Wprowadź swój e-mail"), "jan@example.com");
    await user.type(screen.getByPlaceholderText("Utwórz bezpieczne hasło"), "Password123!");
    await user.type(screen.getByPlaceholderText("Wprowadź hasło ponownie"), "Password123!");

    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });

    expect(mockRegister).toHaveBeenCalledWith({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
  });

  it("should have proper accessibility attributes", () => {
    render(<RegisterForm />);

    const firstNameField = screen.getByPlaceholderText("Wprowadź swoje imię");
    const lastNameField = screen.getByPlaceholderText("Wprowadź swoje nazwisko");
    const emailField = screen.getByPlaceholderText("Wprowadź swój e-mail");
    const passwordField = screen.getByPlaceholderText("Utwórz bezpieczne hasło");
    const confirmPasswordField = screen.getByPlaceholderText("Wprowadź hasło ponownie");

    expect(firstNameField).toHaveAttribute("type", "text");
    expect(firstNameField).toHaveAttribute("autoComplete", "given-name");

    expect(lastNameField).toHaveAttribute("type", "text");
    expect(lastNameField).toHaveAttribute("autoComplete", "family-name");

    expect(emailField).toHaveAttribute("type", "email");
    expect(emailField).toHaveAttribute("autoComplete", "email");

    expect(passwordField).toHaveAttribute("type", "password");
    expect(passwordField).toHaveAttribute("autoComplete", "new-password");

    expect(confirmPasswordField).toHaveAttribute("type", "password");
    expect(confirmPasswordField).toHaveAttribute("autoComplete", "new-password");
  });

  it("should clear errors when user starts typing", async () => {
    const user = userEvent.setup();
    const generalError = new Error("Registration failed");
    mockRegister.mockRejectedValueOnce(generalError);

    render(<RegisterForm />);

    // Submit form to trigger error
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/imię jest wymagane/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    const firstNameField = screen.getByPlaceholderText("Wprowadź swoje imię");
    await user.type(firstNameField, "Jan");

    await waitFor(() => {
      expect(screen.queryByText(/imię jest wymagane/i)).not.toBeInTheDocument();
    });
  });

  it("should display form in responsive grid layout", () => {
    render(<RegisterForm />);

    const gridContainer = screen.getByTestId("firstName-field").closest(".grid");
    expect(gridContainer).toHaveClass("grid-cols-1", "sm:grid-cols-2");
  });
});
