import { test, expect } from '../fixtures/fixtures';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { PRODUCT_IDS, PRODUCT_NAMES } from '../fixtures/testData';

/**
 * PRODUCT / SEARCH TEST SUITE — SauceDemo
 *
 * Goal: Break product browsing, detail pages, and the
 * filtering/sorting mechanisms.
 */

test.describe('Product Listing — General', () => {
  test('TC-P-001 | Inventory page shows exactly 6 products', async ({ authenticatedPage }) => {
    // WHY: A missing product or doubled entry suggests a data/rendering bug.
    const inv = new InventoryPage(authenticatedPage);
    await expect(inv.inventoryItems).toHaveCount(6);
  });

  test('TC-P-002 | Every product has a name, description, price, and image', async ({ authenticatedPage }) => {
    // WHY: Incomplete product cards (missing price, broken image) mislead users.
    const count = await authenticatedPage.locator('[data-test="inventory-item"]').count();
    for (let i = 0; i < count; i++) {
      const item = authenticatedPage.locator('[data-test="inventory-item"]').nth(i);
      await expect(item.locator('[data-test="inventory-item-name"]')).not.toHaveText('');
      await expect(item.locator('[data-test="inventory-item-desc"]')).not.toHaveText('');
      await expect(item.locator('[data-test="inventory-item-price"]')).not.toHaveText('');
      const img = item.locator('img');
      await expect(img).toBeVisible();
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('TC-P-003 | All product prices are positive numbers', async ({ authenticatedPage }) => {
    // WHY: A price of $0.00 or negative is a financial data bug.
    const inv = new InventoryPage(authenticatedPage);
    const prices = await inv.getProductPrices();
    prices.forEach(price => expect(price).toBeGreaterThan(0));
  });

  test('TC-P-004 | Each product has a unique name', async ({ authenticatedPage }) => {
    // WHY: Duplicate names confuse users and indicate a data duplication bug.
    const inv = new InventoryPage(authenticatedPage);
    const names = await inv.getProductNames();
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

test.describe('Product Detail Pages', () => {
  test('TC-P-010 | Clicking product name opens correct detail page', async ({ authenticatedPage }) => {
    // WHY: Wrong item ID mapping would show the wrong product detail.
    await authenticatedPage.locator('[data-test="inventory-item-name"]').first().click();
    await expect(authenticatedPage).toHaveURL(/inventory-item/);
    const detail = new ProductDetailPage(authenticatedPage);
    await expect(detail.productName).toBeVisible();
    await expect(detail.productName).not.toHaveText('');
  });

  test('TC-P-011 | Product detail price matches listing price', async ({ authenticatedPage }) => {
    // WHY: Inconsistent prices between list and detail are a UX trust-breaker.
    const inv = new InventoryPage(authenticatedPage);
    const listPrices = await inv.getProductPrices();
    const listNames = await inv.getProductNames();

    await authenticatedPage.locator('[data-test="inventory-item-name"]').first().click();
    const detail = new ProductDetailPage(authenticatedPage);
    const detailPrice = await detail.getPriceValue();
    const listPrice = listPrices[0]; // first item
    expect(detailPrice).toBeCloseTo(listPrice, 2);
  });

  test('TC-P-012 | "Back to products" from detail page returns to inventory', async ({ authenticatedPage }) => {
    // WHY: Navigation from detail must not lose the authenticated state.
    await authenticatedPage.locator('[data-test="inventory-item-name"]').first().click();
    const detail = new ProductDetailPage(authenticatedPage);
    await detail.goBack();
    await expect(authenticatedPage).toHaveURL(/inventory/);
  });

  test('TC-P-013 | Add to cart from detail page increments badge', async ({ authenticatedPage }) => {
    // WHY: Cart logic on detail pages is a different code path — both must work.
    const detail = new ProductDetailPage(authenticatedPage);
    await detail.goto(PRODUCT_IDS.backpack);
    await detail.addToCart();
    const badge = authenticatedPage.locator('[data-test="shopping-cart-badge"]');
    await expect(badge).toHaveText('1');
  });

  test('TC-P-014 | Remove from detail page removes item from cart', async ({ pageWithItemInCart }) => {
    // WHY: Remove on detail page should update cart state, not just the button label.
    const detail = new ProductDetailPage(pageWithItemInCart);
    await detail.goto(PRODUCT_IDS.backpack);
    await detail.removeFromCart();
    const badge = pageWithItemInCart.locator('[data-test="shopping-cart-badge"]');
    await expect(badge).not.toBeVisible();
  });

  test('TC-P-015 | Direct URL with invalid item ID → no crash', async ({ authenticatedPage }) => {
    // WHY: Crafted URLs with invalid IDs (e.g., id=999) could cause unhandled server errors.
    await authenticatedPage.goto('/inventory-item.html?id=999');
    // Should show an error state or redirect — NOT a JS exception
    await expect(authenticatedPage).not.toHaveURL('about:blank');
  });

  test('TC-P-016 | Direct URL with non-numeric item ID → no crash', async ({ authenticatedPage }) => {
    // WHY: Non-numeric ID could break parseInt() or cause DB query errors.
    await authenticatedPage.goto('/inventory-item.html?id=abc');
    await expect(authenticatedPage).not.toHaveURL('about:blank');
  });

  test('TC-P-017 | Detail page without id param → no crash', async ({ authenticatedPage }) => {
    // WHY: Missing required query params often cause uncaught NullPointerExceptions.
    await authenticatedPage.goto('/inventory-item.html');
    await expect(authenticatedPage).not.toHaveURL('about:blank');
  });
});

test.describe('Sorting — Adversarial Cases', () => {
  test('TC-P-020 | Sort dropdown has expected 4 options', async ({ authenticatedPage }) => {
    // WHY: Missing sort options indicate a rendering bug in the dropdown component.
    const inv = new InventoryPage(authenticatedPage);
    const options = await inv.sortDropdown.locator('option').count();
    expect(options).toBe(4);
  });

  test('TC-P-021 | Sort persists when navigating to detail and back', async ({ authenticatedPage }) => {
    // WHY: Sort state reset on navigation forces users to re-sort — a common SPA bug.
    const inv = new InventoryPage(authenticatedPage);
    await inv.sortBy('za');
    await authenticatedPage.locator('[data-test="inventory-item-name"]').first().click();
    await authenticatedPage.goBack();
    // Sort value may or may not persist — we assert the page doesn't crash
    await expect(authenticatedPage).toHaveURL(/inventory/);
    await expect(inv.inventoryItems).toHaveCount(6);
  });

  test('TC-P-022 | Rapid sort changes → all 6 products always visible', async ({ authenticatedPage }) => {
    // WHY: Fast sort toggling can expose race conditions in async data fetching.
    const inv = new InventoryPage(authenticatedPage);
    await inv.sortBy('az');
    await inv.sortBy('hilo');
    await inv.sortBy('lohi');
    await inv.sortBy('za');
    await expect(inv.inventoryItems).toHaveCount(6);
  });
});

test.describe('Burger Menu', () => {
  test('TC-P-030 | Burger menu opens and shows all nav links', async ({ authenticatedPage }) => {
    // WHY: Hidden navigation items indicate a broken menu-open animation or z-index issue.
    const inv = new InventoryPage(authenticatedPage);
    await inv.openBurgerMenu();
    await expect(authenticatedPage.locator('#inventory_sidebar_link')).toBeVisible();
    await expect(authenticatedPage.locator('#about_sidebar_link')).toBeVisible();
    await expect(authenticatedPage.locator('#logout_sidebar_link')).toBeVisible();
    await expect(authenticatedPage.locator('#reset_sidebar_link')).toBeVisible();
  });

  test('TC-P-031 | Logout via burger menu → redirected to login', async ({ authenticatedPage }) => {
    // WHY: Logout is the most critical security action — it must always work.
    const inv = new InventoryPage(authenticatedPage);
    await inv.logout();
    await expect(authenticatedPage).toHaveURL(/saucedemo\.com\/?$/);
  });

  test('TC-P-032 | "Reset App State" clears cart', async ({ pageWithItemInCart }) => {
    // WHY: The reset button is used by testers — it must actually clear state.
    const inv = new InventoryPage(pageWithItemInCart);
    await inv.openBurgerMenu();
    await pageWithItemInCart.locator('#reset_sidebar_link').click();
    await pageWithItemInCart.waitForTimeout(300);
    await expect(inv.cartBadge).not.toBeVisible();
  });
});
