import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the SauceDemo Product Detail page.
 * URL: https://www.saucedemo.com/inventory-item.html?id=X
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('[data-test="inventory-item-name"]');
    this.productDescription = page.locator('[data-test="inventory-item-desc"]');
    this.productPrice = page.locator('[data-test="inventory-item-price"]');
    this.addToCartButton = page.locator('[data-test^="add-to-cart"]');
    this.removeButton = page.locator('[data-test^="remove"]');
    this.backButton = page.locator('[data-test="back-to-products"]');
  }

  async goto(itemId: number) {
    await this.page.goto(`/inventory-item.html?id=${itemId}`);
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async removeFromCart() {
    await this.removeButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }

  async getPriceValue(): Promise<number> {
    const text = (await this.productPrice.textContent()) ?? '';
    return parseFloat(text.replace('$', ''));
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(/inventory-item/);
    await expect(this.productName).toBeVisible();
  }
}
