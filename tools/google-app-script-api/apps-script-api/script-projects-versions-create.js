import { getOAuthAccessToken } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to create a new version of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for creating a new version.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} args.description - A description for the new version.
 * @returns {Promise<Object>} - The result of the version creation.
 */
const executeFunction = async ({ scriptId, description }) => {
  const baseUrl = 'https://script.googleapis.com';
  const url = `${baseUrl}/v1/projects/${scriptId}/versions`;
  const startTime = Date.now();

  const body = JSON.stringify({
    description
  });

  try {
    logger.info('VERSION_CREATE', 'Starting version creation', { scriptId, description });

    // Get OAuth access token
    const token = await getOAuthAccessToken();
    
    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    logger.logAPICall('POST', url, headers, { description });

    // Perform the fetch request
    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });
    
    const fetchDuration = Date.now() - fetchStartTime;
    const responseSize = response.headers.get('content-length') || 'unknown';
    
    logger.logAPIResponse('POST', url, response.status, fetchDuration, responseSize);

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
        url,
        errorResponse: errorData,
        duration: Date.now() - startTime,
        scriptId,
        description,
        timestamp: new Date().toISOString()
      };

      logger.error('VERSION_CREATE', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('VERSION_CREATE', 'Successfully created version', {
      scriptId,
      versionNumber: data.versionNumber,
      description,
      duration: Date.now() - startTime
    });
    
    console.error('✅ Successfully created version');
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      description,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('VERSION_CREATE', 'Error creating version', errorDetails);
    
    console.error('❌ Error creating version:', errorDetails);
    
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
 * Tool configuration for creating a new version of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_versions_create',
      description: 'Creates a new version of a Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          description: {
            type: 'string',
            description: 'A description for the new version.'
          }
        },
        required: ['scriptId', 'description']
      }
    }
  }
};

export { apiTool };