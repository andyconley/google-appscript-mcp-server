// Layer 2: per-tool request shaping — assert each tool builds the right
// method/URL(encoded ids)/query/body and shapes errors. Fully hermetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedAuth, installMockFetch, lastRequest } from './helpers.js';

seedAuth();

const DIR = new URL('../tools/google-app-script-api/apps-script-api/', import.meta.url);
const load = async (file) => (await import(new URL(file, DIR))).apiTool;

// Run a tool against a stub 200 response; return the captured request + calls.
async function runTool(file, args, respBody = {}) {
  const m = installMockFetch({ status: 200, body: respBody });
  const tool = await load(file);
  const result = await tool.function(args);
  return { req: lastRequest(m), result, calls: m.calls };
}

test('get: GET, encodes scriptId into the path', async () => {
  const { req } = await runTool('script-projects-get.js', { scriptId: 'a/b?c' });
  assert.equal(req.method, 'GET');
  assert.match(req.url, /\/v1\/projects\/a%2Fb%3Fc(\?|$)/);
});

test('get_content: GET .../content, passes versionNumber', async () => {
  const { req } = await runTool('script-projects-get-content.js', { scriptId: 'S', versionNumber: '3' });
  assert.equal(req.method, 'GET');
  assert.match(req.url, /\/projects\/S\/content/);
  assert.match(req.url, /versionNumber=3/);
});

test('update_content: PUT with { files } body (no scriptId in body)', async () => {
  const files = [{ name: 'Code', type: 'SERVER_JS', source: 'x' }];
  const { req } = await runTool('script-projects-update-content.js', { scriptId: 'S', files });
  assert.equal(req.method, 'PUT');
  assert.match(req.url, /\/projects\/S\/content/);
  assert.deepEqual(JSON.parse(req.body), { files });
});

test('versions_create: POST body {description} or {}', async () => {
  let { req } = await runTool('script-projects-versions-create.js', { scriptId: 'S', description: 'd' });
  assert.deepEqual(JSON.parse(req.body), { description: 'd' });
  ({ req } = await runTool('script-projects-versions-create.js', { scriptId: 'S' }));
  assert.deepEqual(JSON.parse(req.body), {});
});

test('deployments_create: POST body {manifestFileName, versionNumber, description}', async () => {
  const { req } = await runTool('script-projects-deployments-create.js', {
    scriptId: 'S',
    manifestFileName: 'appsscript',
    versionNumber: 2,
    description: 'd'
  });
  assert.equal(req.method, 'POST');
  assert.match(req.url, /\/projects\/S\/deployments/);
  assert.deepEqual(JSON.parse(req.body), {
    manifestFileName: 'appsscript',
    versionNumber: 2,
    description: 'd'
  });
});

test('deployments_update: omits versionNumber => HEAD; encodes ids', async () => {
  const { req } = await runTool('script-projects-deployments-update.js', {
    scriptId: 'S x',
    deploymentId: 'D/1',
    deploymentConfig: { manifestFileName: 'appsscript' }
  });
  assert.equal(req.method, 'PUT');
  assert.match(req.url, /\/deployments\/D%2F1/);
  const body = JSON.parse(req.body);
  assert.ok(!('versionNumber' in body.deploymentConfig), 'versionNumber omitted -> HEAD tracking');
});

test('deployments_update: keeps a numeric versionNumber', async () => {
  const { req } = await runTool('script-projects-deployments-update.js', {
    scriptId: 'S',
    deploymentId: 'D',
    deploymentConfig: { manifestFileName: 'appsscript', versionNumber: 5 }
  });
  assert.equal(JSON.parse(req.body).deploymentConfig.versionNumber, 5);
});

test('deployments_delete: DELETE with encoded ids', async () => {
  const { req } = await runTool('script-projects-deployments-delete.js', {
    scriptId: 'S',
    deploymentId: 'D e'
  });
  assert.equal(req.method, 'DELETE');
  assert.match(req.url, /\/deployments\/D%20e/);
});

test('scripts_run: POST :run with { function, parameters, devMode }', async () => {
  const { req } = await runTool('script-scripts-run.js', {
    scriptId: 'S',
    functionName: 'foo',
    parameters: [1, 'a'],
    devMode: true
  });
  assert.match(req.url, /\/scripts\/S:run/);
  assert.deepEqual(JSON.parse(req.body), { function: 'foo', parameters: [1, 'a'], devMode: true });
});

test('create: POST /v1/projects, body { title, parentId? }', async () => {
  let { req } = await runTool('script-projects-create.js', { title: 'T' });
  assert.match(req.url, /\/v1\/projects(\?|$)/);
  assert.deepEqual(JSON.parse(req.body), { title: 'T' });
  ({ req } = await runTool('script-projects-create.js', { title: 'T', parentId: 'P' }));
  assert.deepEqual(JSON.parse(req.body), { title: 'T', parentId: 'P' });
});

test('recent_executions: onlyFailures adds status filters', async () => {
  const { req } = await runTool(
    'script-recent-executions.js',
    { scriptId: 'S', onlyFailures: true },
    { processes: [] }
  );
  assert.match(req.url, /processes:listScriptProcesses/);
  assert.match(decodeURIComponent(req.url), /scriptProcessFilter.statuses=FAILED/);
});

test('missing required arg => tool error, and NO request is made', async () => {
  const m = installMockFetch({ status: 200, body: {} });
  const tool = await load('script-projects-get.js');
  const r = await tool.function({}); // no scriptId
  assert.equal(r.error, true);
  assert.match(r.message, /scriptId is required/);
  assert.equal(m.calls.length, 0, 'no HTTP request for an invalid call');
});

test('API failure => standard { error: true } shape', async () => {
  installMockFetch({ status: 404, body: { error: { message: 'not found' } } });
  const tool = await load('script-projects-get.js');
  const r = await tool.function({ scriptId: 'S' });
  assert.equal(r.error, true);
  assert.match(r.message, /404|not found/);
});

test('deployments_get / deployments_list: GET, encoded ids', async () => {
  let { req } = await runTool('script-projects-deployments-get.js', { scriptId: 'S', deploymentId: 'D/1' });
  assert.equal(req.method, 'GET');
  assert.match(req.url, /\/deployments\/D%2F1(\?|$)/);
  ({ req } = await runTool('script-projects-deployments-list.js', { scriptId: 'S', pageSize: 5 }));
  assert.match(req.url, /\/projects\/S\/deployments\?/);
  assert.match(req.url, /pageSize=5/);
});

test('versions_get / versions_list: GET with encoded ids and paging', async () => {
  let { req } = await runTool('script-projects-versions-get.js', { scriptId: 'S', versionNumber: '2' });
  assert.match(req.url, /\/versions\/2(\?|$)/);
  ({ req } = await runTool('script-projects-versions-list.js', { scriptId: 'S', pageToken: 'tok' }));
  assert.match(req.url, /\/projects\/S\/versions\?/);
  assert.match(req.url, /pageToken=tok/);
});

test('get_metrics: GET /metrics with granularity + deployment filter', async () => {
  const { req } = await runTool('script-projects-get-metrics.js', {
    scriptId: 'S',
    metricsGranularity: 'DAILY',
    deploymentId: 'D'
  });
  assert.match(req.url, /\/projects\/S\/metrics/);
  assert.match(req.url, /metricsGranularity=DAILY/);
  assert.match(decodeURIComponent(req.url), /metricsFilter.deploymentId=D/);
});

test('get_web_app_url: extracts /exec url + access from deployments', async () => {
  const deployment = {
    deploymentId: 'D',
    deploymentConfig: { versionNumber: 5 },
    entryPoints: [
      {
        entryPointType: 'WEB_APP',
        webApp: { url: 'https://x/exec', entryPointConfig: { access: 'DOMAIN', executeAs: 'USER_DEPLOYING' } }
      }
    ]
  };
  const { result } = await runTool(
    'script-projects-get-web-app-url.js',
    { scriptId: 'S' },
    { deployments: [deployment] }
  );
  assert.equal(result.webApps.length, 1);
  assert.equal(result.webApps[0].url, 'https://x/exec');
  assert.equal(result.webApps[0].access, 'DOMAIN');
});

test('list_script_projects: Drive files.list with mimeType + name filter', async () => {
  const { req, result } = await runTool(
    'drive-list-script-projects.js',
    { nameContains: 'sprint' },
    { files: [{ id: 'abc', name: 'Sprint', modifiedTime: 't', owners: [{ emailAddress: 'me@x' }] }] }
  );
  // URLSearchParams encodes spaces as '+', which decodeURIComponent leaves as-is.
  const q = decodeURIComponent(req.url.replace(/\+/g, ' '));
  assert.match(req.url, /drive\/v3\/files/);
  assert.match(q, /mimeType='application\/vnd\.google-apps\.script'/);
  assert.match(q, /name contains 'sprint'/);
  assert.deepEqual(result.scripts[0], { scriptId: 'abc', name: 'Sprint', modifiedTime: 't', owner: 'me@x' });
});

test('publish_web_app: create version then repoint deployment (URL stays)', async () => {
  const m = installMockFetch(({ url, init }) => {
    if (init.method === 'POST' && /\/versions$/.test(url.split('?')[0]))
      return { status: 200, body: { versionNumber: 7 } };
    if (init.method === 'PUT' && /\/deployments\//.test(url)) {
      return {
        status: 200,
        body: {
          deploymentId: 'D',
          deploymentConfig: { versionNumber: 7 },
          entryPoints: [{ entryPointType: 'WEB_APP', webApp: { url: 'https://x/exec' } }]
        }
      };
    }
    return { status: 200, body: {} };
  });
  const tool = await load('script-projects-publish-web-app.js');
  const r = await tool.function({ scriptId: 'S', deploymentId: 'D' });
  assert.equal(r.error, undefined);
  assert.equal(r.versionNumber, 7);
  assert.equal(r.url, 'https://x/exec');
  // made a versions POST and a deployments PUT (no content update since no files)
  assert.ok(m.calls.some((c) => c.method === 'POST' && /\/versions/.test(c.url)));
  assert.ok(m.calls.some((c) => c.method === 'PUT' && /\/deployments\//.test(c.url)));
  assert.ok(!m.calls.some((c) => /\/content/.test(c.url)), 'no content update without files');
});
