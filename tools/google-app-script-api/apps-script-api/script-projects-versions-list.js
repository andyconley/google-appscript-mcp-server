import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * List the versions of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {number} [args.pageSize=100] - The number of versions to return per page.
 * @param {string} [args.pageToken] - The token for the next page of results.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} - The versions of the script project.
 */
const executeFunction = async ({ scriptId, pageSize = 100, pageToken, fields }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/versions`,
      query: { pageSize, pageToken, fields },
      label: 'SCRIPT_VERSIONS_LIST'
    });
  } catch (error) {
    return toToolError(error, { scriptId });
  }
};

/**
 * Tool configuration for listing versions of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_versions_list',
      description: 'List the versions of a Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          pageSize: {
            type: 'integer',
            description: 'The number of versions to return per page.'
          },
          pageToken: {
            type: 'string',
            description: 'The token for the next page of results.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
          },
          alt: {
            type: 'string',
            enum: ['json'],
            description: 'Data format for response.'
          },
          key: {
            type: 'string',
            description: 'API key for the request.'
          },
          access_token: {
            type: 'string',
            description: 'OAuth access token.'
          },
          oauth_token: {
            type: 'string',
            description: 'OAuth 2.0 token for the current user.'
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