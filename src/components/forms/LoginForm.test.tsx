import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import { useLogin } from "./hooks/useLogin";

// Mock the useLogin hook
vi.mock("./hooks/useLogin", () => ({
  useLogin: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LoginForm (React Hook Form)", () => {
  const mockLogin = vi.fn();
  const mockUseLogin = vi.mocked(useLogin);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  it("should render all form fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeInTheDocument();
    expect(screen.getByTestId("register-link")).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/e-mail jest wymagany/i)).toBeInTheDocument();
      expect(screen.getByText(/hasło jest wymagane/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailField = screen.getByLabelText(/e-mail/i);
    await user.type(emailField, "invalid-email");
    await user.tab(); // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy format e-mail/i)).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<LoginForm onSuccess={onSuccess} />);

    const emailField = screen.getByLabelText(/e-mail/i);
    const passwordField = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole("button", { name: /zaloguj się/i });

    await user.type(emailField, "test@example.com");
    await user.type(passwordField, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("should show loading state during submission", async () => {
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });

    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /logowanie/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logowanie/i)).toBeInTheDocument();
  });

  it("should handle login errors", async () => {
    const user = userEvent.setup();
    const loginError = new Error("Invalid credentials");
    mockLogin.mockRejectedValueOnce(loginError);

    render(<LoginForm />);

    const emailField = screen.getByLabelText(/e-mail/i);
    const passwordField = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole("button", { name: /zaloguj się/i });

    await user.type(emailField, "test@example.com");
    await user.type(passwordField, "wrong-password");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("should have proper accessibility attributes", () => {
    render(<LoginForm />);

    const emailField = screen.getByLabelText(/e-mail/i);
    const passwordField = screen.getByLabelText(/hasło/i);

    expect(emailField).toHaveAttribute("type", "email");
    expect(emailField).toHaveAttribute("autoComplete", "email");
    expect(passwordField).toHaveAttribute("type", "password");
    expect(passwordField).toHaveAttribute("autoComplete", "current-password");
  });

  it("should clear errors when user starts typing", async () => {
    const user = userEvent.setup();
    const loginError = new Error("Invalid credentials");
    mockLogin.mockRejectedValueOnce(loginError);

    render(<LoginForm />);

    // Submit form to trigger error
    const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/e-mail jest wymagany/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    const emailField = screen.getByLabelText(/e-mail/i);
    await user.type(emailField, "test@example.com");

    await waitFor(() => {
      expect(screen.queryByText(/e-mail jest wymagany/i)).not.toBeInTheDocument();
    });
  });
});
