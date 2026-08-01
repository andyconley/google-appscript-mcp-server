import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Create a new version of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for creating a new version.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} [args.description] - A description for the new version.
 * @returns {Promise<Object>} - The created version.
 */
const executeFunction = async ({ scriptId, description }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'POST',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/versions`,
      body: description ? { description } : {},
      label: 'VERSION_CREATE'
    });
  } catch (error) {
    return toToolError(error, { scriptId, description });
  }
};

/**
 * Tool configuration for creating a new version of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_versions_create',
      description: 'Creates a new version of a Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          description: {
            type: 'string',
            description: 'A description for the new version.'
          }
        },
        required: ['scriptId', 'description']
      }
    }
  }
};

export { apiTool };
