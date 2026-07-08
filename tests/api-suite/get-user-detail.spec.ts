// spec: specs/account-lifecycle-api.plan.md  (API 14 — GET /getUserDetailByEmail)
import { test, expect } from './fixtures';
import { uniqueEmail, PAYLOADS } from '../../src/api/data';
import { expectUserDetailContract, expectMessage, expectWithinSla } from '../../src/api/schemas';

test.describe('API 14 — GET /getUserDetailByEmail', () => {
  // C14.1 + C14.2 — existing user → 200 + full contract + NO password (H5)
  test('C14.1/2 returns the user detail contract without exposing password', async ({ api, provisionedUser }) => {
    const res = await api.getUserDetail(provisionedUser.email);
    expectUserDetailContract(res);
    expect(res.body.user).toMatchObject({ email: provisionedUser.email });
    expectWithinSla(res);
  });

  // C14.3 — non-existent email → 404
  test('C14.3 returns 404 for a non-existent email', async ({ api }) => {
    const res = await api.getUserDetail(uniqueEmail('ghost'));
    expectMessage(res, 404, /Account not found with this email/i);
  });

  // C14.4 — missing email param → 400
  test('C14.4 returns 400 when the email parameter is missing', async ({ api }) => {
    const res = await api.getUserDetail(undefined);
    expectMessage(res, 400, /email parameter is missing/i);
  });

  // C14.5 — malformed email → controlled error, never 500
  test('C14.5 handles a malformed email without a 500', async ({ api }) => {
    const res = await api.getUserDetail('@@@');
    expect(res.responseCode).not.toBe(500);
    expect([400, 404]).toContain(res.responseCode);
  });

  // C14.6 — SQL injection in email must not leak data or 500 (no auth bypass)
  test('C14.6 does not leak data or error on SQL injection in email', async ({ api }) => {
    const res = await api.getUserDetail(PAYLOADS.emailInjection);
    expect(res.responseCode).not.toBe(500);
    // Must NOT return a user object for an injected predicate.
    expect(res.body.user, 'injection must not return a user').toBeFalsy();
    expect([400, 404]).toContain(res.responseCode);
  });
});
