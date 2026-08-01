import { runReload } from '../../../lib/devControl.js';
import { toToolError } from '../../../lib/appsScriptClient.js';

/**
 * Hot-reload tool modules without restarting the process. Re-discovers and
 * re-imports every tool file (cache-busted) and swaps them into the live
 * registry, so edits to tool files take effect immediately in the running
 * session.
 *
 * SCOPE: reloads files under tools/ only. Changes to core modules (mcpServer.js,
 * lib/*, scopes) still require a full process restart + client reconnect, since
 * those are already imported into the running module graph.
 *
 * @returns {Promise<Object>} { reloaded, toolCount, toolNames }
 */
const executeFunction = async () => {
  try {
    const result = await runReload();
    return { reloaded: true, ...result };
  } catch (error) {
    return toToolError(error, {});
  }
};

const apiTool = {
  devOnly: true,
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'reload_tools',
      description:
        'Hot-reload tool modules (files under tools/) into the running server without a restart. Core changes (mcpServer.js, lib/*) still need a restart. Dev tool.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
};

export { apiTool };
