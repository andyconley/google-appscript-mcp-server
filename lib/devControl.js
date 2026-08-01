/**
 * Dev-mode control surface. Lets the reload_tools management tool trigger a
 * live re-discovery of tool modules without restarting the process.
 *
 * mcpServer.js registers a handler (which mutates its live tool registry in
 * place); the reload_tools tool calls runReload(). Kept in its own module so
 * tools can import it without importing mcpServer.js.
 */

let reloadHandler = null;

export function setReloadHandler(fn) {
  reloadHandler = fn;
}

export async function runReload() {
  if (typeof reloadHandler !== 'function') {
    throw new Error('Tool reload is not available (server did not register a reload handler).');
  }
  return reloadHandler();
}
