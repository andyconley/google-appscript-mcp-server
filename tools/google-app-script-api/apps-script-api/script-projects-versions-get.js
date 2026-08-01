import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Get a version of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} args.versionNumber - The version number of the script project.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} - The script version.
 */
const executeFunction = async ({ scriptId, versionNumber, fields }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    if (versionNumber === undefined || versionNumber === null) throw new Error('versionNumber is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/versions/${enc(versionNumber)}`,
      query: { fields },
      label: 'VERSION_GET'
    });
  } catch (error) {
    return toToolError(error, { scriptId, versionNumber });
  }
};

/**
 * Tool configuration for getting a version of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_versions_get',
      description: 'Get a version of a Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          versionNumber: {
            type: 'string',
            description: 'The version number of the script project.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
          },
          alt: {
            type: 'string',
            enum: ['json', 'xml'],
            description: 'Data format for response.'
          },
          key: {
            type: 'string',
            description: 'API key for the project.'
          },
          access_token: {
            type: 'string',
            description: 'OAuth access token.'
          },
          quotaUser: {
            type: 'string',
            description: 'Available to use for quota purposes for server-side applications.'
          },
          oauth_token: {
            type: 'string',
            description: 'OAuth 2.0 token for the current user.'
          },
          callback: {
            type: 'string',
            description: 'JSONP callback.'
          },
          prettyPrint: {
            type: 'boolean',
            description: 'Returns response with indentations and line breaks.'
          }
        },
        required: ['scriptId', 'versionNumber']
      }
    }
  }
};

export { apiTool };