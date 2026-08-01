import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Get the content of a Google Apps Script project.
 *
 * @param {Object} args
 * @param {string} args.scriptId - The ID of the script project to retrieve content for.
 * @param {string} [args.versionNumber] - The version number of the script project.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} The content of the script project.
 */
const executeFunction = async ({ scriptId, versionNumber, fields }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/content`,
      query: { versionNumber, fields },
      label: 'SCRIPT_GET_CONTENT'
    });
  } catch (error) {
    return toToolError(error, { scriptId, versionNumber });
  }
};

/**
 * Tool configuration for getting the content of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_get_content',
      description: 'Get the content of a Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project to retrieve content for.'
          },
          versionNumber: {
            type: 'string',
            description: 'The version number of the script project.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };
