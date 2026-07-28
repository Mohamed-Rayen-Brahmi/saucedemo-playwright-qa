import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the SauceDemo Login page.
 * URL: https://www.saucedemo.com/
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.errorCloseButton = page.locator('[data-test="error"] .error-button');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsStandardUser() {
    await this.login('standard_user', 'secret_sauce');
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectErrorContains(text: string) {
    await expect(this.errorMessage).toContainText(text);
  }

  async expectOnInventoryPage() {
    await expect(this.page).toHaveURL(/inventory/);
  }
}
