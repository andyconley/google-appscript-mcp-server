import { getAuthHeaders } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to get metrics data for Google Apps Script projects.
 *
 * @param {Object} args - Arguments for the metrics request.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} args.deploymentId - The ID of the deployment to filter metrics.
 * @param {string} args.metricsGranularity - The granularity of the metrics data.
 * @param {string} args.fields - Selector specifying which fields to include in a partial response.
 * @param {string} args.key - API key for the request.
 * @param {string} args.access_token - OAuth access token for authorization.
 * @param {string} args.oauth_token - OAuth 2.0 token for the current user.
 * @param {boolean} [args.prettyPrint=true] - Whether to return the response with indentations and line breaks.
 * @returns {Promise<Object>} - The metrics data for the specified script project.
 */
const executeFunction = async ({ scriptId, deploymentId, metricsGranularity, fields, key, access_token, oauth_token, prettyPrint = true }) => {
  const baseUrl = 'https://script.googleapis.com';

  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v1/projects/${scriptId}/metrics`);
    url.searchParams.append('metricsGranularity', metricsGranularity);
    if (deploymentId) url.searchParams.append('metricsFilter.deploymentId', deploymentId);
    if (fields) url.searchParams.append('fields', fields);
    url.searchParams.append('prettyPrint', prettyPrint.toString());

    // Set up headers for the request (OAuth, matching the working read/create tools)
    const headers = await getAuthHeaders();

    // Perform the fetch request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      deploymentId,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('METRICS_GET', 'Error getting metrics data', errorDetails);
    
    console.error('❌ Error getting metrics data:', errorDetails);
    
    // Return detailed error information for debugging
    return { 
      error: true,
      message: error.message,
      details: errorDetails,
      rawError: {
        name: error.name,
        stack: error.stack
      }
    };
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