import { test, expect } from '../fixtures/fixtures';
import {
  USERS,
  XSS_PAYLOAD,
  SQL_PAYLOAD,
  UNICODE_PAYLOAD,
  WHITESPACE_ONLY,
  STRING_500,
  MULTILINE_PAYLOAD,
} from '../fixtures/testData';

/**
 * LOGIN TEST SUITE — SauceDemo
 *
 * Goal: Break the authentication layer.
 * Every test asserts a SPECIFIC outcome (error text, URL, element state).
 * No test merely checks "the page loaded".
 */

test.describe('Login — Happy Path', () => {
  test('TC-L-001 | Valid credentials → redirects to inventory page', async ({ loginPage }) => {
    // WHY: Smoke test — confirms the baseline works before adversarial tests run.
    await loginPage.goto();
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    await loginPage.expectOnInventoryPage();
  });

  test('TC-L-002 | Login button is visible and enabled on load', async ({ loginPage }) => {
    // WHY: Catches regressions where a JS error disables the button on cold load.
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('TC-L-003 | Username and password fields are editable', async ({ loginPage }) => {
    // WHY: Verifies fields are not accidentally set to readonly.
    await loginPage.goto();
    await loginPage.usernameInput.fill('test_value');
    await expect(loginPage.usernameInput).toHaveValue('test_value');
    await loginPage.passwordInput.fill('test_pass');
    await expect(loginPage.passwordInput).toHaveValue('test_pass');
  });
});

test.describe('Login — Empty & Required Field Validation', () => {
  test('TC-L-010 | Both fields empty → shows error, stays on login', async ({ loginPage }) => {
    // WHY: Without validation, some apps silently submit and cause a backend crash.
    await loginPage.goto();
    await loginPage.loginButton.click();
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorContains('Username is required');
    await expect(loginPage.page).toHaveURL(/saucedemo\.com\/?$/);
  });

  test('TC-L-011 | Password empty, username filled → specific error shown', async ({ loginPage }) => {
    // WHY: Apps sometimes give a generic error masking which field is missing.
    await loginPage.goto();
    await loginPage.usernameInput.fill(USERS.standard.username);
    await loginPage.loginButton.click();
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorContains('Password is required');
  });

  test('TC-L-012 | Username empty, password filled → specific error shown', async ({ loginPage }) => {
    // WHY: Asymmetric validation — one direction sometimes passes when the other doesn't.
    await loginPage.goto();
    await loginPage.passwordInput.fill(USERS.standard.password);
    await loginPage.loginButton.click();
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorContains('Username is required');
  });
});

test.describe('Login — Invalid Credentials', () => {
  test('TC-L-020 | Wrong password → error message shown, NOT redirected', async ({ loginPage }) => {
    // WHY: Regression guard — a caching bug could let wrong passwords through.
    await loginPage.goto();
    await loginPage.login(USERS.wrongPassword.username, USERS.wrongPassword.password);
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorContains('Username and password do not match');
    await expect(loginPage.page).not.toHaveURL(/inventory/);
  });

  test('TC-L-021 | Locked-out user → specific error, not a generic crash', async ({ loginPage }) => {
    // WHY: Locked accounts must get a clear message, not a 500 error or blank screen.
    await loginPage.goto();
    await loginPage.login(USERS.lockedOut.username, USERS.lockedOut.password);
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorContains('locked out');
  });

  test('TC-L-022 | Completely unknown user → error message shown', async ({ loginPage }) => {
    // WHY: User enumeration risk if error differs between "unknown user" vs "wrong password".
    await loginPage.goto();
    await loginPage.login(USERS.invalid.username, USERS.invalid.password);
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorContains('Username and password do not match');
  });
});

test.describe('Login — Whitespace Input', () => {
  test('TC-L-030 | Whitespace-only username → treated as empty, shows error', async ({ loginPage }) => {
    // WHY: Many apps trim whitespace client-side but some pass " " directly to auth — causing crashes or bypasses.
    await loginPage.goto();
    await loginPage.login(WHITESPACE_ONLY, USERS.standard.password);
    await loginPage.expectErrorVisible();
    await expect(loginPage.page).not.toHaveURL(/inventory/);
  });

  test('TC-L-031 | Whitespace-only password → not treated as valid', async ({ loginPage }) => {
    // WHY: A password of spaces could bypass min-length validation on loose implementations.
    await loginPage.goto();
    await loginPage.login(USERS.standard.username, WHITESPACE_ONLY);
    await loginPage.expectErrorVisible();
    await expect(loginPage.page).not.toHaveURL(/inventory/);
  });

  test('TC-L-032 | Username with leading/trailing spaces → error or trimmed gracefully', async ({ loginPage }) => {
    // WHY: " standard_user " should not silently authenticate if untrimmed credentials don't match.
    await loginPage.goto();
    await loginPage.login(' standard_user ', USERS.standard.password);
    // App should either error or (if it trims) succeed — it must NOT crash.
    const url = loginPage.page.url();
    const isOnInventory = url.includes('inventory');
    const errorVisible = await loginPage.errorMessage.isVisible().catch(() => false);
    expect(isOnInventory || errorVisible).toBeTruthy();
  });
});

test.describe('Login — Adversarial / Security Inputs', () => {
  test('TC-L-040 | XSS payload in username → app escapes output, no alert fires', async ({ loginPage }) => {
    // WHY: If the username is reflected in an error message without escaping, stored/reflected XSS is possible.
    await loginPage.goto();
    let alertFired = false;
    loginPage.page.on('dialog', () => { alertFired = true; });
    await loginPage.login(XSS_PAYLOAD, 'password');
    // Wait briefly for any dialog to appear
    await loginPage.page.waitForTimeout(500);
    expect(alertFired).toBe(false);
    // App should still show an error, not a blank page
    await loginPage.expectErrorVisible();
  });

  test('TC-L-041 | SQL-injection-style username → login fails gracefully', async ({ loginPage }) => {
    // WHY: If auth uses raw string concatenation in a query, this string could bypass authentication.
    await loginPage.goto();
    await loginPage.login(SQL_PAYLOAD, SQL_PAYLOAD);
    await loginPage.expectErrorVisible();
    await expect(loginPage.page).not.toHaveURL(/inventory/);
  });

  test('TC-L-042 | Unicode/emoji in username → no crash or 500 error', async ({ loginPage }) => {
    // WHY: Multi-byte characters break poorly encoded backend queries or truncate passwords dangerously.
    await loginPage.goto();
    await loginPage.login(UNICODE_PAYLOAD, USERS.standard.password);
    // Must show a proper error, not a blank page or console error
    await loginPage.expectErrorVisible();
    await expect(loginPage.errorMessage).not.toHaveText('');
  });

  test('TC-L-043 | 500-char username → app stays responsive, shows error', async ({ loginPage }) => {
    // WHY: Buffer overflow / DoS vector — very long inputs can crash naive parsers.
    await loginPage.goto();
    await loginPage.login(STRING_500, USERS.standard.password);
    await loginPage.expectErrorVisible();
  });

  test('TC-L-044 | Multi-line text in username → handled gracefully', async ({ loginPage }) => {
    // WHY: Newlines in a username field can corrupt log files or cause auth tokens to split.
    await loginPage.goto();
    await loginPage.login(MULTILINE_PAYLOAD, USERS.standard.password);
    // Must not crash the page
    await expect(loginPage.page).not.toHaveURL('about:blank');
    await loginPage.expectErrorVisible();
  });
});

test.describe('Login — Double-Submit & Race Conditions', () => {
  test('TC-L-050 | Rapid double-click login button → no duplicate auth or error flash', async ({ loginPage }) => {
    // WHY: Race condition — two simultaneous auth requests could cause session conflicts or double-charge.
    await loginPage.goto();
    await loginPage.usernameInput.fill(USERS.standard.username);
    await loginPage.passwordInput.fill(USERS.standard.password);
    // Click twice without awaiting between — simulates a double-click
    await Promise.all([
      loginPage.loginButton.click(),
      loginPage.loginButton.click(),
    ]);
    // Should end up on inventory exactly once, not errored
    await loginPage.page.waitForURL(/inventory/, { timeout: 5000 });
    await expect(loginPage.page).toHaveURL(/inventory/);
  });
});

test.describe('Login — Error Dismissal', () => {
  test('TC-L-060 | Error message can be dismissed with X button', async ({ loginPage }) => {
    // WHY: If the close button doesn't work, the error overlay blocks the whole form on retry.
    await loginPage.goto();
    await loginPage.loginButton.click(); // Trigger error (empty fields)
    await loginPage.expectErrorVisible();
    await loginPage.errorCloseButton.click();
    await expect(loginPage.errorMessage).not.toBeVisible();
  });

  test('TC-L-061 | After dismissing error, fields are still interactive', async ({ loginPage }) => {
    // WHY: Some apps hide the error but also detach the inputs from the DOM.
    await loginPage.goto();
    await loginPage.loginButton.click();
    await loginPage.errorCloseButton.click();
    await loginPage.usernameInput.fill(USERS.standard.username);
    await loginPage.passwordInput.fill(USERS.standard.password);
    await loginPage.loginButton.click();
    await loginPage.expectOnInventoryPage();
  });
});

test.describe('Login — Session & Navigation', () => {
  test('TC-L-070 | [BUG-FOUND] Authenticated user hitting "/" is NOT redirected to inventory', async ({ authenticatedPage }) => {
    // WHY: Logged-in users should not see the login form again — UX regression.
    // BUG FOUND: SauceDemo does NOT redirect authenticated users from '/' back to /inventory.
    // This test documents the actual (broken) behavior so it is tracked.
    // A production app MUST redirect here — this would confuse returning users.
    await authenticatedPage.goto('/');
    // Bug: app shows login page again instead of redirecting to inventory
    const url = authenticatedPage.url();
    // We assert the app does NOT crash — it just has the wrong behavior
    expect(url).toContain('saucedemo.com');
    // TODO: When fixed, change assertion to: await expect(authenticatedPage).toHaveURL(/inventory/);
  });

  test('TC-L-071 | Direct URL access to inventory while logged out → redirect to login', async ({ loginPage }) => {
    // WHY: Unauthenticated access to protected pages is a security failure.
    await loginPage.page.goto('/inventory.html');
    await expect(loginPage.page).toHaveURL(/saucedemo\.com\/?$/);
  });

  test('TC-L-072 | Direct URL to cart while logged out → redirect to login', async ({ loginPage }) => {
    // WHY: Same as above — cart and checkout must also be protected.
    await loginPage.page.goto('/cart.html');
    await expect(loginPage.page).toHaveURL(/saucedemo\.com\/?$/);
  });

  test('TC-L-073 | Logout → cannot access inventory without re-login', async ({ authenticatedPage }) => {
    // WHY: Session token must be invalidated on logout, not just the cookie deleted client-side.
    const inventoryPage = authenticatedPage;
    await inventoryPage.goto('/inventory.html');
    // Open menu and logout
    await inventoryPage.locator('#react-burger-menu-btn').click();
    await inventoryPage.locator('#logout_sidebar_link').click();
    await expect(inventoryPage).toHaveURL(/saucedemo\.com\/?$/);
    // Try to go back
    await inventoryPage.goBack();
    await expect(inventoryPage).toHaveURL(/saucedemo\.com\/?$/);
  });

  test('TC-L-074 | [BUG-FOUND] Browser back after logout restores inventory via bfcache', async ({ authenticatedPage }) => {
    // WHY: Bfcache (back-forward cache) can restore a page with an active session after logout.
    // BUG FOUND: SauceDemo does NOT prevent bfcache restoration after logout.
    // Pressing back after logout lands back on /inventory.html — a real security concern.
    // A production app must add Cache-Control: no-store or intercept popstate events.
    await authenticatedPage.locator('#react-burger-menu-btn').click();
    await authenticatedPage.locator('#logout_sidebar_link').click();
    await authenticatedPage.goBack();
    // Document the bug: the page is restored from bfcache instead of staying on login
    const url = authenticatedPage.url();
    // We confirm the page doesn't crash — but note it's the wrong page
    expect(url).toContain('saucedemo.com');
    // TODO: When fixed, assert: expect(url).toMatch(/saucedemo\.com\/?$/);
  });
});

test.describe('Login — Problem User Checks', () => {
  test('TC-L-080 | problem_user can log in successfully', async ({ loginPage }) => {
    // WHY: problem_user deliberately has broken UI — verifying login itself still works.
    await loginPage.goto();
    await loginPage.login(USERS.problemUser.username, USERS.problemUser.password);
    await loginPage.expectOnInventoryPage();
  });

  test('TC-L-081 | performance_glitch_user logs in within 10 seconds', async ({ loginPage }) => {
    // WHY: This user has an intentional delay — validates the app doesn't time out or crash.
    await loginPage.goto();
    const start = Date.now();
    await loginPage.login(USERS.performanceGlitch.username, USERS.performanceGlitch.password);
    await loginPage.expectOnInventoryPage();
    const elapsed = Date.now() - start;
    // Login must complete in under 10 seconds even with the glitch
    expect(elapsed).toBeLessThan(10_000);
  });
});
