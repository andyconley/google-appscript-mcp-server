// Layer 1: schema / contract tests — every tool loads with a valid, unique schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DEV_TOOLS = '1'; // include the dev tools in the count
const { discoverTools } = await import('../lib/tools.js');
const { toolPaths } = await import('../tools/paths.js');

test('every registered tool loads (no silent load failures)', async () => {
  const tools = await discoverTools();
  // With DEV_TOOLS=1 every path must load; a mismatch means a tool failed to
  // import (e.g. a syntax error) and was silently dropped.
  assert.equal(tools.length, toolPaths.length,
    `loaded ${tools.length} of ${toolPaths.length} tools — one failed to import`);
});

test('all tools load with valid, unique schemas', async () => {
  const tools = await discoverTools();
  assert.ok(tools.length >= 20, `expected >= 20 tools, got ${tools.length}`);

  const names = new Set();
  for (const t of tools) {
    const fn = t.definition?.function;
    assert.ok(fn?.name, 'tool has a function name');
    assert.ok(!names.has(fn.name), `duplicate tool name: ${fn.name}`);
    names.add(fn.name);

    assert.equal(t.definition.type, 'function', `${fn.name}: definition.type`);
    assert.equal(fn.parameters?.type, 'object', `${fn.name}: parameters.type`);
    assert.ok(fn.parameters.properties, `${fn.name}: has properties`);

    const required = fn.parameters.required ?? [];
    assert.ok(Array.isArray(required), `${fn.name}: required is an array`);
    for (const req of required) {
      assert.ok(req in fn.parameters.properties, `${fn.name}: required '${req}' not in properties`);
    }
    assert.equal(typeof t.function, 'function', `${fn.name}: has an executable function`);
  }
});

test('dev tools are hidden without DEV_TOOLS=1', async () => {
  delete process.env.DEV_TOOLS;
  const tools = await discoverTools();
  const names = tools.map((t) => t.definition.function.name);
  for (const dev of ['auth_status', 'server_info', 'reload_tools']) {
    assert.ok(!names.includes(dev), `${dev} should be hidden`);
  }
  process.env.DEV_TOOLS = '1';
});
