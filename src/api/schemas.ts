import { expect } from '@playwright/test';
import type { ApiResult, UserDetail } from './client';

/**
 * Contract validators. Dependency-free (no zod) so the suite installs clean.
 * Each helper asserts the *shape* of a response so a backend contract change
 * fails the test loudly.
 */

/** Every response must carry a numeric responseCode and (usually) a message. */
export function expectEnvelope(res: ApiResult, expectedCode: number) {
  expect(res.body, 'response body should be JSON').toBeTruthy();
  expect(res.responseCode, `responseCode should be ${expectedCode}`).toBe(expectedCode);
  expect(typeof res.responseCode).toBe('number');
}

/** Assert responseCode + that message matches an expected substring/regex. */
export function expectMessage(res: ApiResult, expectedCode: number, message: string | RegExp) {
  expectEnvelope(res, expectedCode);
  expect(res.message, 'message field should be present').toBeDefined();
  if (message instanceof RegExp) {
    expect(res.message ?? '').toMatch(message);
  } else {
    expect(res.message ?? '').toContain(message);
  }
}

/** Fields the `user` object must expose in getUserDetailByEmail. */
export const USER_DETAIL_FIELDS: (keyof UserDetail)[] = [
  'id', 'name', 'email', 'title', 'birth_day', 'birth_month', 'birth_year',
  'first_name', 'last_name', 'company', 'address1', 'address2',
  'country', 'state', 'city', 'zipcode',
];

/**
 * Validate the full user-detail contract:
 *  - responseCode 200
 *  - `user` present with all expected fields and correct primitive types
 *  - SECURITY (H5): `password` must NOT be exposed anywhere in the payload.
 */
export function expectUserDetailContract(res: ApiResult<UserDetail>) {
  expectEnvelope(res, 200);
  const user = res.body.user as Record<string, unknown> | undefined;
  expect(user, 'user object should be present').toBeTruthy();

  for (const field of USER_DETAIL_FIELDS) {
    expect(user, `user.${field} should exist`).toHaveProperty(field);
  }
  expect(typeof user!.id, 'user.id should be a number').toBe('number');
  expect(typeof user!.email, 'user.email should be a string').toBe('string');

  // Security: credential must never round-trip back to the client.
  expect(user, 'user must NOT expose password').not.toHaveProperty('password');
  const serialized = JSON.stringify(res.body).toLowerCase();
  expect(serialized.includes('"password"'), 'no password key anywhere in body').toBe(false);
}

/** Latency smoke (escalabilidad): a single call should stay under the SLA. */
export function expectWithinSla(res: ApiResult, maxMs = 5000) {
  expect(
    res.elapsedMs,
    `response took ${res.elapsedMs}ms, SLA is ${maxMs}ms`,
  ).toBeLessThan(maxMs);
}
