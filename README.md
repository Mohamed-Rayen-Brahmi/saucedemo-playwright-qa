# 🧪 SauceDemo — Adversarial Playwright QA Suite

> **Target**: [https://www.saucedemo.com](https://www.saucedemo.com)  
> **Stack**: Playwright · TypeScript · Page Object Model  
> **Philosophy**: Assume every input field has a bug until proven otherwise.

---

## 📁 Project Structure

```
project-1/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI — runs on every push/PR
├── fixtures/
│   ├── fixtures.ts                 # Custom test fixtures (page objects, auth helpers)
│   └── testData.ts                 # All test data: credentials, payloads, boundaries
├── pages/                          # Page Object Models
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ProductDetailPage.ts
├── tests/
│   ├── login.spec.ts               # 30+ login adversarial tests
│   ├── cart.spec.ts                # Cart management, race conditions, persistence
│   ├── checkout.spec.ts            # Form validation, math checks, skip-step attacks
│   ├── search.spec.ts              # Product browsing, sorting, detail pages
│   └── proof_of_failure.spec.ts   # Broken tests → fixed tests (demonstrates the suite works)
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
npm install
npx playwright install --with-deps
```

### Run All Tests

```bash
npm test
```

### Run a Specific Suite

```bash
npm run test:login      # Login tests only
npm run test:cart       # Cart tests only
npm run test:checkout   # Checkout tests only
npm run test:search     # Product/search tests only
```

### Run Headed (See the Browser)

```bash
npm run test:headed
```

### Interactive UI Mode

```bash
npm run test:ui
```

### View HTML Report

```bash
npm run test:report
```

> The HTML report opens in your default browser showing pass/fail, traces, screenshots, and video for every test.

---

## 🔴 Proof-of-Failure Step

One of the core requirements is **proving the test suite can actually catch failures**.

### How to see it fail:

```bash
npx playwright test tests/proof_of_failure.spec.ts --project=chromium --grep "INTENTIONALLY BROKEN"
```

**Expected output:**

```
  ✘ TC-FAIL-001 | [INTENTIONALLY BROKEN] Login button text check — WRONG selector (2.3s)
  ✘ TC-FAIL-003 | [INTENTIONALLY BROKEN] Product count check — wrong expected number (1.8s)

  2 failed
```

### How to see it pass (fixed version):

```bash
npx playwright test tests/proof_of_failure.spec.ts --project=chromium --grep "FIXED VERSION"
```

**Expected output:**

```
  ✓ TC-FAIL-002 | [FIXED VERSION] Login button text check — correct selector & text (1.2s)
  ✓ TC-FAIL-004 | [FIXED VERSION] Product count check — correct expected number (0.9s)

  2 passed
```

---

## 🧠 What's Covered

### 🔐 Login (`login.spec.ts`) — 20 tests

| Category | Tests |
|---|---|
| Happy path | Valid credentials, button state |
| Empty fields | Both empty, password only, username only |
| Invalid credentials | Wrong password, locked user, unknown user |
| Whitespace | Space-only username, space-only password, leading/trailing spaces |
| Adversarial | XSS payload, SQL injection, Unicode/emoji, 500-char input, multi-line |
| Race conditions | Double-click login button |
| Error UX | Dismiss error, fields re-editable after dismiss |
| Session / navigation | Auth redirect, unauthenticated route guard, logout, back-button after logout |
| Special users | problem_user, performance_glitch_user |

### 🛒 Cart (`cart.spec.ts`) — 18 tests

| Category | Tests |
|---|---|
| Add to cart | Badge count, button text change, item name/price in cart |
| Remove | Badge decrement, button revert, empty cart state |
| Race conditions | Double-click add, double-click remove (no negative count) |
| Persistence | Cart survives navigation, badge visible on all pages |
| Navigation | Continue shopping, browser back, direct URL to empty cart |
| Sorting | Sort doesn't clear cart, A→Z, Z→A, price low→high, high→low |

### 💳 Checkout (`checkout.spec.ts`) — 18 tests

| Category | Tests |
|---|---|
| Happy path | Full flow to confirmation |
| Required fields | All empty, first name missing, last name missing, ZIP missing |
| Whitespace | Space-only first name, space-only ZIP |
| Adversarial | XSS in name, SQL in all fields, Unicode, 500-char, multi-line |
| Postal code boundaries | Too long, letters, symbols, international (UK) |
| Math accuracy | Subtotal + tax = total |
| Order overview | Item count matches cart, cancel returns to inventory |
| Completion | Confirmation message, back to products, cart cleared after order |
| Skip-step attacks | Direct URL to step 2, direct URL to confirmation, double-click Finish |
| Back-button | Browser back from confirmation doesn't allow re-submit |

### 🔍 Products & Search (`search.spec.ts`) — 16 tests

| Category | Tests |
|---|---|
| Listing | 6 products visible, every product has all fields, unique names, positive prices |
| Detail pages | Correct page on click, price consistency, back navigation, add/remove from detail |
| Invalid URLs | id=999, id=abc, no id param |
| Sorting | 4 options present, sort persists on back-nav, rapid sort changes |
| Burger menu | All nav links visible, logout, reset app state |

---

## 🎯 Adversarial Payloads Used

| Payload | Purpose |
|---|---|
| `<script>alert("xss")</script>` | XSS / HTML injection check |
| `' OR '1'='1` | SQL-injection-style string |
| `🔥💀 Ñoño Ünïcödé テスト` | Multi-byte / unicode handling |
| `"   "` (whitespace only) | Trim validation |
| `"B".repeat(500)` | Buffer overflow / DoS |
| `"Line one\nLine two"` | Multi-line in single-line field |

> **Note**: These strings are UI validation inputs, not exploit attempts. We're checking the app escapes/sanitises output correctly.

---

## 🤖 CI/CD (GitHub Actions)

The workflow at `.github/workflows/playwright.yml`:

- Triggers on every **push** and **pull request** to `main` / `develop`
- Runs tests in **parallel across Chromium, Firefox, and WebKit**
- Uploads **HTML reports** as artifacts (30-day retention)
- Uploads **traces, screenshots, and videos** on failure (7-day retention)
- Includes a dedicated **proof-of-failure job** that verifies broken tests fail and fixed tests pass

### Viewing Reports in CI

1. Navigate to **Actions** → select a run → **Artifacts**
2. Download `playwright-report-chromium` (or firefox/webkit)
3. Unzip and open `index.html` in a browser

---

## 🧩 Extending the Suite

### Add a new test

```typescript
// tests/my-feature.spec.ts
import { test, expect } from '../fixtures/fixtures';

test('TC-X-001 | My new test', async ({ authenticatedPage }) => {
  // WHY: Explain what real bug this would catch
  await authenticatedPage.goto('/some-page');
  await expect(authenticatedPage.locator('#element')).toHaveText('expected');
});
```

### Add a new page object

```typescript
// pages/MyPage.ts
import { Page, Locator } from '@playwright/test';

export class MyPage {
  constructor(readonly page: Page) {}
  // ... add locators and helpers
}
```

### Add new test data

```typescript
// fixtures/testData.ts
export const MY_DATA = {
  validInput: 'hello',
  edgeCase: '...',
};
```

---

## 📊 Test ID Convention

| Prefix | Suite |
|---|---|
| `TC-L-xxx` | Login |
| `TC-C-xxx` | Cart |
| `TC-CHK-xxx` | Checkout |
| `TC-P-xxx` | Products / Search |
| `TC-FAIL-xxx` | Proof-of-failure |

---

## 🛠️ Troubleshooting

**Tests fail locally but pass in CI (or vice versa)**  
→ Run with `--headed` to see what the browser is doing  
→ Check `playwright-report/` for traces and screenshots

**`npx playwright install` fails**  
→ Try `npx playwright install --with-deps chromium` for just one browser

**TypeScript errors**  
→ Ensure `node_modules` is installed: `npm install`  
→ Check `tsconfig.json` includes your new files
