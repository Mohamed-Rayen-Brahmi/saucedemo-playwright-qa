import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';

/**
 * Extended Playwright fixture that provides pre-initialised page objects
 * and a helper to set up an authenticated session.
 */
type AppFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  productDetailPage: ProductDetailPage;
  /** Navigates to '/' and logs in as standard_user */
  authenticatedPage: Page;
  /** Logs in AND adds the first item to cart — shortcut for checkout tests */
  pageWithItemInCart: Page;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsStandardUser();
    await page.waitForURL(/inventory/);
    await use(page);
  },

  pageWithItemInCart: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsStandardUser();
    await page.waitForURL(/inventory/);
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addItemToCartByName('Sauce Labs Backpack');
    await use(page);
  },
});

export { expect } from '@playwright/test';
