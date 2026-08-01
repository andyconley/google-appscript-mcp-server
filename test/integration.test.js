// Layer 4: opt-in integration tests against the LIVE Google API.
// Requires a real, authorized token (run `node oauth-setup.js` first) and:
//   RUN_INTEGRATION=1  INTEGRATION_SCRIPT_ID=<a scriptId you can read>
// Skipped otherwise (so `npm test` stays hermetic). See README > Testing.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const enabled = process.env.RUN_INTEGRATION === '1' && !!process.env.INTEGRATION_SCRIPT_ID;
const skip = enabled ? false : 'set RUN_INTEGRATION=1 and INTEGRATION_SCRIPT_ID to run';
const SCRIPT_ID = process.env.INTEGRATION_SCRIPT_ID;
const DIR = '../tools/google-app-script-api/apps-script-api/';

test('live: get project content returns files', { skip }, async () => {
  const { apiTool } = await import(DIR + 'script-projects-get-content.js');
  const r = await apiTool.function({ scriptId: SCRIPT_ID });
  assert.ok(!r.error, r.message);
  assert.ok(Array.isArray(r.files) && r.files.length > 0, 'has files');
});

test('live: list deployments', { skip }, async () => {
  const { apiTool } = await import(DIR + 'script-projects-deployments-list.js');
  const r = await apiTool.function({ scriptId: SCRIPT_ID });
  assert.ok(!r.error, r.message);
});

test('live: auth_status reports granted scopes', { skip }, async () => {
  const { apiTool } = await import(DIR + 'dev-auth-status.js');
  const r = await apiTool.function();
  assert.ok(Array.isArray(r.grantedScopes), 'grantedScopes is an array');
  assert.ok(r.hasTokens, 'has stored tokens');
});
