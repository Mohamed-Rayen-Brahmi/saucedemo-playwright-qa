import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the SauceDemo Cart page.
 * URL: https://www.saucedemo.com/cart.html
 */
export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly cartItemNames: Locator;
  readonly cartItemPrices: Locator;
  readonly removeButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-test="cart-item"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.cartItemNames = page.locator('[data-test="inventory-item-name"]');
    this.cartItemPrices = page.locator('[data-test="inventory-item-price"]');
    // Use text-based selector — more robust than data-test^="remove" across browsers
    this.removeButtons = page.locator('button:has-text("Remove")');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async getItemNames(): Promise<string[]> {
    const count = await this.cartItemNames.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push((await this.cartItemNames.nth(i).textContent()) ?? '');
    }
    return names;
  }

  async removeItemByName(name: string) {
    // Strategy: find the Remove button using the specific data-test slug derived from the name.
    // SauceDemo remove buttons have data-test="remove-{slug}" e.g. "remove-sauce-labs-backpack".
    // Convert product name to slug: lowercase, replace spaces with hyphens.
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const specificBtn = this.page.locator(`[data-test="remove-${slug}"]`);
    const specificExists = await specificBtn.count();
    if (specificExists > 0) {
      await specificBtn.click();
      return;
    }
    // Fallback: click first visible Remove button on the page
    await this.page.locator('button:has-text("Remove")').first().click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(/cart/);
  }

  async expectCartEmpty() {
    await expect(this.cartItems).toHaveCount(0);
  }

  async expectItemCount(count: number) {
    await expect(this.cartItems).toHaveCount(count);
  }
}
