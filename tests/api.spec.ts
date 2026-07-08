import { test, expect } from '@playwright/test';

/**
 * Sample REST API tests — adapt the base URL and endpoints live.
 * Uses a public demo API (jsonplaceholder) so it runs out of the box.
 *
 * Covers: happy path, response schema, and a negative case.
 */

const API = 'https://jsonplaceholder.typicode.com';

test.describe('Users API', () => {
  test('GET /users/1 returns the expected user (status + schema)', async ({ request }) => {
    const res = await request.get(`${API}/users/1`);

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      id: 1,
      name: expect.any(String),
      email: expect.stringContaining('@'),
    });
    expect(body).toHaveProperty('address.city');
  });

  test('GET /users/99999 handles a not-found resource', async ({ request }) => {
    const res = await request.get(`${API}/users/99999`);

    // Negative case: resource does not exist.
    expect(res.status()).toBe(404);
  });

  test('POST /posts creates a resource', async ({ request }) => {
    const payload = { title: 'qa', body: 'challenge', userId: 1 };
    const res = await request.post(`${API}/posts`, { data: payload });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject(payload);
    expect(body).toHaveProperty('id');
  });
});
