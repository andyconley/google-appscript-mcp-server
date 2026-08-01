import { _tokenManager, SCOPES } from '../lib/oauth-helper.js';

/**
 * Make getAuthHeaders() succeed with NO real credentials or network: set dummy
 * client env and seed a non-expired token into the TokenManager cache (the same
 * singleton the client uses). Call once at module top in hermetic test files.
 */
export function seedAuth() {
  process.env.GOOGLE_APP_SCRIPT_API_CLIENT_ID = 'test-id';
  process.env.GOOGLE_APP_SCRIPT_API_CLIENT_SECRET = 'test-secret';
  _tokenManager._cache = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: Date.now() + 3600_000,
    token_type: 'Bearer',
    scope: SCOPES.join(' '),
    saved_at: new Date().toISOString()
  };
}

/**
 * Replace globalThis.fetch with a recording mock.
 * @param {Function|Object} handler - ({ url, init, callIndex }) => { status?, body?, statusText?, contentLength? }
 *   or a plain response object. `body` may be an object (JSON.stringify'd) or a string.
 * @returns {Function} the mock, with a `.calls` array of { url, method, headers, body }.
 */
export function installMockFetch(handler) {
  const calls = [];
  const mock = async (url, init = {}) => {
    const callIndex = calls.length;
    calls.push({
      url: url.toString(),
      method: init.method || 'GET',
      headers: init.headers || {},
      body: init.body
    });
    const r =
      (typeof handler === 'function' ? await handler({ url: url.toString(), init, callIndex }) : handler) ||
      {};
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: r.statusText || '',
      headers: { get: () => r.contentLength ?? null },
      text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {}))
    };
  };
  mock.calls = calls;
  globalThis.fetch = mock;
  return mock;
}

export const lastRequest = (mock) => mock.calls[mock.calls.length - 1];
