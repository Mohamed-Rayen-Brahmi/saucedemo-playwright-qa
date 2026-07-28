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
    this.removeButtons = page.locator('[data-test^="remove"]');
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
    const item = this.page.locator('[data-test="cart-item"]').filter({ hasText: name });
    await item.locator('button[data-test^="remove"]').click();
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
