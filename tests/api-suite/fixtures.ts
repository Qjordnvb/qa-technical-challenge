import { test as base, expect } from '@playwright/test';
import { ApiClient, type AccountPayload } from '../../src/api/client';
import { validAccount } from '../../src/api/data';

/** A user created for a single test, deleted automatically in teardown. */
export interface ProvisionedUser {
  email: string;
  password: string;
  payload: AccountPayload;
}

interface ApiFixtures {
  api: ApiClient;
  /** Auto-provisioned account: created before the test, deleted after. */
  provisionedUser: ProvisionedUser;
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  provisionedUser: async ({ api }, use) => {
    const payload = validAccount();
    const created = await api.createAccount(payload);
    expect(
      created.responseCode,
      `setup: account must be created (got ${created.responseCode}: ${created.message})`,
    ).toBe(201);

    let deleted = false;
    try {
      await use({ email: payload.email, password: payload.password, payload });
    } finally {
      // Teardown: always clean up the sandbox, even if the test failed.
      if (!deleted) {
        await api.deleteAccount(payload.email, payload.password).catch(() => {});
        deleted = true;
      }
    }
  },
});

export { expect };
