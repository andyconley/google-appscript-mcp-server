import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Get metrics data for Google Apps Script projects.
 *
 * @param {Object} args - Arguments for the metrics request.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} [args.deploymentId] - The ID of the deployment to filter metrics.
 * @param {string} args.metricsGranularity - The granularity of the metrics data.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} - The metrics data for the specified script project.
 */
const executeFunction = async ({ scriptId, deploymentId, metricsGranularity, fields }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/metrics`,
      query: {
        metricsGranularity,
        'metricsFilter.deploymentId': deploymentId,
        fields
      },
      label: 'METRICS_GET'
    });
  } catch (error) {
    return toToolError(error, { scriptId, deploymentId });
  }
};

/**
 * Tool configuration for getting metrics data for Google Apps Script projects.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_script_metrics',
      description: 'Get metrics data for Google Apps Script projects.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          deploymentId: {
            type: 'string',
            description: 'The ID of the deployment to filter metrics.'
          },
          metricsGranularity: {
            type: 'string',
            description: 'The granularity of the metrics data.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
          },
          key: {
            type: 'string',
            description: 'API key for the request.'
          },
          access_token: {
            type: 'string',
            description: 'OAuth access token for authorization.'
          },
          oauth_token: {
            type: 'string',
            description: 'OAuth 2.0 token for the current user.'
          },
          prettyPrint: {
            type: 'boolean',
            description: 'Whether to return the response with indentations and line breaks.'
          }
        },
        required: ['scriptId', 'deploymentId', 'metricsGranularity', 'fields', 'key', 'access_token', 'oauth_token']
      }
    }
  }
};

export { apiTool };