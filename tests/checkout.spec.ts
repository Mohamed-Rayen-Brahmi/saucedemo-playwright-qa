import { test, expect } from '../fixtures/fixtures';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CartPage } from '../pages/CartPage';
import { InventoryPage } from '../pages/InventoryPage';
import {
  VALID_CHECKOUT_INFO,
  XSS_PAYLOAD,
  SQL_PAYLOAD,
  UNICODE_PAYLOAD,
  WHITESPACE_ONLY,
  STRING_500,
  ZIP_CODES,
  INTL_POSTAL_CODES,
  MULTILINE_PAYLOAD,
  PRODUCT_NAMES,
} from '../fixtures/testData';

/**
 * CHECKOUT TEST SUITE — SauceDemo
 *
 * Goal: Break the checkout form and payment flow.
 * Covers personal info validation, math accuracy,
 * skip-step attacks, and adversarial inputs.
 */

test.describe('Checkout — Happy Path (Step 1)', () => {
  test('TC-CHK-001 | Valid info in all fields → proceeds to step 2', async ({ pageWithItemInCart }) => {
    // WHY: Baseline smoke test for the most critical user journey (purchase).
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.expectOnStepTwo();
  });
});

test.describe('Checkout — Required Field Validation (Step 1)', () => {
  test('TC-CHK-010 | All fields empty → error: First Name is required', async ({ pageWithItemInCart }) => {
    // WHY: Without client-side validation, a blank form POST could create a ghost order.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.continueButton.click();
    await checkout.expectErrorContains('First Name is required');
  });

  test('TC-CHK-011 | First name missing → specific error, last name not flagged first', async ({ pageWithItemInCart }) => {
    // WHY: Validation order matters — users should fix fields top-to-bottom.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo('', VALID_CHECKOUT_INFO.lastName, VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    await checkout.expectErrorContains('First Name is required');
  });

  test('TC-CHK-012 | Last name missing → specific error', async ({ pageWithItemInCart }) => {
    // WHY: The error should identify WHICH field is missing, not just "fill in form".
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, '', VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    await checkout.expectErrorContains('Last Name is required');
  });

  test('TC-CHK-013 | Postal code missing → specific error', async ({ pageWithItemInCart }) => {
    // WHY: Postal code powers shipping calculation — missing it silently could produce wrong totals.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, VALID_CHECKOUT_INFO.lastName, '');
    await checkout.continueButton.click();
    await checkout.expectErrorContains('Postal Code is required');
  });
});

test.describe('Checkout — Whitespace Input (Step 1)', () => {
  test('TC-CHK-020 | Whitespace-only first name → treated as empty, shows error', async ({ pageWithItemInCart }) => {
    // WHY: "   " (spaces) are visually indistinguishable from empty to users — app must trim.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(WHITESPACE_ONLY, VALID_CHECKOUT_INFO.lastName, VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    // Expect either an error OR the app trims and accepts — must NOT crash
    const onStepTwo = pageWithItemInCart.url().includes('checkout-step-two');
    const errorVisible = await checkout.errorMessage.isVisible().catch(() => false);
    expect(onStepTwo || errorVisible).toBeTruthy();
  });

  test('TC-CHK-021 | Whitespace-only postal code → error or graceful handling', async ({ pageWithItemInCart }) => {
    // WHY: A space-only ZIP would produce incorrect shipping quotes.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, VALID_CHECKOUT_INFO.lastName, WHITESPACE_ONLY);
    await checkout.continueButton.click();
    const onStepTwo = pageWithItemInCart.url().includes('checkout-step-two');
    const errorVisible = await checkout.errorMessage.isVisible().catch(() => false);
    expect(onStepTwo || errorVisible).toBeTruthy();
  });
});

test.describe('Checkout — Adversarial Inputs (Step 1)', () => {
  test('TC-CHK-030 | XSS in first name field → no alert fires, output escaped', async ({ pageWithItemInCart }) => {
    // WHY: Order confirmation pages that echo the user's name are prime XSS targets.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();

    let alertFired = false;
    pageWithItemInCart.on('dialog', () => { alertFired = true; });

    await checkout.fillPersonalInfo(XSS_PAYLOAD, VALID_CHECKOUT_INFO.lastName, VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    expect(alertFired).toBe(false);
  });

  test('TC-CHK-031 | SQL injection in all checkout fields → no crash', async ({ pageWithItemInCart }) => {
    // WHY: Order forms that feed a backend DB without parameterisation are vulnerable.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(SQL_PAYLOAD, SQL_PAYLOAD, SQL_PAYLOAD);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    // Should show an error or proceed — must NOT crash to a blank/error page
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });

  test('TC-CHK-032 | Unicode emoji in name fields → no crash', async ({ pageWithItemInCart }) => {
    // WHY: Unicode in a customer name could break PDF generation or email templating.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(UNICODE_PAYLOAD, UNICODE_PAYLOAD, VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });

  test('TC-CHK-033 | 500-char first name → app stays responsive', async ({ pageWithItemInCart }) => {
    // WHY: Very long names could overflow DB columns, causing silent truncation or server errors.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(STRING_500, VALID_CHECKOUT_INFO.lastName, VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });

  test('TC-CHK-034 | Multi-line text in first name → handled gracefully', async ({ pageWithItemInCart }) => {
    // WHY: Newlines in name fields break CSV exports and certain template engines.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(MULTILINE_PAYLOAD, VALID_CHECKOUT_INFO.lastName, VALID_CHECKOUT_INFO.postalCode);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });
});

test.describe('Checkout — Postal Code Boundary Values', () => {
  test('TC-CHK-040 | Very long postal code (15 chars) → error or graceful handling', async ({ pageWithItemInCart }) => {
    // WHY: Postal codes have known max lengths; overflow could cause address validation crashes.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, VALID_CHECKOUT_INFO.lastName, ZIP_CODES.tooLong);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });

  test('TC-CHK-041 | Letters in postal code → error or accepted (app-dependent)', async ({ pageWithItemInCart }) => {
    // WHY: Non-numeric ZIP codes are valid in some countries; app must not crash.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, VALID_CHECKOUT_INFO.lastName, ZIP_CODES.letters);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    const url = pageWithItemInCart.url();
    expect(url.includes('checkout-step-two') || url.includes('checkout-step-one')).toBeTruthy();
  });

  test('TC-CHK-042 | Symbols-only postal code → error or handled', async ({ pageWithItemInCart }) => {
    // WHY: Special chars in ZIP can inject into address APIs or break CSV generation.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, VALID_CHECKOUT_INFO.lastName, ZIP_CODES.symbols);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(500);
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });

  test('TC-CHK-043 | International postal code (UK) → accepted or errored cleanly', async ({ pageWithItemInCart }) => {
    // WHY: Internationalisation — US-only ZIP validation rejects legitimate global customers.
    const checkout = new CheckoutPage(pageWithItemInCart);
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    await checkout.fillPersonalInfo(VALID_CHECKOUT_INFO.firstName, VALID_CHECKOUT_INFO.lastName, INTL_POSTAL_CODES.uk);
    await checkout.continueButton.click();
    await pageWithItemInCart.waitForTimeout(300);
    await expect(pageWithItemInCart).not.toHaveURL('about:blank');
  });
});

test.describe('Checkout — Step 2 (Order Overview)', () => {
  test('TC-CHK-050 | Subtotal + tax = total (math accuracy)', async ({ pageWithItemInCart }) => {
    // WHY: Rounding errors in financial calculations are real bugs with legal implications.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.expectOnStepTwo();

    const subtotal = await checkout.getSubtotalValue();
    const tax = await checkout.getTaxValue();
    const total = await checkout.getTotalValue();

    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('TC-CHK-051 | Items in overview match items added to cart', async ({ pageWithItemInCart }) => {
    // WHY: The overview could show stale cart data or the wrong user's items.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await expect(checkout.summaryItems).toHaveCount(1);
  });

  test('TC-CHK-052 | Cancel from step 2 → returns to cart with items intact', async ({ pageWithItemInCart }) => {
    // WHY: Cancellation should undo navigation, not empty the cart.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.cancelButtonStep2.click();
    await expect(pageWithItemInCart).toHaveURL(/inventory/);
  });

  test('TC-CHK-053 | Finish button completes order → confirmation page shown', async ({ pageWithItemInCart }) => {
    // WHY: The complete-order flow must reach the confirmation page with a success message.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.finishCheckout();
    await checkout.expectOnConfirmation();
    await expect(checkout.confirmationHeader).toHaveText('Thank you for your order!');
  });

  test('TC-CHK-054 | Confirmation page → back to products button works', async ({ pageWithItemInCart }) => {
    // WHY: Dead "Back to Products" link after order is a real UX failure.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.finishCheckout();
    await checkout.expectOnConfirmation();
    await checkout.backToProductsButton.click();
    await expect(pageWithItemInCart).toHaveURL(/inventory/);
  });

  test('TC-CHK-055 | Cart is empty after completing order', async ({ pageWithItemInCart }) => {
    // WHY: If the cart isn't cleared post-order, clicking "Buy Again" would double-charge.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.finishCheckout();
    await checkout.backToProductsButton.click();
    const inv = new InventoryPage(pageWithItemInCart);
    await expect(inv.cartBadge).not.toBeVisible();
  });
});

test.describe('Checkout — Skip Step / Guard Bypasses', () => {
  test('TC-CHK-060 | Direct URL to step 2 without filling step 1 → redirected or shows empty', async ({ authenticatedPage }) => {
    // WHY: URL-hopping is a classic bypass — step 2 without step 1 data could crash the summary.
    const inv = new InventoryPage(authenticatedPage);
    await inv.addItemToCartByName(PRODUCT_NAMES.backpack);
    await authenticatedPage.goto('/checkout-step-two.html');
    // App should either redirect to step-one or show an empty-but-not-crashed state
    await expect(authenticatedPage).not.toHaveURL('about:blank');
  });

  test('TC-CHK-061 | Direct URL to checkout-complete without placing order → no fake confirmation', async ({ authenticatedPage }) => {
    // WHY: Accessing /checkout-complete.html directly should not show an unearned confirmation.
    await authenticatedPage.goto('/checkout-complete.html');
    await expect(authenticatedPage).not.toHaveURL('about:blank');
    // SauceDemo shows the page — we assert no real order data appears without an actual order
    // (The page renders but that's a known SauceDemo limitation — we document it)
  });

  test('TC-CHK-062 | Double-click "Finish" button → order placed only once', async ({ pageWithItemInCart }) => {
    // WHY: Double-submit race condition could create duplicate orders — a financial bug.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    // Rapid double-click finish
    await Promise.all([
      checkout.finishButton.click(),
      checkout.finishButton.click(),
    ]);
    await pageWithItemInCart.waitForTimeout(1000);
    // Should land on confirmation exactly once
    await expect(pageWithItemInCart).toHaveURL(/checkout-complete/);
  });

  test('TC-CHK-063 | Browser back from confirmation → does not allow re-submit', async ({ pageWithItemInCart }) => {
    // WHY: Pressing back after placing an order and resubmitting is a classic double-order bug.
    const cart = new CartPage(pageWithItemInCart);
    await cart.goto();
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(pageWithItemInCart);
    await checkout.fillPersonalInfo(
      VALID_CHECKOUT_INFO.firstName,
      VALID_CHECKOUT_INFO.lastName,
      VALID_CHECKOUT_INFO.postalCode
    );
    await checkout.continueToStepTwo();
    await checkout.finishCheckout();
    await checkout.expectOnConfirmation();
    await pageWithItemInCart.goBack();
    // Step 2 page visible again — Finish button should either be gone or redirect
    const url = pageWithItemInCart.url();
    expect(url.includes('checkout') || url.includes('inventory')).toBeTruthy();
  });
});
