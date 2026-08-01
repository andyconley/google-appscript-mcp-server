import { getOAuthAccessToken } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to list the deployments of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the deployment listing.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {number} [args.pageSize=50] - The number of deployments to return per page.
 * @param {string} [args.pageToken] - Token for pagination.
 * @param {string} [args.fields] - Selector specifying which fields to include in a partial response.
 * @param {boolean} [args.prettyPrint=true] - Returns response with indentations and line breaks.
 * @returns {Promise<Object>} - The result of the deployments listing.
 */
const executeFunction = async ({ scriptId, pageSize = 50, pageToken, fields, prettyPrint = true }) => {
  const baseUrl = 'https://script.googleapis.com';
  const startTime = Date.now();

  logger.info('API_CALL', 'Starting deployments list request', {
    scriptId,
    pageSize,
    pageToken: pageToken ? 'provided' : 'none',
    fields: fields || 'all',
    baseUrl
  });

  try {
    // Get OAuth access token
    logger.debug('API_CALL', 'Getting OAuth access token');
    const token = await getOAuthAccessToken();
    logger.debug('API_CALL', 'OAuth token obtained successfully');
    
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v1/projects/${scriptId}/deployments`);
    url.searchParams.append('pageSize', pageSize.toString());
    if (pageToken) url.searchParams.append('pageToken', pageToken);
    if (fields) url.searchParams.append('fields', fields);
    url.searchParams.append('alt', 'json');
    url.searchParams.append('prettyPrint', prettyPrint.toString());

    logger.debug('API_CALL', 'Constructed API URL', {
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
      
      logger.error('API_CALL', 'API request failed', {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        errorResponse: errorText,
        duration: Date.now() - startTime
      });
      
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Parse and return the response data
    const data = await response.json();
    const totalDuration = Date.now() - startTime;
    
    logger.info('API_CALL', 'Deployments list request completed successfully', {
      scriptId,
      deploymentCount: data.deployments ? data.deployments.length : 0,
      hasNextPageToken: !!data.nextPageToken,
      totalDuration: `${totalDuration}ms`,
      responseSize: JSON.stringify(data).length
    });
    
    return data;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    logger.error('API_CALL', 'Deployments list request failed', {
      scriptId,
      error: {
        message: error.message,
        stack: error.stack
      },
      totalDuration: `${totalDuration}ms`
    });
    
    console.error('Error listing deployments:', error);
    return {
      error: true,
      message: error.message,
      details: {
        scriptId,
        timestamp: new Date().toISOString()
      },
      rawError: {
        name: error.name,
        stack: error.stack
      }
    };
  }
};

/**
 * Tool configuration for listing deployments of a Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_list',
      description: 'Lists the deployments of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          pageSize: {
            type: 'integer',
            description: 'The number of deployments to return per page.'
          },
          pageToken: {
            type: 'string',
            description: 'Token for pagination.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
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