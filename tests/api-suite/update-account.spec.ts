// spec: specs/account-lifecycle-api.plan.md  (API 13 — PUT /updateAccount)
import { test, expect } from './fixtures';
import { validAccount, updatedAccount, uniqueEmail, PAYLOADS } from '../../src/api/data';
import { expectMessage, expectWithinSla } from '../../src/api/schemas';

test.describe('API 13 — PUT /updateAccount', () => {
  // C13.1 + C13.2 — happy path + contract
  test('C13.1/2 updates an existing account (200 "User updated!")', async ({ api, provisionedUser }) => {
    const res = await api.updateAccount(updatedAccount(provisionedUser.email, provisionedUser.password));
    expectMessage(res, 200, 'User updated!');
    expectWithinSla(res);
  });

  // C13.3 — the update actually persists (verified via GET) → integration
  test('C13.3 persists the updated values (verified via getUserDetail)', async ({ api, provisionedUser }) => {
    const changes = updatedAccount(provisionedUser.email, provisionedUser.password);
    const upd = await api.updateAccount(changes);
    expect(upd.responseCode).toBe(200);

    const detail = await api.getUserDetail(provisionedUser.email);
    expect(detail.responseCode).toBe(200);
    const user = detail.body.user as unknown as Record<string, unknown>;
    expect(user.name).toBe(changes.name);
    expect(user.city).toBe(changes.city);
    expect(user.first_name).toBe(changes.firstname);
  });

  // C13.4 — missing email → 400
  test('C13.4 rejects update without email (400)', async ({ api }) => {
    const { email, ...noEmail } = validAccount();
    const res = await api.updateAccount(noEmail);
    expectMessage(res, 400, /email parameter is missing/i);
  });

  // C13.5 — update a non-existent account → controlled error, never 500
  test('C13.5 handles updating a non-existent account without a 500', async ({ api }) => {
    const ghost = validAccount({ email: uniqueEmail('noone') });
    const res = await api.updateAccount(ghost);
    expect(res.responseCode).not.toBe(500);
  });

  // C13.6 — wrong password must NOT update another user's data (auth on write)
  test('C13.6 refuses to update with a wrong password (data unchanged)', async ({ api, provisionedUser }) => {
    const res = await api.updateAccount(
      validAccount({
        email: provisionedUser.email,
        password: 'WRONG_password_123',
        name: 'HACKED',
      }),
    );
    expectMessage(res, 404, /Account not found/i);
    // The original data must be intact.
    const detail = await api.getUserDetail(provisionedUser.email);
    expect(detail.responseCode).toBe(200);
    expect((detail.body.user as { name?: string }).name).toBe(provisionedUser.payload.name);
  });

  // C13.7 — oversize / injection in update fields must not 500 (robustness)
  test('C13.7 tolerates injection/oversize in update fields (no 500)', async ({ api, provisionedUser }) => {
    const res = await api.updateAccount(
      validAccount({
        email: provisionedUser.email,
        password: provisionedUser.password,
        name: PAYLOADS.sqlDrop,
        address1: PAYLOADS.oversize,
      }),
    );
    expect(res.responseCode).not.toBe(500);
  });
});
