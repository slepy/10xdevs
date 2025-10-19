import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Register page
 *
 * Provides reusable methods and selectors for interacting with the registration form
 * and related elements during E2E testing.
 */
export class RegisterPage {
  readonly page: Page;
  readonly registerForm: Locator;
  readonly firstNameField: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameField: Locator;
  readonly lastNameInput: Locator;
  readonly emailField: Locator;
  readonly emailInput: Locator;
  readonly passwordField: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordField: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;
  readonly registerContainer: Locator;
  readonly registerTitle: Locator;
  readonly registerSubtitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.registerContainer = page.getByTestId("register-container");
    this.registerTitle = page.getByTestId("register-title");
    this.registerSubtitle = page.getByTestId("register-subtitle");

    // Form elements
    this.registerForm = page.getByTestId("register-form");
    this.firstNameField = page.getByTestId("firstName-field");
    this.firstNameInput = page.locator('input[name="firstName"], input[autocomplete="given-name"]').first();
    this.lastNameField = page.getByTestId("lastName-field");
    this.lastNameInput = page.locator('input[name="lastName"], input[autocomplete="family-name"]').first();
    this.emailField = page.getByTestId("email-field");
    this.emailInput = page.locator('input[type="email"]');
    this.passwordField = page.getByTestId("password-field");
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordField = page.getByTestId("confirmPassword-field");
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);

    // Action elements
    this.submitButton = page.getByTestId("register-submit-button");
    this.loginLink = page.getByTestId("login-link");

    // Error handling
    this.errorMessage = page.getByTestId("register-error-message");
  }

  /**
   * Navigate to the register page
   */
  async goto(): Promise<void> {
    await this.page.goto("/register");
  }

  /**
   * Fill in the registration form and submit
   * Note: Waits for React hydration before interacting with the form
   */
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<void> {
    // Wait for React hydration to complete (the form is client:load)
    await this.page.waitForTimeout(1000);

    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword || password);
    await this.submitButton.click();
  }

  /**
   * Fill only the first name field
   */
  async fillFirstName(firstName: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
  }

  /**
   * Fill only the last name field
   */
  async fillLastName(lastName: string): Promise<void> {
    await this.lastNameInput.fill(lastName);
  }

  /**
   * Fill only the email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill only the password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill only the confirm password field
   */
  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Submit the form directly (alternative method)
   */
  async submitForm(): Promise<void> {
    await this.registerForm.evaluate((form) => {
      const formElement = form as HTMLFormElement;
      formElement.requestSubmit();
    });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.confirmPasswordInput.clear();
  }

  /**
   * Wait for the registration form to be visible
   */
  async waitForForm(): Promise<void> {
    await this.registerForm.waitFor({ state: "visible" });
    // Also wait for inputs to be ready (React hydration)
    await this.firstNameInput.waitFor({ state: "visible" });
    await this.lastNameInput.waitFor({ state: "visible" });
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    await this.confirmPasswordInput.waitFor({ state: "visible" });
  }

  /**
   * Wait for error message to appear
   */
  async waitForError(): Promise<void> {
    await this.errorMessage.waitFor({ state: "visible" });
  }

  /**
   * Check if the registration form is visible
   */
  async isFormVisible(): Promise<boolean> {
    return await this.registerForm.isVisible();
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorText(): Promise<string | null> {
    if (await this.isErrorVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button shows loading state
   */
  async isLoading(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    const hasLoadingText = buttonText?.includes("Rejestracja...") || false;

    // Also check for loading spinner (BaseButton shows an SVG spinner when loading)
    const hasLoadingSpinner = await this.submitButton
      .locator("svg.animate-spin")
      .isVisible()
      .catch(() => false);

    return hasLoadingText || hasLoadingSpinner;
  }

  /**
   * Navigate to login page using the login link
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }

  /**
   * Get the current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if user is redirected after successful registration
   * Waits for URL change and DOM to be ready
   */
  async waitForRedirect(expectedUrl = "/offers", timeout = 10000): Promise<void> {
    try {
      // Wait for URL to match the expected pattern (handles query params and trailing slashes)
      const urlPattern = expectedUrl.endsWith("/") ? expectedUrl : `${expectedUrl}`;
      await this.page.waitForURL(
        (url) => {
          const pathname = new URL(url).pathname;
          return pathname === urlPattern || pathname === `${urlPattern}/`;
        },
        {
          timeout,
          waitUntil: "domcontentloaded", // Less strict than 'load', more suitable for SPAs
        }
      );
    } catch (error) {
      // Provide more helpful error message with current URL for debugging
      const currentUrl = this.page.url();
      throw new Error(
        `Failed to redirect to ${expectedUrl} within ${timeout}ms. Current URL: ${currentUrl}. Original error: ${error}`
      );
    }
  }

  /**
   * Wait for any navigation away from current page
   * Useful when you don't know the exact destination URL
   */
  async waitForNavigation(timeout = 10000): Promise<void> {
    const currentUrl = this.page.url();
    await this.page.waitForURL((url) => url.toString() !== currentUrl, {
      timeout,
      waitUntil: "domcontentloaded",
    });
  }

  /**
   * Simulate keyboard navigation through form elements
   */
  async navigateByKeyboard(): Promise<void> {
    await this.page.keyboard.press("Tab"); // Focus first name input
    await this.page.keyboard.press("Tab"); // Focus last name input
    await this.page.keyboard.press("Tab"); // Focus email input
    await this.page.keyboard.press("Tab"); // Focus password input
    await this.page.keyboard.press("Tab"); // Focus confirm password input
    await this.page.keyboard.press("Tab"); // Focus submit button
  }

  /**
   * Check accessibility - verify focus order and ARIA attributes
   */
  async checkAccessibility(): Promise<{
    firstNameFocused: boolean;
    lastNameFocused: boolean;
    emailFocused: boolean;
    passwordFocused: boolean;
    confirmPasswordFocused: boolean;
    submitFocused: boolean;
  }> {
    // Focus directly on the first name input to start testing form navigation
    await this.firstNameInput.focus();
    const firstNameFocused = await this.firstNameInput.evaluate((el) => el === document.activeElement);

    // Tab through all form elements
    await this.page.keyboard.press("Tab");
    const lastNameFocused = await this.lastNameInput.evaluate((el) => el === document.activeElement);

    await this.page.keyboard.press("Tab");
    const emailFocused = await this.emailInput.evaluate((el) => el === document.activeElement);

    await this.page.keyboard.press("Tab");
    const passwordFocused = await this.passwordInput.evaluate((el) => el === document.activeElement);

    await this.page.keyboard.press("Tab");
    const confirmPasswordFocused = await this.confirmPasswordInput.evaluate((el) => el === document.activeElement);

    await this.page.keyboard.press("Tab");
    const submitFocused = await this.submitButton.evaluate((el) => el === document.activeElement);

    return {
      firstNameFocused,
      lastNameFocused,
      emailFocused,
      passwordFocused,
      confirmPasswordFocused,
      submitFocused,
    };
  }

  /**
   * Submit form using Enter key
   * Uses actual keyboard interaction to simulate real user behavior
   */
  async submitWithEnter(): Promise<void> {
    // Wait for React hydration to ensure the onSubmit handler is attached
    await this.page.waitForTimeout(1000);

    // Focus on the confirm password field and press Enter
    // This should trigger the form's onSubmit handler in React
    await this.confirmPasswordInput.focus();
    await this.confirmPasswordInput.press("Enter");
  }

  /**
   * Alternative method: Submit by clicking the submit button
   * This is more reliable than Enter key for testing form submission
   */
  async submitByButton(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Register with credentials and wait for successful redirect
   * Combines form submission and navigation waiting for more reliable testing
   */
  async registerAndWaitForRedirect(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword?: string,
    expectedUrl = "/offers"
  ): Promise<void> {
    // Wait for React hydration to complete
    await this.page.waitForTimeout(1000);

    // Fill credentials
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword || password);

    // Wait for React state to update
    await this.page.waitForTimeout(500);

    // Submit and wait for navigation using our custom method
    await this.submit();
    await this.waitForRedirect(expectedUrl, 30000);
  }

  /**
   * Check if React form handlers are properly attached by verifying form action
   */
  async isFormHydrated(): Promise<boolean> {
    const formAction = await this.registerForm.getAttribute("action");
    // A hydrated React form should not have an action attribute (or it should be null/empty)
    return !formAction || formAction === "";
  }

  /**
   * Wait for React form to be properly hydrated
   */
  async waitForFormHydration(): Promise<void> {
    // Wait for the form to be visible first
    await this.waitForForm();

    // Wait for React hydration (form action should be empty when React takes control)
    await this.page.waitForFunction(
      () => {
        const form = document.querySelector('[data-testid="register-form"]') as HTMLFormElement;
        return form && (!form.action || form.action === "" || form.action === window.location.href);
      },
      { timeout: 5000 }
    );
  }

  /**
   * Get field error message for a specific field
   */
  async getFieldError(
    field: "firstName" | "lastName" | "email" | "password" | "confirmPassword"
  ): Promise<string | null> {
    const fieldMap = {
      firstName: this.firstNameField,
      lastName: this.lastNameField,
      email: this.emailField,
      password: this.passwordField,
      confirmPassword: this.confirmPasswordField,
    };

    const fieldLocator = fieldMap[field];
    const errorLocator = fieldLocator.locator('[role="alert"]');

    if (await errorLocator.isVisible()) {
      return await errorLocator.textContent();
    }
    return null;
  }

  /**
   * Check if specific field has validation error
   */
  async hasFieldError(field: "firstName" | "lastName" | "email" | "password" | "confirmPassword"): Promise<boolean> {
    const fieldMap = {
      firstName: this.firstNameField,
      lastName: this.lastNameField,
      email: this.emailField,
      password: this.passwordField,
      confirmPassword: this.confirmPasswordField,
    };

    const fieldLocator = fieldMap[field];
    const errorLocator = fieldLocator.locator('[role="alert"]');
    return await errorLocator.isVisible();
  }

  /**
   * Clear error by typing in a field (simulates user fixing validation error)
   */
  async clearErrorByTyping(field: "firstName" | "lastName" | "email" | "password" | "confirmPassword"): Promise<void> {
    const inputMap = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      password: this.passwordInput,
      confirmPassword: this.confirmPasswordInput,
    };

    const input = inputMap[field];
    await input.focus();
    await input.type("x");
  }
}
