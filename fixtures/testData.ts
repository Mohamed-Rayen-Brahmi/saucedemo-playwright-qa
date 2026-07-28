/**
 * Shared test data / constants used across the entire QA suite.
 * All "attack" strings are purely for UI validation testing —
 * verifying that the app sanitises and escapes input correctly.
 */

export const USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
  problemUser: { username: 'problem_user', password: 'secret_sauce' },
  performanceGlitch: { username: 'performance_glitch_user', password: 'secret_sauce' },
  invalid: { username: 'not_a_user', password: 'wrong_password' },
  wrongPassword: { username: 'standard_user', password: 'wrong_password' },
  emptyBoth: { username: '', password: '' },
  emptyPassword: { username: 'standard_user', password: '' },
  emptyUsername: { username: '', password: 'secret_sauce' },
};

export const VALID_CHECKOUT_INFO = {
  firstName: 'Jane',
  lastName: 'Doe',
  postalCode: '90210',
};

export const PRODUCT_IDS = {
  backpack: 4,
  bikeLight: 0,
  boltTShirt: 1,
  fleeceJacket: 5,
  onesie: 2,
  redTShirt: 3,
};

export const PRODUCT_NAMES = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  fleeceJacket: 'Sauce Labs Fleece Jacket',
  onesie: 'Sauce Labs Onesie',
  redTShirt: 'Test.allTheThings() T-Shirt (Red)',
};

// ─── Adversarial input strings ─────────────────────────────────────────────

/** Standard XSS probe — checks the app escapes HTML in displayed text */
export const XSS_PAYLOAD = '<script>alert("xss")</script>';

/** SQL-injection-style string — checks the app does not echo raw SQL */
export const SQL_PAYLOAD = "' OR '1'='1";

/** Emoji + unicode — checks fields don't crash on multi-byte characters */
export const UNICODE_PAYLOAD = '🔥💀 Ñoño Ünïcödé テスト';

/** Multi-line text pasted into a single-line field */
export const MULTILINE_PAYLOAD = 'Line one\nLine two\nLine three';

/** Max-length boundary: exactly 255 characters */
export const STRING_255 = 'A'.repeat(255);

/** Over max: 256 characters */
export const STRING_256 = 'A'.repeat(256);

/** Very long payload: 500 characters */
export const STRING_500 = 'B'.repeat(500);

/** Whitespace-only */
export const WHITESPACE_ONLY = '   ';

/** Invalid email formats */
export const INVALID_EMAILS = [
  'notanemail',
  'missing@',
  '@nodomain.com',
  'double@@domain.com',
  'no.tld@domain',
  'spaces in@email.com',
  'email@',
  '',
];

/** Valid email for positive tests */
export const VALID_EMAIL = 'test@example.com';

/** Typical ZIP code boundary values */
export const ZIP_CODES = {
  valid: '90210',
  tooShort: '123',
  tooLong: '123456789012345',
  letters: 'ABCDE',
  negative: '-12345',
  zero: '00000',
  symbols: '!@#$%',
};

/** Postal codes for international boundary checks */
export const INTL_POSTAL_CODES = {
  uk: 'SW1A 1AA',
  canada: 'K1A 0A6',
  japan: '100-0001',
};
