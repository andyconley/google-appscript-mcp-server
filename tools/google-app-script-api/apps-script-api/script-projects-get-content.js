import { getOAuthAccessToken } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to get the content of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.scriptId - The ID of the script project to retrieve content for.
 * @param {string} [args.versionNumber] - The version number of the script project.
 * @param {string} [args.fields] - Selector specifying which fields to include in a partial response.
 * @param {string} [args.alt="json"] - Data format for response.
 * @param {string} [args.key] - API key for the project.
 * @param {string} [args.access_token] - OAuth access token.
 * @param {string} [args.prettyPrint="true"] - Returns response with indentations and line breaks.
 * @returns {Promise<Object>} - The content of the script project.
 */
const executeFunction = async ({ scriptId, versionNumber, fields, alt = "json", key, access_token, prettyPrint = "true" }) => {
  const baseUrl = 'https://script.googleapis.com';
  const startTime = Date.now();
  
  try {
    logger.info('SCRIPT_GET_CONTENT', 'Starting script content retrieval', { scriptId, versionNumber });

    // Get OAuth access token
    const token = await getOAuthAccessToken();
    
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v1/projects/${scriptId}/content`);
    if (versionNumber) url.searchParams.append('versionNumber', versionNumber);
    if (fields) url.searchParams.append('fields', fields);
    url.searchParams.append('alt', alt);
    if (key) url.searchParams.append('key', key);
    if (prettyPrint) url.searchParams.append('prettyPrint', prettyPrint);

    logger.debug('SCRIPT_GET_CONTENT', 'Constructed API URL', {
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
        versionNumber,
        timestamp: new Date().toISOString()
      };

      logger.error('SCRIPT_GET_CONTENT', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('SCRIPT_GET_CONTENT', 'Successfully retrieved script content', {
      scriptId,
      versionNumber,
      filesCount: data.files?.length || 0,
      duration: Date.now() - startTime
    });
    
    console.error('✅ Successfully retrieved script content');
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      versionNumber,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('SCRIPT_GET_CONTENT', 'Error getting script project content', errorDetails);
    
    console.error('❌ Error getting script project content:', errorDetails);
    
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
          },
          alt: {
            type: 'string',
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
          prettyPrint: {
            type: 'string',
            description: 'Returns response with indentations and line breaks.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };