import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Login page
 *
 * Provides reusable methods and selectors for interacting with the login form
 * and related elements during E2E testing.
 */
export class LoginPage {
  readonly page: Page;
  readonly loginForm: Locator;
  readonly emailField: Locator;
  readonly emailInput: Locator;
  readonly passwordField: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly loginContainer: Locator;
  readonly loginTitle: Locator;
  readonly loginSubtitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.loginContainer = page.getByTestId("login-container");
    this.loginTitle = page.getByTestId("login-title");
    this.loginSubtitle = page.getByTestId("login-subtitle");

    // Form elements
    this.loginForm = page.getByTestId("login-form");
    this.emailField = page.getByTestId("email-field");
    this.emailInput = page.locator('input[type="email"]');
    this.passwordField = page.getByTestId("password-field");
    this.passwordInput = page.locator('input[type="password"]');

    // Action elements
    this.submitButton = page.getByTestId("login-submit-button");
    this.registerLink = page.getByTestId("register-link");

    // Error handling
    this.errorMessage = page.getByTestId("login-error-message");
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  /**
   * Fill in the login form and submit
   * Note: Waits for React hydration before interacting with the form
   */
  async login(email: string, password: string): Promise<void> {
    // Wait for React hydration to complete (the form is client:load)
    await this.page.waitForTimeout(1000);

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
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
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Submit the form directly (alternative method)
   */
  async submitForm(): Promise<void> {
    await this.loginForm.evaluate((form) => {
      const formElement = form as HTMLFormElement;
      formElement.requestSubmit();
    });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Wait for the login form to be visible
   */
  async waitForForm(): Promise<void> {
    await this.loginForm.waitFor({ state: "visible" });
    // Also wait for inputs to be ready (React hydration)
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
  }

  /**
   * Wait for error message to appear
   */
  async waitForError(): Promise<void> {
    await this.errorMessage.waitFor({ state: "visible" });
  }

  /**
   * Check if the login form is visible
   */
  async isFormVisible(): Promise<boolean> {
    return await this.loginForm.isVisible();
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
    return buttonText?.includes("Logowanie...") || false;
  }

  /**
   * Navigate to register page using the register link
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Get the current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if user is redirected after successful login
   * Waits for URL change and DOM to be ready
   */
  async waitForRedirect(expectedUrl = "/offers", timeout = 10000): Promise<void> {
    try {
      // Wait for URL to match the expected pattern (handles query params and trailing slashes)
      // Use a more flexible pattern that accounts for trailing slashes and query parameters
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
    await this.page.keyboard.press("Tab"); // Focus email input
    await this.page.keyboard.press("Tab"); // Focus password input
    await this.page.keyboard.press("Tab"); // Focus submit button
  }

  /**
   * Check accessibility - verify focus order and ARIA attributes
   */
  async checkAccessibility(): Promise<{ emailFocused: boolean; passwordFocused: boolean; submitFocused: boolean }> {
    // Focus directly on the email input to start testing form navigation
    await this.emailInput.focus();
    const emailFocused = await this.emailInput.evaluate((el) => el === document.activeElement);

    // Tab to password input and verify it gets focus
    await this.page.keyboard.press("Tab");
    const passwordFocused = await this.passwordInput.evaluate((el) => el === document.activeElement);

    // Tab to submit button and verify it gets focus
    await this.page.keyboard.press("Tab");
    const submitFocused = await this.submitButton.evaluate((el) => el === document.activeElement);

    // Return whether each element successfully received focus in sequence
    return { emailFocused, passwordFocused, submitFocused };
  }

  /**
   * Submit form using Enter key
   * Uses actual keyboard interaction to simulate real user behavior
   */
  async submitWithEnter(): Promise<void> {
    // Wait for React hydration to ensure the onSubmit handler is attached
    await this.page.waitForTimeout(1000);

    // Focus on the password field and press Enter
    // This should trigger the form's onSubmit handler in React
    await this.passwordInput.focus();
    await this.passwordInput.press("Enter");
  }

  /**
   * Alternative method: Submit by clicking the submit button
   * This is more reliable than Enter key for testing form submission
   */
  async submitByButton(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Login with credentials and wait for successful redirect
   * Combines form submission and navigation waiting for more reliable testing
   */
  async loginAndWaitForRedirect(email: string, password: string, expectedUrl = "/offers"): Promise<void> {
    // Wait for React hydration to complete
    await this.page.waitForTimeout(1000);

    // Fill credentials
    await this.fillEmail(email);
    await this.fillPassword(password);

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
    const formAction = await this.loginForm.getAttribute("action");
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
        const form = document.querySelector('[data-testid="login-form"]') as HTMLFormElement;
        return form && (!form.action || form.action === "" || form.action === window.location.href);
      },
      { timeout: 5000 }
    );
  }
}
