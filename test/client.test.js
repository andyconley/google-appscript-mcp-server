// Layer 3: shared client — URL building, encoding, error parsing, timeout, retry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedAuth, installMockFetch } from './helpers.js';

seedAuth();
const { callGoogleApi, enc, toToolError } = await import('../lib/appsScriptClient.js');

test('enc encodes path segments', () => {
  assert.equal(enc('a/b?c#d'), 'a%2Fb%3Fc%23d');
});

test('builds URL with query + prettyPrint, skips empty, parses JSON', async () => {
  const m = installMockFetch({ status: 200, body: { ok: 1 } });
  const r = await callGoogleApi({
    method: 'GET',
    url: 'https://script.googleapis.com/v1/projects/X',
    query: { fields: 'a', missing: undefined, blank: '' }
  });
  assert.deepEqual(r, { ok: 1 });
  assert.match(m.calls[0].url, /fields=a/);
  assert.match(m.calls[0].url, /prettyPrint=true/);
  assert.doesNotMatch(m.calls[0].url, /missing=|blank=/);
});

test('array query values become repeated params', async () => {
  const m = installMockFetch({ status: 200, body: {} });
  await callGoogleApi({ method: 'GET', url: 'https://x/y', query: { s: ['A', 'B'] } });
  assert.ok(m.calls[0].url.includes('s=A') && m.calls[0].url.includes('s=B'));
});

test('empty 200 body returns {}', async () => {
  installMockFetch({ status: 200, body: '' });
  assert.deepEqual(await callGoogleApi({ method: 'DELETE', url: 'https://x/y' }), {});
});

test('non-2xx throws clean API error; non-JSON body tolerated', async () => {
  installMockFetch({ status: 403, body: '<html>forbidden</html>' });
  await assert.rejects(() => callGoogleApi({ method: 'GET', url: 'https://x/y' }), /API Error \(403\)/);
});

test('parses Google error.message', async () => {
  installMockFetch({ status: 400, body: { error: { message: 'bad thing' } } });
  await assert.rejects(() => callGoogleApi({ method: 'GET', url: 'https://x/y' }), /bad thing/);
});

test('retries 429 for any method (incl. POST)', async () => {
  process.env.RETRY_BACKOFF_MS = '1';
  let n = 0;
  installMockFetch(() => (++n < 2 ? { status: 429 } : { status: 200, body: { ok: 1 } }));
  const r = await callGoogleApi({ method: 'POST', url: 'https://x/y', body: {} });
  assert.deepEqual(r, { ok: 1 });
  assert.equal(n, 2);
});

test('retries 5xx for GET but not for POST', async () => {
  process.env.RETRY_BACKOFF_MS = '1';
  let g = 0;
  installMockFetch(() => {
    g++;
    return { status: 500 };
  });
  await assert.rejects(() => callGoogleApi({ method: 'GET', url: 'https://x/y' }));
  assert.equal(g, 3, 'GET = initial + 2 retries');

  let p = 0;
  installMockFetch(() => {
    p++;
    return { status: 500 };
  });
  await assert.rejects(() => callGoogleApi({ method: 'POST', url: 'https://x/y', body: {} }));
  assert.equal(p, 1, 'POST not retried on 5xx');
});

test('a timeout (AbortSignal) surfaces as a clean "timed out" error', async () => {
  process.env.RETRY_BACKOFF_MS = '1';
  let n = 0;
  installMockFetch(() => {
    n++;
    const e = new Error('The operation was aborted');
    e.name = 'TimeoutError';
    throw e; // simulate the AbortSignal.timeout firing
  });
  await assert.rejects(() => callGoogleApi({ method: 'GET', url: 'https://x/y' }), /timed out/);
  assert.equal(n, 3, 'GET retries a timeout: initial + 2');
});

test('toToolError shape', () => {
  const e = toToolError(new Error('boom'), { scriptId: 's' });
  assert.equal(e.error, true);
  assert.equal(e.message, 'boom');
  assert.equal(e.details.scriptId, 's');
  assert.ok(e.rawError.name);
});
