import { getAuthHeaders } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to get a version of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} args.versionNumber - The version number of the script project.
 * @param {string} [args.fields] - Selector specifying which fields to include in a partial response.
 * @param {string} [args.alt='json'] - Data format for response.
 * @param {string} [args.key] - API key for the project.
 * @param {string} [args.access_token] - OAuth access token.
 * @param {string} [args.quotaUser] - Available to use for quota purposes for server-side applications.
 * @param {string} [args.oauth_token] - OAuth 2.0 token for the current user.
 * @param {string} [args.callback] - JSONP callback.
 * @param {boolean} [args.prettyPrint=true] - Returns response with indentations and line breaks.
 * @returns {Promise<Object>} - The result of the script version retrieval.
 */
const executeFunction = async ({ scriptId, versionNumber, fields, alt = 'json', key, access_token, quotaUser, oauth_token, callback, prettyPrint = true }) => {
  const baseUrl = 'https://script.googleapis.com';
  const url = new URL(`${baseUrl}/v1/projects/${scriptId}/versions/${versionNumber}`);

  // Append query parameters
  const params = new URLSearchParams({ prettyPrint: prettyPrint.toString() });
  if (fields) params.append('fields', fields);

  // Perform the fetch request
  try {
    // Set up headers for the request (OAuth, matching the working read/create tools)
    const headers = await getAuthHeaders();

    const response = await fetch(`${url}?${params.toString()}`, {
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
      versionNumber,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('VERSION_GET', 'Error retrieving script version', errorDetails);
    
    console.error('❌ Error retrieving script version:', errorDetails);
    
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