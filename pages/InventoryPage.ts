import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the SauceDemo Inventory (product listing) page.
 * URL: https://www.saucedemo.com/inventory.html
 */
export class InventoryPage {
  readonly page: Page;
  readonly inventoryContainer: Locator;
  readonly inventoryItems: Locator;
  readonly cartIcon: Locator;
  readonly cartBadge: Locator;
  readonly sortDropdown: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryContainer = page.locator('[data-test="inventory-container"]');
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  async addItemToCartByName(name: string) {
    const item = this.page.locator('[data-test="inventory-item"]').filter({ hasText: name });
    await item.locator('button').click();
  }

  async removeItemFromCartByName(name: string) {
    const item = this.page.locator('[data-test="inventory-item"]').filter({ hasText: name });
    await item.locator('button').click();
  }

  async getCartCount(): Promise<number> {
    const text = await this.cartBadge.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  async getAllAddToCartButtons(): Promise<Locator[]> {
    const buttons = this.page.locator('button[data-test^="add-to-cart"]');
    const count = await buttons.count();
    return Array.from({ length: count }, (_, i) => buttons.nth(i));
  }

  /**
   * Adds ALL items to cart by always clicking the first remaining
   * "Add to cart" button. This avoids stale nth() indices — once a button
   * is clicked it changes to "Remove" and disappears from the selector,
   * shifting all subsequent indices.
   */
  async addAllItemsToCart() {
    const totalProducts = await this.inventoryItems.count();
    for (let i = 0; i < totalProducts; i++) {
      await this.page.locator('button[data-test^="add-to-cart"]').first().click();
    }
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo') {
    await this.sortDropdown.selectOption(value);
  }

  async getProductNames(): Promise<string[]> {
    const names = this.page.locator('[data-test="inventory-item-name"]');
    const count = await names.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push((await names.nth(i).textContent()) ?? '');
    }
    return result;
  }

  async getProductPrices(): Promise<number[]> {
    const prices = this.page.locator('[data-test="inventory-item-price"]');
    const count = await prices.count();
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await prices.nth(i).textContent()) ?? '0';
      result.push(parseFloat(text.replace('$', '')));
    }
    return result;
  }

  async openBurgerMenu() {
    await this.burgerMenuButton.click();
    await this.page.waitForSelector('#logout_sidebar_link', { state: 'visible' });
  }

  async logout() {
    await this.openBurgerMenu();
    await this.logoutLink.click();
  }

  async goToCart() {
    await this.cartIcon.click();
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(/inventory/);
    await expect(this.inventoryContainer).toBeVisible();
  }
}
