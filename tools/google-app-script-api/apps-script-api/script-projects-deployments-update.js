import { getAuthHeaders } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to update a deployment of an Apps Script project.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.scriptId - The ID of the script to update.
 * @param {string} args.deploymentId - The ID of the deployment to update.
 * @param {Object} args.deploymentConfig - The configuration for the deployment.
 * @param {string} args.deploymentConfig.manifestFileName - The name of the manifest file.
 * @param {number} args.deploymentConfig.versionNumber - The version number of the deployment.
 * @param {string} args.deploymentConfig.description - A description of the deployment.
 * @returns {Promise<Object>} - The result of the deployment update.
 */
const executeFunction = async ({ scriptId, deploymentId, deploymentConfig }) => {
  const baseUrl = 'https://script.googleapis.com';
  const startTime = Date.now();

  try {
    logger.info('DEPLOYMENT_UPDATE', 'Starting deployment update', { 
      scriptId, 
      deploymentId, 
      versionNumber: deploymentConfig?.versionNumber 
    });

    // Construct the URL for the request
    const url = `${baseUrl}/v1/projects/${scriptId}/deployments/${deploymentId}?prettyPrint=true`;

    // Set up headers for the request (OAuth, matching the working read/create tools)
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';

    // Prepare the body of the request. Omit versionNumber entirely when it is
    // not a number so the deployment tracks HEAD (the API treats a missing
    // versionNumber as "latest saved content").
    const cleanConfig = { ...deploymentConfig };
    if (typeof cleanConfig.versionNumber !== 'number') {
      delete cleanConfig.versionNumber;
    }
    const requestBody = { deploymentConfig: cleanConfig };
    const body = JSON.stringify(requestBody);

    logger.logAPICall('PUT', url, headers, requestBody);

    // Perform the fetch request
    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body
    });
    
    const fetchDuration = Date.now() - fetchStartTime;
    const responseSize = response.headers.get('content-length') || 'unknown';
    
    logger.logAPIResponse('PUT', url, response.status, fetchDuration, responseSize);

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
        deploymentId,
        timestamp: new Date().toISOString()
      };

      logger.error('DEPLOYMENT_UPDATE', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('DEPLOYMENT_UPDATE', 'Successfully updated deployment', {
      scriptId,
      deploymentId,
      duration: Date.now() - startTime
    });
    
    console.error('✅ Successfully updated deployment');
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      deploymentId,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('DEPLOYMENT_UPDATE', 'Error updating deployment', errorDetails);
    
    console.error('❌ Error updating deployment:', errorDetails);
    
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
 * Tool configuration for updating a deployment of an Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_update',
      description: 'Updates a deployment of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script to update.'
          },
          deploymentId: {
            type: 'string',
            description: 'The ID of the deployment to update.'
          },
          deploymentConfig: {
            type: 'object',
            properties: {
              manifestFileName: {
                type: 'string',
                description: 'The name of the manifest file.'
              },
              versionNumber: {
                type: 'integer',
                description: 'The version number to deploy. Omit to track HEAD (latest saved content).'
              },
              description: {
                type: 'string',
                description: 'A description of the deployment.'
              }
            },
            required: ['manifestFileName']
          }
        },
        required: ['scriptId', 'deploymentId', 'deploymentConfig']
      }
    }
  }
};

export { apiTool };