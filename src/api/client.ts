import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Typed client for the automationexercise.com account API.
 *
 * Contract quirk (H1): every endpoint answers HTTP 200; the *real* status code
 * travels inside the JSON body as `responseCode`. This client therefore never
 * asserts on the HTTP status — it parses the body and exposes `responseCode`,
 * `message`, and the elapsed time so specs can assert on the real contract.
 *
 * Wire format (H2): requests are `application/x-www-form-urlencoded` (form),
 * not JSON. Playwright's `form`/`params` options handle the encoding.
 */

export interface AccountPayload {
  name: string;
  email: string;
  password: string;
  title?: string;
  birth_date?: string;
  birth_month?: string;
  birth_year?: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  address1?: string;
  address2?: string;
  country?: string;
  zipcode?: string;
  state?: string;
  city?: string;
  mobile_number?: string;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  title: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  first_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  // NOTE: `password` must NOT appear here (H5) — asserted in schemas.ts.
}

/** Normalised result every client method returns. */
export interface ApiResult<T = unknown> {
  /** The real status from the JSON body (`responseCode`), not the HTTP status. */
  responseCode: number;
  /** Human-readable message when present. */
  message?: string;
  /** Full parsed JSON body. */
  body: Record<string, unknown> & { responseCode?: number; message?: string; user?: T };
  /** Raw Playwright response (for HTTP-level assertions if ever needed). */
  raw: APIResponse;
  /** Round-trip time in milliseconds (latency smoke — escalabilidad). */
  elapsedMs: number;
}

/** Turn a partial payload into a form record, dropping undefined values. */
function toForm(payload: Record<string, unknown>): Record<string, string> {
  const form: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== null) form[k] = String(v);
  }
  return form;
}

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private async wrap(exec: () => Promise<APIResponse>): Promise<ApiResult> {
    const start = Date.now();
    const raw = await exec();
    const elapsedMs = Date.now() - start;
    let body: Record<string, unknown> = {};
    try {
      body = (await raw.json()) as Record<string, unknown>;
    } catch {
      // Some error paths return HTML; keep body empty so specs can assert on it.
      body = { responseCode: raw.status(), message: await raw.text().catch(() => '') };
    }
    return {
      responseCode: Number(body.responseCode ?? raw.status()),
      message: body.message as string | undefined,
      body,
      raw,
      elapsedMs,
    };
  }

  /** API 11 — POST /createAccount */
  createAccount(payload: Partial<AccountPayload>): Promise<ApiResult> {
    return this.wrap(() =>
      this.request.post('/api/createAccount', { form: toForm(payload) }),
    );
  }

  /** API 14 — GET /getUserDetailByEmail?email= */
  getUserDetail(email?: string): Promise<ApiResult<UserDetail>> {
    const params = email === undefined ? undefined : { email };
    return this.wrap(() =>
      this.request.get('/api/getUserDetailByEmail', params ? { params } : undefined),
    ) as Promise<ApiResult<UserDetail>>;
  }

  /** API 13 — PUT /updateAccount */
  updateAccount(payload: Partial<AccountPayload>): Promise<ApiResult> {
    return this.wrap(() =>
      this.request.put('/api/updateAccount', { form: toForm(payload) }),
    );
  }

  /** API 12 — DELETE /deleteAccount */
  deleteAccount(email?: string, password?: string): Promise<ApiResult> {
    return this.wrap(() =>
      this.request.delete('/api/deleteAccount', { form: toForm({ email, password }) }),
    );
  }

  /** API 7 — POST /verifyLogin (support endpoint for integration checks) */
  verifyLogin(email?: string, password?: string): Promise<ApiResult> {
    return this.wrap(() =>
      this.request.post('/api/verifyLogin', { form: toForm({ email, password }) }),
    );
  }
}
