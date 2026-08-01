import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { discoverTools } from '../../../lib/tools.js';
import { toToolError } from '../../../lib/appsScriptClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Report server runtime info: version, pid, uptime, transport, log level, and
 * the currently loaded tools. Dev/diagnostic tool.
 *
 * @returns {Promise<Object>} server info
 */
const executeFunction = async () => {
  try {
    let name = 'unknown';
    let version = 'unknown';
    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'));
      name = pkg.name;
      version = pkg.version;
    } catch {
      /* best effort */
    }

    const tools = await discoverTools();

    return {
      name,
      version,
      pid: process.pid,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      transport: process.argv.includes('--sse') ? 'sse' : 'stdio',
      devTools: process.env.DEV_TOOLS === '1',
      logLevel: process.env.LOG_LEVEL || 'info',
      toolCount: tools.length,
      toolNames: tools.map((t) => t.definition.function.name)
    };
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
      name: 'server_info',
      description:
        'Report MCP server version, pid, uptime, transport, and loaded tools. Dev/diagnostic tool.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
};

export { apiTool };
