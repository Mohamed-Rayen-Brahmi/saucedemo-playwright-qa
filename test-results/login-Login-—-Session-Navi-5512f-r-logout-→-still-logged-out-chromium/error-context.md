# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login — Session & Navigation >> TC-L-074 | Browser back after logout → still logged out
- Location: tests\login.spec.ts:249:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: Swag Labs
  - generic [ref=e5]:
    - generic [ref=e9]:
      - textbox "Username" [ref=e11]
      - textbox "Password" [ref=e15]
      - heading [level=3] [ref=e19]:
        - button [ref=e20] [cursor=pointer]
        - text: "Epic sadface: You can only access '/inventory.html' when you are logged in."
      - button "Login" [ref=e23] [cursor=pointer]
    - generic [ref=e25]:
      - generic [ref=e26]:
        - heading "Accepted usernames are:" [level=4] [ref=e27]
        - text: standard_userlocked_out_userproblem_userperformance_glitch_usererror_uservisual_user
      - generic [ref=e28]:
        - heading "Password for all users:" [level=4] [ref=e29]
        - text: secret_sauce
```

# Test source

```ts
  157 |     await loginPage.expectErrorVisible();
  158 |     await expect(loginPage.errorMessage).not.toHaveText('');
  159 |   });
  160 | 
  161 |   test('TC-L-043 | 500-char username → app stays responsive, shows error', async ({ loginPage }) => {
  162 |     // WHY: Buffer overflow / DoS vector — very long inputs can crash naive parsers.
  163 |     await loginPage.goto();
  164 |     await loginPage.login(STRING_500, USERS.standard.password);
  165 |     await loginPage.expectErrorVisible();
  166 |   });
  167 | 
  168 |   test('TC-L-044 | Multi-line text in username → handled gracefully', async ({ loginPage }) => {
  169 |     // WHY: Newlines in a username field can corrupt log files or cause auth tokens to split.
  170 |     await loginPage.goto();
  171 |     await loginPage.login(MULTILINE_PAYLOAD, USERS.standard.password);
  172 |     // Must not crash the page
  173 |     await expect(loginPage.page).not.toHaveURL('about:blank');
  174 |     await loginPage.expectErrorVisible();
  175 |   });
  176 | });
  177 | 
  178 | test.describe('Login — Double-Submit & Race Conditions', () => {
  179 |   test('TC-L-050 | Rapid double-click login button → no duplicate auth or error flash', async ({ loginPage }) => {
  180 |     // WHY: Race condition — two simultaneous auth requests could cause session conflicts or double-charge.
  181 |     await loginPage.goto();
  182 |     await loginPage.usernameInput.fill(USERS.standard.username);
  183 |     await loginPage.passwordInput.fill(USERS.standard.password);
  184 |     // Click twice without awaiting between — simulates a double-click
  185 |     await Promise.all([
  186 |       loginPage.loginButton.click(),
  187 |       loginPage.loginButton.click(),
  188 |     ]);
  189 |     // Should end up on inventory exactly once, not errored
  190 |     await loginPage.page.waitForURL(/inventory/, { timeout: 5000 });
  191 |     await expect(loginPage.page).toHaveURL(/inventory/);
  192 |   });
  193 | });
  194 | 
  195 | test.describe('Login — Error Dismissal', () => {
  196 |   test('TC-L-060 | Error message can be dismissed with X button', async ({ loginPage }) => {
  197 |     // WHY: If the close button doesn't work, the error overlay blocks the whole form on retry.
  198 |     await loginPage.goto();
  199 |     await loginPage.loginButton.click(); // Trigger error (empty fields)
  200 |     await loginPage.expectErrorVisible();
  201 |     await loginPage.errorCloseButton.click();
  202 |     await expect(loginPage.errorMessage).not.toBeVisible();
  203 |   });
  204 | 
  205 |   test('TC-L-061 | After dismissing error, fields are still interactive', async ({ loginPage }) => {
  206 |     // WHY: Some apps hide the error but also detach the inputs from the DOM.
  207 |     await loginPage.goto();
  208 |     await loginPage.loginButton.click();
  209 |     await loginPage.errorCloseButton.click();
  210 |     await loginPage.usernameInput.fill(USERS.standard.username);
  211 |     await loginPage.passwordInput.fill(USERS.standard.password);
  212 |     await loginPage.loginButton.click();
  213 |     await loginPage.expectOnInventoryPage();
  214 |   });
  215 | });
  216 | 
  217 | test.describe('Login — Session & Navigation', () => {
  218 |   test('TC-L-070 | Authenticated user hitting "/" redirects to inventory', async ({ authenticatedPage }) => {
  219 |     // WHY: Logged-in users should not see the login form again — UX regression.
  220 |     await authenticatedPage.goto('/');
  221 |     await expect(authenticatedPage).toHaveURL(/inventory/);
  222 |   });
  223 | 
  224 |   test('TC-L-071 | Direct URL access to inventory while logged out → redirect to login', async ({ loginPage }) => {
  225 |     // WHY: Unauthenticated access to protected pages is a security failure.
  226 |     await loginPage.page.goto('/inventory.html');
  227 |     await expect(loginPage.page).toHaveURL(/saucedemo\.com\/?$/);
  228 |   });
  229 | 
  230 |   test('TC-L-072 | Direct URL to cart while logged out → redirect to login', async ({ loginPage }) => {
  231 |     // WHY: Same as above — cart and checkout must also be protected.
  232 |     await loginPage.page.goto('/cart.html');
  233 |     await expect(loginPage.page).toHaveURL(/saucedemo\.com\/?$/);
  234 |   });
  235 | 
  236 |   test('TC-L-073 | Logout → cannot access inventory without re-login', async ({ authenticatedPage }) => {
  237 |     // WHY: Session token must be invalidated on logout, not just the cookie deleted client-side.
  238 |     const inventoryPage = authenticatedPage;
  239 |     await inventoryPage.goto('/inventory.html');
  240 |     // Open menu and logout
  241 |     await inventoryPage.locator('#react-burger-menu-btn').click();
  242 |     await inventoryPage.locator('#logout_sidebar_link').click();
  243 |     await expect(inventoryPage).toHaveURL(/saucedemo\.com\/?$/);
  244 |     // Try to go back
  245 |     await inventoryPage.goBack();
  246 |     await expect(inventoryPage).toHaveURL(/saucedemo\.com\/?$/);
  247 |   });
  248 | 
  249 |   test('TC-L-074 | Browser back after logout → still logged out', async ({ authenticatedPage }) => {
  250 |     // WHY: Bfcache (back-forward cache) can restore a page with an active session after logout.
  251 |     await authenticatedPage.locator('#react-burger-menu-btn').click();
  252 |     await authenticatedPage.locator('#logout_sidebar_link').click();
  253 |     await authenticatedPage.goBack();
  254 |     // Should be on login page still, or redirected back to login
  255 |     const url = authenticatedPage.url();
  256 |     const isLoginPage = url.match(/saucedemo\.com\/?$/) !== null || url.includes('login');
> 257 |     expect(isLoginPage).toBeTruthy();
      |                         ^ Error: expect(received).toBeTruthy()
  258 |   });
  259 | });
  260 | 
  261 | test.describe('Login — Problem User Checks', () => {
  262 |   test('TC-L-080 | problem_user can log in successfully', async ({ loginPage }) => {
  263 |     // WHY: problem_user deliberately has broken UI — verifying login itself still works.
  264 |     await loginPage.goto();
  265 |     await loginPage.login(USERS.problemUser.username, USERS.problemUser.password);
  266 |     await loginPage.expectOnInventoryPage();
  267 |   });
  268 | 
  269 |   test('TC-L-081 | performance_glitch_user logs in within 10 seconds', async ({ loginPage }) => {
  270 |     // WHY: This user has an intentional delay — validates the app doesn't time out or crash.
  271 |     await loginPage.goto();
  272 |     const start = Date.now();
  273 |     await loginPage.login(USERS.performanceGlitch.username, USERS.performanceGlitch.password);
  274 |     await loginPage.expectOnInventoryPage();
  275 |     const elapsed = Date.now() - start;
  276 |     // Login must complete in under 10 seconds even with the glitch
  277 |     expect(elapsed).toBeLessThan(10_000);
  278 |   });
  279 | });
  280 | 
```