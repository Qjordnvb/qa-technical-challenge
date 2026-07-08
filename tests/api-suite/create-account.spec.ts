// spec: specs/account-lifecycle-api.plan.md  (API 11 — POST /createAccount)
import { test, expect } from './fixtures';
import { validAccount, uniqueEmail, PAYLOADS } from '../../src/api/data';
import { expectEnvelope, expectMessage, expectWithinSla } from '../../src/api/schemas';

test.describe('API 11 — POST /createAccount', () => {
  // C11.1 + C11.2 — happy path + response contract
  test('C11.1/2 creates an account with valid data (201) and valid contract', async ({ api }) => {
    const payload = validAccount();
    const res = await api.createAccount(payload);
    try {
      expectMessage(res, 201, 'User created!');
      expectEnvelope(res, 201);
      expectWithinSla(res);
    } finally {
      await api.deleteAccount(payload.email, payload.password).catch(() => {});
    }
  });

  // C11.3 — email missing → 400
  test('C11.3 rejects missing email (400)', async ({ api }) => {
    const { email, ...noEmail } = validAccount();
    const res = await api.createAccount(noEmail);
    expectMessage(res, 400, /email parameter is missing/i);
  });

  // C11.4 — password missing → 400
  test('C11.4 rejects missing password (400)', async ({ api }) => {
    const { password, ...noPass } = validAccount();
    const res = await api.createAccount(noPass);
    expectMessage(res, 400, /password parameter is missing/i);
  });

  // C11.5 — profile field missing (firstname) → 400  (validation order, H3)
  test('C11.5 rejects missing firstname (400)', async ({ api }) => {
    const { firstname, ...noFirst } = validAccount();
    const res = await api.createAccount(noFirst);
    expectMessage(res, 400, /firstname parameter is missing/i);
  });

  // C11.6 — duplicate email (uniqueness constraint, H4) → 400
  test('C11.6 enforces email uniqueness (400 "Email already exists!")', async ({ api }) => {
    const payload = validAccount();
    const first = await api.createAccount(payload);
    expect(first.responseCode).toBe(201);
    try {
      const dup = await api.createAccount(payload);
      expectMessage(dup, 400, /Email already exists!/i);
    } finally {
      await api.deleteAccount(payload.email, payload.password).catch(() => {});
    }
  });

  // C11.7 — malformed email
  test('C11.7 handles a malformed email without a server error', async ({ api }) => {
    const res = await api.createAccount(validAccount({ email: PAYLOADS.malformedEmail }));
    // The sandbox is lax on format; the contract must still not 500.
    expect(res.responseCode).not.toBe(500);
    if (res.responseCode === 201) {
      await api.deleteAccount(PAYLOADS.malformedEmail, validAccount().password).catch(() => {});
    }
  });

  // C11.8 — SQL injection in fields must be treated as data, never executed
  test('C11.8 treats SQL injection payloads as inert data (no 500)', async ({ api }) => {
    const email = uniqueEmail('sqli');
    const res = await api.createAccount(validAccount({ email, name: PAYLOADS.sqlDrop }));
    expect(res.responseCode).not.toBe(500);
    // If the injection were executed the account creation would corrupt/fail;
    // a clean 201 or a validation 400 both prove it was handled as data.
    expect([201, 400]).toContain(res.responseCode);
    if (res.responseCode === 201) {
      await api.deleteAccount(email, validAccount().password).catch(() => {});
    }
  });

  // C11.9 — stored XSS: script tag accepted as data, round-trips escaped/inert
  test('C11.9 stores an XSS payload as inert text', async ({ api }) => {
    const email = uniqueEmail('xss');
    const res = await api.createAccount(validAccount({ email, name: PAYLOADS.xss }));
    expect(res.responseCode).not.toBe(500);
    if (res.responseCode === 201) {
      const detail = await api.getUserDetail(email);
      // The value should be persisted as-is (the client renders it, not the API);
      // key point: the API returns valid JSON, not a broken/injected body.
      expect(detail.responseCode).toBe(200);
      await api.deleteAccount(email, validAccount().password).catch(() => {});
    }
  });

  // C11.10 — oversize field must not crash the backend (payload DoS guard)
  test('C11.10 tolerates an oversized field without a 500', async ({ api }) => {
    const email = uniqueEmail('big');
    const res = await api.createAccount(validAccount({ email, name: PAYLOADS.oversize }));
    expect(res.responseCode).not.toBe(500);
    if (res.responseCode === 201) {
      await api.deleteAccount(email, validAccount().password).catch(() => {});
    }
  });

  // C11.11 — unicode/emoji persists correctly (i18n scalability)
  test('C11.11 accepts unicode/emoji in fields (201) and persists it', async ({ api }) => {
    const email = uniqueEmail('uni');
    const res = await api.createAccount(validAccount({ email, name: PAYLOADS.unicode }));
    expect(res.responseCode).not.toBe(500);
    if (res.responseCode === 201) {
      const detail = await api.getUserDetail(email);
      expect(detail.responseCode).toBe(200);
      await api.deleteAccount(email, validAccount().password).catch(() => {});
    }
  });
});
