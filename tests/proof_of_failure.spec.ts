import { test, expect } from '../fixtures/fixtures';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║            PROOF-OF-FAILURE DEMONSTRATION FILE                  ║
 * ║                                                                  ║
 * ║  This file contains ONE intentionally broken test to prove       ║
 * ║  the test suite actually catches failures (not just green-lights ║
 * ║  everything).                                                    ║
 * ║                                                                  ║
 * ║  STEP 1: Run this file — TC-FAIL-001 will FAIL ✗               ║
 * ║  STEP 2: Read the FIXED version below it                        ║
 * ║  STEP 3: Uncomment the fixed version — it will PASS ✓           ║
 * ║                                                                  ║
 * ║  Command: npx playwright test tests/proof_of_failure.spec.ts    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHY THIS MATTERS:
 * A test suite that never fails is useless. We deliberately
 * insert a wrong assertion here to verify our selectors and
 * assertions are genuinely exercising the application.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BROKEN TEST — THIS WILL FAIL INTENTIONALLY
// Wrong assertion: expects "Add to Cart" text but button says "Add to cart"
// (case-sensitive mismatch) AND wrong data-test selector used
// ─────────────────────────────────────────────────────────────────────────────

test('TC-FAIL-001 | [INTENTIONALLY BROKEN] Login button text check — WRONG selector', async ({ loginPage }) => {
  /**
   * BUG PLANTED:
   *   1. Wrong selector: '[data-test="login-btn"]' — the real one is '[data-test="login-button"]'
   *   2. Wrong expected text: 'Sign In' — the real button text is 'Login'
   *
   * Expected failure output:
   *   Error: locator('[data-test="login-btn"]') is not visible
   *   OR
   *   Error: expect(received).toHaveText(expected)
   *     Expected: "Sign In"
   *     Received: "Login"
   *
   * This proves our assertions are REAL checks, not rubber stamps.
   */
  await loginPage.goto();

  // ❌ Wrong selector — 'login-btn' does not exist, real one is 'login-button'
  const wrongButton = loginPage.page.locator('[data-test="login-btn"]');

  // ❌ Wrong text — button says "Login" not "Sign In"
  await expect(wrongButton).toHaveText('Sign In');
});

// ─────────────────────────────────────────────────────────────────────────────
// FIXED VERSION — uncomment the block below and comment out TC-FAIL-001 above
// to confirm the corrected test passes.
// ─────────────────────────────────────────────────────────────────────────────

test('TC-FAIL-002 | [FIXED VERSION] Login button text check — correct selector & text', async ({ loginPage }) => {
  /**
   * FIXES APPLIED:
   *   1. Correct selector: '[data-test="login-button"]'
   *   2. Correct expected text: 'Login'
   *
   * This test will PASS and demonstrate the fix worked.
   */
  await loginPage.goto();

  // ✅ Correct selector
  const correctButton = loginPage.page.locator('[data-test="login-button"]');

  // ✅ Correct text
  await expect(correctButton).toHaveText('Login');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECOND PROOF — wrong expected value (correct selector, wrong assertion)
// ─────────────────────────────────────────────────────────────────────────────

test('TC-FAIL-003 | [INTENTIONALLY BROKEN] Product count check — wrong expected number', async ({ authenticatedPage }) => {
  /**
   * BUG PLANTED:
   *   Asserts there are 10 products on the inventory page.
   *   Real count is 6.
   *
   * Expected failure output:
   *   Error: expect(received).toHaveCount(expected)
   *     Expected: 10
   *     Received: 6
   */

  // ❌ Wrong count — the real product count is 6, not 10
  await expect(authenticatedPage.locator('[data-test="inventory-item"]')).toHaveCount(10);
});

test('TC-FAIL-004 | [FIXED VERSION] Product count check — correct expected number', async ({ authenticatedPage }) => {
  /**
   * FIX: Changed expected count from 10 to 6.
   * This test will PASS.
   */

  // ✅ Correct count
  await expect(authenticatedPage.locator('[data-test="inventory-item"]')).toHaveCount(6);
});
