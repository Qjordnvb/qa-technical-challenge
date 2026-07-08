// spec: specs/account-lifecycle-api.plan.md  (API 12 — DELETE /deleteAccount)
import { test, expect } from './fixtures';
import { validAccount, uniqueEmail } from '../../src/api/data';
import { expectMessage, expectWithinSla } from '../../src/api/schemas';

test.describe('API 12 — DELETE /deleteAccount', () => {
  // C12.1 + C12.2 — happy path + contract (own account so lifecycle is explicit)
  test('C12.1/2 deletes an account with valid credentials (200 "Account deleted!")', async ({ api }) => {
    const acc = validAccount();
    expect((await api.createAccount(acc)).responseCode).toBe(201);

    const res = await api.deleteAccount(acc.email, acc.password);
    expectMessage(res, 200, 'Account deleted!');
    expectWithinSla(res);
  });

  // C12.3 — after delete the account no longer exists (GET 404 + login 404) → integration
  test('C12.3 after delete the account is gone (getUserDetail 404, verifyLogin 404)', async ({ api }) => {
    const acc = validAccount();
    expect((await api.createAccount(acc)).responseCode).toBe(201);
    expect((await api.deleteAccount(acc.email, acc.password)).responseCode).toBe(200);

    const detail = await api.getUserDetail(acc.email);
    expect(detail.responseCode).toBe(404);
    const login = await api.verifyLogin(acc.email, acc.password);
    expect(login.responseCode).toBe(404);
  });

  // C12.4 — delete a non-existent account → 404
  test('C12.4 returns 404 deleting a non-existent account', async ({ api }) => {
    const res = await api.deleteAccount(uniqueEmail('ghost'), 'whatever');
    expectMessage(res, 404, /Account not found/i);
  });

  // C12.5 — wrong password (valid email) must NOT delete and must not leak existence (H6)
  test('C12.5 refuses to delete with a wrong password (404, account survives)', async ({ api }) => {
    const acc = validAccount();
    expect((await api.createAccount(acc)).responseCode).toBe(201);
    try {
      const res = await api.deleteAccount(acc.email, 'WRONG_password_123');
      expectMessage(res, 404, /Account not found/i);
      // The account must still exist afterwards.
      const stillThere = await api.getUserDetail(acc.email);
      expect(stillThere.responseCode, 'account must survive a bad-password delete').toBe(200);
    } finally {
      await api.deleteAccount(acc.email, acc.password).catch(() => {});
    }
  });

  // C12.6 — double delete (idempotency): 2nd attempt 404, never 500
  test('C12.6 double delete is idempotent (2nd attempt 404, no 500)', async ({ api }) => {
    const acc = validAccount();
    expect((await api.createAccount(acc)).responseCode).toBe(201);
    expect((await api.deleteAccount(acc.email, acc.password)).responseCode).toBe(200);

    const second = await api.deleteAccount(acc.email, acc.password);
    expect(second.responseCode).not.toBe(500);
    expect(second.responseCode).toBe(404);
  });

  // C12.7 — missing params → controlled 400/404, never 500
  test('C12.7 handles missing parameters without a 500', async ({ api }) => {
    const res = await api.deleteAccount(uniqueEmail('nopass'), undefined);
    expect(res.responseCode).not.toBe(500);
    expect([400, 404]).toContain(res.responseCode);
  });
});
