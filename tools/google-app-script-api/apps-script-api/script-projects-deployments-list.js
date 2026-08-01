import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * List the deployments of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the deployment listing.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {number} [args.pageSize=50] - The number of deployments to return per page.
 * @param {string} [args.pageToken] - Token for pagination.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} - The deployments.
 */
const executeFunction = async ({ scriptId, pageSize = 50, pageToken, fields }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments`,
      query: { pageSize, pageToken, fields },
      label: 'DEPLOYMENT_LIST'
    });
  } catch (error) {
    return toToolError(error, { scriptId });
  }
};

/**
 * Tool configuration for listing deployments of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_list',
      description: 'Lists the deployments of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          pageSize: {
            type: 'integer',
            description: 'The number of deployments to return per page.'
          },
          pageToken: {
            type: 'string',
            description: 'Token for pagination.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
          },
          prettyPrint: {
            type: 'boolean',
            description: 'Returns response with indentations and line breaks.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };