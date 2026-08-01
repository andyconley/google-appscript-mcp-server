import { toolPaths } from '../tools/paths.js';
import { logger } from './logger.js';

/**
 * Discovers and loads available tools from the tools directory.
 * @param {Object} [opts]
 * @param {boolean} [opts.bustCache=false] - Append a cache-busting query so ESM
 *   re-imports fresh module instances (used by reload_tools).
 * @returns {Promise<Array>} Array of tool objects
 */
export async function discoverTools({ bustCache = false } = {}) {
  logger.info('DISCOVERY', `Starting tool discovery for ${toolPaths.length} tool paths`);
  const devToolsEnabled = process.env.DEV_TOOLS === '1';
  const cacheBust = bustCache ? `?t=${Date.now()}` : '';

  const toolPromises = toolPaths.map(async (file) => {
    try {
      logger.debug('DISCOVERY', `Loading tool from: ${file}`);
      const module = await import(`../tools/${file}${cacheBust}`);

      if (!module.apiTool) {
        logger.warn('DISCOVERY', `Tool file missing apiTool export: ${file}`);
        return null;
      }

      // Dev-only management tools (auth_status, server_info, reload_tools) are
      // hidden unless DEV_TOOLS=1, so they aren't exposed in normal operation.
      if (module.apiTool.devOnly && !devToolsEnabled) {
        logger.debug('DISCOVERY', `Skipping dev-only tool (DEV_TOOLS!=1): ${file}`);
        return null;
      }

      const toolName = module.apiTool.definition?.function?.name;
      if (!toolName) {
        logger.warn('DISCOVERY', `Tool missing function name: ${file}`);
        return null;
      }

      logger.debug('DISCOVERY', `Successfully loaded tool: ${toolName}`, {
        file,
        toolName,
        description: module.apiTool.definition?.function?.description
      });

      // Note: request/response logging is handled once in the CallTool handler
      // (mcpServer.js). We intentionally do NOT wrap here to avoid double logging.
      return {
        ...module.apiTool,
        path: file
      };
    } catch (error) {
      logger.error('DISCOVERY', `Failed to load tool: ${file}`, {
        file,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      return null;
    }
  });

  const tools = (await Promise.all(toolPromises)).filter(Boolean);

  logger.info('DISCOVERY', `Tool discovery completed`, {
    totalPaths: toolPaths.length,
    successfullyLoaded: tools.length,
    failed: toolPaths.length - tools.length,
    toolNames: tools.map((t) => t.definition?.function?.name).filter(Boolean)
  });

  return tools;
}
