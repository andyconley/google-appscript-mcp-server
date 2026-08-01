import { getOAuthAccessToken } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to list the versions of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {number} [args.pageSize=100] - The number of versions to return per page.
 * @param {string} [args.pageToken] - The token for the next page of results.
 * @param {string} [args.fields] - Selector specifying which fields to include in a partial response.
 * @param {string} [args.alt='json'] - Data format for response.
 * @param {string} [args.key] - API key for the request.
 * @param {string} [args.access_token] - OAuth access token.
 * @param {string} [args.oauth_token] - OAuth 2.0 token for the current user.
 * @param {boolean} [args.prettyPrint=true] - Returns response with indentations and line breaks.
 * @returns {Promise<Object>} - The result of the request containing the versions of the script project.
 */
const executeFunction = async ({ scriptId, pageSize = 100, pageToken, fields, key, access_token, oauth_token, prettyPrint = true }) => {
  const baseUrl = 'https://script.googleapis.com';
  const startTime = Date.now();
  
  try {
    logger.info('SCRIPT_VERSIONS_LIST', 'Starting script versions list request', { scriptId, pageSize, pageToken });
    
    // Get OAuth access token
    const token = await getOAuthAccessToken();
    
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v1/projects/${scriptId}/versions`);
    url.searchParams.append('pageSize', pageSize.toString());
    if (pageToken) url.searchParams.append('pageToken', pageToken);
    if (fields) url.searchParams.append('fields', fields);
    url.searchParams.append('alt', 'json');
    if (key) url.searchParams.append('key', key);
    if (prettyPrint) url.searchParams.append('prettyPrint', prettyPrint.toString());

    logger.debug('SCRIPT_VERSIONS_LIST', 'Constructed API URL', {
      url: url.toString(),
      pathSegments: url.pathname.split('/'),
      queryParams: Object.fromEntries(url.searchParams)
    });

    // Set up headers for the request
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    logger.logAPICall('GET', url.toString(), headers);

    // Perform the fetch request
    const fetchStartTime = Date.now();
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });
    
    const fetchDuration = Date.now() - fetchStartTime;
    const responseSize = response.headers.get('content-length') || 'unknown';
    
    logger.logAPIResponse('GET', url.toString(), response.status, fetchDuration, responseSize);

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
        errorResponse: errorData,
        duration: Date.now() - startTime,
        scriptId,
        timestamp: new Date().toISOString()
      };

      logger.error('SCRIPT_VERSIONS_LIST', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('SCRIPT_VERSIONS_LIST', 'Successfully retrieved script versions', {
      scriptId,
      versionsCount: data.versions?.length || 0,
      duration: Date.now() - startTime
    });
    
    console.error('✅ Successfully retrieved script versions');
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('SCRIPT_VERSIONS_LIST', 'Error listing script versions', errorDetails);
    
    console.error('❌ Error listing script versions:', errorDetails);
    
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