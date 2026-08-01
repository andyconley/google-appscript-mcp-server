import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Get metadata of a Google Apps Script project.
 *
 * @param {Object} args
 * @param {string} args.scriptId - The ID of the script project to retrieve.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} The project metadata.
 */
const executeFunction = async ({ scriptId, fields }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}`,
      query: { fields },
      label: 'PROJECTS_GET'
    });
  } catch (error) {
    return toToolError(error, { scriptId });
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_get',
      description:
        'Get metadata of a Google Apps Script project. OAuth authentication is handled automatically.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project to retrieve.'
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
