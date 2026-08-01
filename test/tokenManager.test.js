// Layer 3: TokenManager — single-flight refresh, in-memory cache, expiry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TokenManager } from '../lib/tokenManager.js';

test('single-flight: concurrent refreshes coalesce onto one', async () => {
  const tm = new TokenManager();
  let n = 0;
  tm.refreshAccessToken = async () => {
    n++;
    await new Promise((r) => setTimeout(r, 20));
    return { access_token: 't' + n };
  };

  const results = await Promise.all([1, 2, 3, 4, 5].map(() => tm._refreshSingleFlight('id', 'sec')));
  assert.equal(n, 1, 'only one underlying refresh');
  assert.ok(results.every((r) => r.access_token === results[0].access_token), 'all callers get the same token');

  await tm._refreshSingleFlight('id', 'sec'); // promise settled -> a new refresh runs
  assert.equal(n, 2);
});

test('cache: loadTokens returns the cached object without re-reading', () => {
  const tm = new TokenManager();
  tm._cache = { access_token: 'x', expires_at: Date.now() + 1000 };
  assert.equal(tm.loadTokens(), tm.loadTokens());
  assert.equal(tm.loadTokens().access_token, 'x');
});

test('isTokenExpired honors the buffer', () => {
  const tm = new TokenManager();
  assert.equal(tm.isTokenExpired(null), true);
  assert.equal(tm.isTokenExpired({ expires_at: Date.now() - 1000 }), true);
  assert.equal(tm.isTokenExpired({ expires_at: Date.now() + 1_000_000 }), false);
});
