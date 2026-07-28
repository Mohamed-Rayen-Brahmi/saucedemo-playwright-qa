import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the SauceDemo Checkout Step One page (personal info).
 * URL: https://www.saucedemo.com/checkout-step-one.html
 */
export class CheckoutPage {
  readonly page: Page;

  // Step One — Personal Info
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  // Step Two — Overview
  readonly finishButton: Locator;
  readonly cancelButtonStep2: Locator;
  readonly summarySubtotal: Locator;
  readonly summaryTax: Locator;
  readonly summaryTotal: Locator;
  readonly summaryItems: Locator;

  // Confirmation
  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    // Step 2
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButtonStep2 = page.locator('[data-test="cancel"]');
    this.summarySubtotal = page.locator('[data-test="subtotal-label"]');
    this.summaryTax = page.locator('[data-test="tax-label"]');
    this.summaryTotal = page.locator('[data-test="total-label"]');
    this.summaryItems = page.locator('[data-test="inventory-item"]');

    // Confirmation
    this.confirmationHeader = page.locator('[data-test="complete-header"]');
    this.confirmationText = page.locator('[data-test="complete-text"]');
    this.backToProductsButton = page.locator('[data-test="back-to-products"]');
  }

  async gotoStepOne() {
    await this.page.goto('/checkout-step-one.html');
  }

  async gotoStepTwo() {
    await this.page.goto('/checkout-step-two.html');
  }

  async fillPersonalInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continueToStepTwo() {
    await this.continueButton.click();
  }

  async finishCheckout() {
    await this.finishButton.click();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  async getSubtotalValue(): Promise<number> {
    const text = (await this.summarySubtotal.textContent()) ?? '';
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getTotalValue(): Promise<number> {
    const text = (await this.summaryTotal.textContent()) ?? '';
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getTaxValue(): Promise<number> {
    const text = (await this.summaryTax.textContent()) ?? '';
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async expectOnStepOne() {
    await expect(this.page).toHaveURL(/checkout-step-one/);
  }

  async expectOnStepTwo() {
    await expect(this.page).toHaveURL(/checkout-step-two/);
  }

  async expectOnConfirmation() {
    await expect(this.page).toHaveURL(/checkout-complete/);
    await expect(this.confirmationHeader).toBeVisible();
  }

  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectErrorContains(text: string) {
    await expect(this.errorMessage).toContainText(text);
  }
}
