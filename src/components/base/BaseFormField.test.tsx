import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseFormField } from "./BaseFormField";
import { forwardRef } from "react";

describe("BaseFormField", () => {
  it("should render input field with label", () => {
    render(
      <BaseFormField
        label="Test Label"
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
          placeholder: "Enter text",
        }}
      />
    );

    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("should render textarea field when fieldType is textarea", () => {
    render(
      <BaseFormField
        label="Description"
        fieldType="textarea"
        textareaProps={{
          value: "",
          onChange: vi.fn(),
          placeholder: "Enter description",
          rows: 4,
        }}
      />
    );

    const textarea = screen.getByLabelText("Description");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "4");
  });

  it("should display error message", () => {
    render(
      <BaseFormField
        label="Email"
        error="Invalid email format"
        inputProps={{
          type: "email",
          value: "invalid-email",
          onChange: vi.fn(),
        }}
      />
    );

    const errorMessage = screen.getByText("Invalid email format");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute("role", "alert");
  });

  it("should display help text when no error", () => {
    render(
      <BaseFormField
        label="Password"
        helpText="Password must be at least 8 characters"
        inputProps={{
          type: "password",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("should hide help text when error is present", () => {
    render(
      <BaseFormField
        label="Password"
        error="Password is required"
        helpText="Password must be at least 8 characters"
        inputProps={{
          type: "password",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.queryByText("Password must be at least 8 characters")).not.toBeInTheDocument();
  });

  it("should apply error variant to input when error is present", () => {
    render(
      <BaseFormField
        label="Email"
        error="Invalid email"
        inputProps={{
          type: "email",
          value: "invalid",
          onChange: vi.fn(),
        }}
      />
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should generate unique IDs for accessibility", () => {
    // Test with error - helpText should not be rendered
    const { rerender } = render(
      <BaseFormField
        label="Test Field"
        error="Test error"
        helpText="Test help"
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    const input = screen.getByLabelText("Test Field");
    const inputId = input.getAttribute("id");
    const errorElement = screen.getByText("Test error");

    expect(inputId).toBeTruthy();
    expect(errorElement).toHaveAttribute("id", `${inputId}-error`);
    expect(screen.queryByText("Test help")).not.toBeInTheDocument();

    // Test with helpText only
    rerender(
      <BaseFormField
        label="Test Field"
        helpText="Test help"
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    const helpElement = screen.getByText("Test help");
    expect(helpElement).toHaveAttribute("id", `${inputId}-help`);
  });

  it("should associate input with label using htmlFor", () => {
    render(
      <BaseFormField
        label="Username"
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    const input = screen.getByLabelText("Username");
    const label = screen.getByText("Username").closest("label");
    const inputId = input.getAttribute("id");

    expect(label).toHaveAttribute("for", inputId);
  });

  it("should set aria-describedby correctly", () => {
    render(
      <BaseFormField
        label="Email"
        error="Invalid email"
        helpText="Enter valid email"
        inputProps={{
          type: "email",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    const input = screen.getByLabelText("Email");
    const inputId = input.getAttribute("id");
    const ariaDescribedBy = input.getAttribute("aria-describedby");

    expect(ariaDescribedBy).toBe(`${inputId}-error`);
  });

  it("should set aria-describedby for help text when no error", () => {
    render(
      <BaseFormField
        label="Password"
        helpText="At least 8 characters"
        inputProps={{
          type: "password",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    const input = screen.getByLabelText("Password");
    const inputId = input.getAttribute("id");
    const ariaDescribedBy = input.getAttribute("aria-describedby");

    expect(ariaDescribedBy).toBe(`${inputId}-help`);
  });

  it("should handle custom CSS classes", () => {
    render(
      <BaseFormField
        label="Test"
        className="custom-class"
        data-testid="test-field"
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    const container = screen.getByTestId("test-field");
    expect(container).toHaveClass("custom-class");
  });

  it("should apply data-testid to container", () => {
    render(
      <BaseFormField
        label="Test Field"
        data-testid="test-form-field"
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByTestId("test-form-field")).toBeInTheDocument();
  });

  it("should forward refs correctly for input", () => {
    const TestComponent = forwardRef<HTMLInputElement>((props, ref) => (
      <BaseFormField
        label="Test Input"
        ref={ref}
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    ));
    TestComponent.displayName = "TestComponent";

    const ref = vi.fn();
    render(<TestComponent ref={ref} />);

    // Ref should be called with the input element
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("should forward refs correctly for textarea", () => {
    const TestComponent = forwardRef<HTMLTextAreaElement>((props, ref) => (
      <BaseFormField
        label="Test Textarea"
        fieldType="textarea"
        ref={ref}
        textareaProps={{
          value: "",
          onChange: vi.fn(),
        }}
      />
    ));
    TestComponent.displayName = "TestTextareaComponent";

    const ref = vi.fn();
    render(<TestComponent ref={ref} />);

    // Ref should be called with the textarea element
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });

  it("should handle label props correctly", () => {
    render(
      <BaseFormField
        label="Required Field"
        labelProps={{ required: true }}
        inputProps={{
          type: "text",
          value: "",
          onChange: vi.fn(),
        }}
      />
    );

    // BaseLabel with required: true shows asterisk
    expect(screen.getByText("Required Field")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should work without label", () => {
    render(
      <BaseFormField
        inputProps={{
          type: "text",
          value: "test",
          onChange: vi.fn(),
          placeholder: "No label field",
        }}
      />
    );

    expect(screen.getByPlaceholderText("No label field")).toBeInTheDocument();
    expect(screen.queryByRole("label")).not.toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseFormField
        label="Interactive Field"
        inputProps={{
          type: "text",
          value: "",
          onChange: handleChange,
        }}
      />
    );

    const input = screen.getByLabelText("Interactive Field");
    await user.type(input, "hello");

    expect(handleChange).toHaveBeenCalled();
  });
});
