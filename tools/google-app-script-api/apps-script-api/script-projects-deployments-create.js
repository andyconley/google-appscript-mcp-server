import { getAuthHeaders } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to create a deployment of an Apps Script project.
 *
 * @param {Object} args - Arguments for creating the deployment.
 * @param {string} args.scriptId - The ID of the script to deploy.
 * @param {string} args.manifestFileName - The name of the manifest file.
 * @param {number} args.versionNumber - The version number of the script.
 * @param {string} args.description - A description for the deployment.
 * @returns {Promise<Object>} - The result of the deployment creation.
 */
const executeFunction = async ({ scriptId, manifestFileName, versionNumber, description }) => {
  const baseUrl = 'https://script.googleapis.com';
  const url = `${baseUrl}/v1/projects/${scriptId}/deployments`;
  const startTime = Date.now();

  const body = {
    manifestFileName,
    versionNumber,
    description
  };

  try {
    logger.info('DEPLOYMENT_CREATE', 'Starting deployment creation', { scriptId, versionNumber, description });

    // Get OAuth headers
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    logger.logAPICall('POST', url, headers, body);

    // Perform the fetch request
    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
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
        versionNumber,
        timestamp: new Date().toISOString()
      };

      logger.error('DEPLOYMENT_CREATE', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('DEPLOYMENT_CREATE', 'Successfully created deployment', {
      scriptId,
      deploymentId: data.deploymentId,
      versionNumber,
      duration: Date.now() - startTime
    });
    
    console.error('✅ Successfully created deployment');
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

    logger.error('DEPLOYMENT_CREATE', 'Error creating deployment', errorDetails);
    
    console.error('❌ Error creating deployment:', errorDetails);
    
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
 * Tool configuration for creating a deployment of an Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_create',
      description: 'Creates a deployment of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script to deploy.'
          },
          manifestFileName: {
            type: 'string',
            description: 'The name of the manifest file.'
          },
          versionNumber: {
            type: 'number',
            description: 'The version number of the script.'
          },
          description: {
            type: 'string',
            description: 'A description for the deployment.'
          }
        },
        required: ['scriptId', 'manifestFileName', 'versionNumber', 'description']
      }
    }
  }
};

export { apiTool };