import type { AccountPayload } from './client';

/**
 * Test-data factory. Produces valid payloads with unique emails and the
 * malicious / boundary variants used by the security & scalability cases.
 *
 * Uniqueness (no Date.now collisions under parallelism): we combine a
 * caller-provided seed with a monotonic counter.
 */

let counter = 0;

/** Unique email for an isolated account. `seed` keeps runs distinguishable. */
export function uniqueEmail(seed = 'qa'): string {
  counter += 1;
  const stamp = `${process.pid}${counter}${Math.floor(performance.now())}`;
  return `${seed}_${stamp}@example.com`;
}

/** A fully valid createAccount/updateAccount payload. */
export function validAccount(overrides: Partial<AccountPayload> = {}): AccountPayload {
  const email = overrides.email ?? uniqueEmail();
  return {
    name: 'QA Automation',
    email,
    password: 'Str0ng!Pass_2026',
    title: 'Mr',
    birth_date: '10',
    birth_month: '5',
    birth_year: '1990',
    firstname: 'QA',
    lastname: 'Bot',
    company: 'Acme QA',
    address1: '123 Test Street',
    address2: 'Suite 4',
    country: 'Canada',
    zipcode: 'A1A1A1',
    state: 'Ontario',
    city: 'Toronto',
    mobile_number: '5551234567',
    ...overrides,
  };
}

/** Updated values for the same account (used by updateAccount happy path). */
export function updatedAccount(email: string, password: string): AccountPayload {
  return validAccount({
    email,
    password,
    name: 'QA Automation Updated',
    title: 'Mrs',
    firstname: 'QA2',
    lastname: 'Bot2',
    company: 'Acme QA Ltd',
    address1: '456 New Ave',
    country: 'Canada',
    zipcode: 'B2B2B2',
    state: 'British Columbia',
    city: 'Vancouver',
    mobile_number: '5559876543',
    birth_date: '11',
    birth_month: '6',
    birth_year: '1991',
  });
}

/** Common attack / boundary strings for security & scalability cases. */
export const PAYLOADS = {
  sqlInjection: "' OR '1'='1'; --",
  sqlDrop: "Robert'); DROP TABLE users; --",
  xss: '<script>alert("xss")</script>',
  unicode: '名前 José 🎉 Ωμέγα',
  oversize: 'A'.repeat(10_000),
  malformedEmail: 'not-an-email',
  emailInjection: "a@b.com' OR '1'='1",
};
