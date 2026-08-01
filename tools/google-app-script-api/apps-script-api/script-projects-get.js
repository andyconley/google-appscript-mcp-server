import { getAuthHeaders } from '../../../lib/oauth-helper.js';

/**
 * Function to get metadata of a Google Apps Script project.
 * Note: OAuth access token is automatically handled by the OAuth helper.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.scriptId - The ID of the script project to retrieve.
 * @param {string} [args.fields] - Selector specifying which fields to include in a partial response.
 * @param {string} [args.alt='json'] - Data format for response.
 * @param {string} [args.quotaUser] - Arbitrary string assigned to a user for quota purposes.
 * @param {boolean} [args.prettyPrint=true] - Returns response with indentations and line breaks.
 * @returns {Promise<Object>} - The metadata of the script project.
 */
const executeFunction = async ({ scriptId, fields, alt = 'json', quotaUser, prettyPrint = true }) => {
  const baseUrl = 'https://script.googleapis.com';

  try {
    console.error('🔍 Getting script project metadata for:', scriptId);
    
    // Validate required parameters
    if (!scriptId) {
      throw new Error('scriptId is required');
    }

    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v1/projects/${scriptId}`);
    
    // Only add parameters that have values
    if (fields) url.searchParams.append('fields', fields);
    if (alt) url.searchParams.append('alt', alt);
    if (quotaUser) url.searchParams.append('quotaUser', quotaUser);
    if (prettyPrint !== undefined) url.searchParams.append('prettyPrint', prettyPrint.toString());

    console.error('🌐 API URL:', url.toString());

    // Get OAuth headers - this automatically handles token refresh
    const headers = await getAuthHeaders();
    console.error('🔐 Authorization headers obtained successfully');

    // Perform the fetch request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    console.error('📡 API Response Status:', response.status, response.statusText);

    // Check if the response was successful
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        errorData = { message: errorText };
      }

      const detailedError = {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        error: errorData,
        timestamp: new Date().toISOString()
      };

      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    console.error('✅ Successfully retrieved script project metadata');
    return data;
    
  } catch (error) {
    console.error('❌ Error getting script project metadata:', {
      message: error.message,
      stack: error.stack,
      scriptId,
      timestamp: new Date().toISOString()
    });
    
    // Return detailed error information for debugging
    return { 
      error: true,
      message: error.message,
      details: {
        scriptId,
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Unknown'
      }
    };
  }
};

/**
 * Tool configuration for getting metadata of a Google Apps Script project.
 * OAuth authentication is handled automatically.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_get',
      description: 'Get metadata of a Google Apps Script project. OAuth authentication is handled automatically.',
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
          },
          alt: {
            type: 'string',
            enum: ['json'],
            description: 'Data format for response.',
            default: 'json'
          },
          quotaUser: {
            type: 'string',
            description: 'Arbitrary string assigned to a user for quota purposes.'
          },
          prettyPrint: {
            type: 'boolean',
            description: 'Returns response with indentations and line breaks.',
            default: true
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };