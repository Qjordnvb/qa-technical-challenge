// spec: specs/account-lifecycle-api.plan.md  (§5 Integration — INT.1/2/3)
import { test, expect } from './fixtures';
import { validAccount, updatedAccount } from '../../src/api/data';
import { expectUserDetailContract, expectWithinSla } from '../../src/api/schemas';

test.describe('Integration — full account CRUD lifecycle', () => {
  // INT.1 — create → login → read → update → re-read → delete → verify gone.
  // Also covers INT.3 (latency smoke on every hop).
  test('INT.1/3 create→login→read→update→read→delete→verify, each hop within SLA', async ({ api }) => {
    const acc = validAccount();

    // 1. create
    const created = await api.createAccount(acc);
    expect(created.responseCode, 'create').toBe(201);
    expectWithinSla(created);

    // 2. verifyLogin
    const login = await api.verifyLogin(acc.email, acc.password);
    expect(login.responseCode, 'login after create').toBe(200);
    expectWithinSla(login);

    // 3. read → data matches what we created
    const detail1 = await api.getUserDetail(acc.email);
    expectUserDetailContract(detail1);
    expect(detail1.body.user).toMatchObject({
      email: acc.email,
      name: acc.name,
      city: acc.city,
    });
    expectWithinSla(detail1);

    // 4. update
    const changes = updatedAccount(acc.email, acc.password);
    const updated = await api.updateAccount(changes);
    expect(updated.responseCode, 'update').toBe(200);
    expectWithinSla(updated);

    // 5. re-read → reflects the update (state consistency)
    const detail2 = await api.getUserDetail(acc.email);
    expect(detail2.responseCode).toBe(200);
    expect(detail2.body.user).toMatchObject({
      name: changes.name,
      city: changes.city,
      first_name: changes.firstname,
    });

    // 6. delete
    const deleted = await api.deleteAccount(acc.email, acc.password);
    expect(deleted.responseCode, 'delete').toBe(200);
    expectWithinSla(deleted);

    // 7. verify gone — read 404 & login 404
    expect((await api.getUserDetail(acc.email)).responseCode, 'read after delete').toBe(404);
    expect((await api.verifyLogin(acc.email, acc.password)).responseCode, 'login after delete').toBe(404);
  });

  // INT.2 — a deleted account cannot be resurrected by an update.
  test('INT.2 update does not resurrect a deleted account', async ({ api }) => {
    const acc = validAccount();
    expect((await api.createAccount(acc)).responseCode).toBe(201);
    expect((await api.deleteAccount(acc.email, acc.password)).responseCode).toBe(200);

    // Attempt to update the now-deleted account.
    const res = await api.updateAccount(updatedAccount(acc.email, acc.password));
    expect(res.responseCode, 'update must not 500').not.toBe(500);

    // The account must remain absent.
    const detail = await api.getUserDetail(acc.email);
    expect(detail.responseCode, 'account must stay deleted').toBe(404);
  });
});
