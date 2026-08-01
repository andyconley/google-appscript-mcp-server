import { getAuthHeaders } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to list script processes for a given script ID.
 *
 * @param {Object} args - Arguments for listing script processes.
 * @param {string} args.scriptId - The ID of the script to list processes for.
 * @param {number} [args.pageSize=100] - The number of processes to return per page.
 * @param {string} [args.functionName] - Filter by function name.
 * @param {string} [args.pageToken] - Token for pagination.
 * @param {string} [args.startTime] - Filter by start time.
 * @param {string} [args.endTime] - Filter by end time.
 * @param {string} [args.deploymentId] - Filter by deployment ID.
 * @param {string} [args.types] - Filter by process types.
 * @param {string} [args.statuses] - Filter by process statuses.
 * @param {string} [args.userAccessLevels] - Filter by user access levels.
 * @returns {Promise<Object>} - The result of the script processes listing.
 */
const executeFunction = async ({ scriptId, pageSize = 100, functionName, pageToken, startTime, endTime, deploymentId, types, statuses, userAccessLevels }) => {
  const baseUrl = 'https://script.googleapis.com';
  const startTimeMs = Date.now();
  
  try {
    logger.info('SCRIPT_PROCESSES_LIST', 'Starting script processes list request', { scriptId, pageSize, functionName });

    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v1/processes:listScriptProcesses`);
    url.searchParams.append('scriptId', scriptId);
    url.searchParams.append('pageSize', pageSize.toString());
    if (functionName) url.searchParams.append('scriptProcessFilter.functionName', functionName);
    if (pageToken) url.searchParams.append('pageToken', pageToken);
    if (startTime) url.searchParams.append('scriptProcessFilter.startTime', startTime);
    if (endTime) url.searchParams.append('scriptProcessFilter.endTime', endTime);
    if (deploymentId) url.searchParams.append('scriptProcessFilter.deploymentId', deploymentId);
    if (types) url.searchParams.append('scriptProcessFilter.types', types);
    if (statuses) url.searchParams.append('scriptProcessFilter.statuses', statuses);
    if (userAccessLevels) url.searchParams.append('scriptProcessFilter.userAccessLevels', userAccessLevels);
    url.searchParams.append('alt', 'json');
    url.searchParams.append('prettyPrint', 'true');

    logger.debug('SCRIPT_PROCESSES_LIST', 'Constructed API URL', {
      url: url.toString(),
      pathSegments: url.pathname.split('/'),
      queryParams: Object.fromEntries(url.searchParams)
    });

    // Set up headers for the request (OAuth, matching the working read/create tools)
    const headers = await getAuthHeaders();

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
        duration: Date.now() - startTimeMs,
        scriptId,
        timestamp: new Date().toISOString()
      };

      logger.error('SCRIPT_PROCESSES_LIST', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('SCRIPT_PROCESSES_LIST', 'Successfully retrieved script processes', {
      scriptId,
      processesCount: data.processes?.length || 0,
      duration: Date.now() - startTimeMs
    });
    
    console.error('✅ Successfully retrieved script processes');
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      duration: Date.now() - startTimeMs,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('SCRIPT_PROCESSES_LIST', 'Error listing script processes', errorDetails);
    
    console.error('❌ Error listing script processes:', errorDetails);
    
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
 * Tool configuration for listing script processes on Google Apps Script.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'list_script_processes',
      description: 'List information about a script\'s executed processes.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script to list processes for.'
          },
          pageSize: {
            type: 'integer',
            description: 'The number of processes to return per page.'
          },
          functionName: {
            type: 'string',
            description: 'Filter by function name.'
          },
          pageToken: {
            type: 'string',
            description: 'Token for pagination.'
          },
          startTime: {
            type: 'string',
            description: 'Filter by start time.'
          },
          endTime: {
            type: 'string',
            description: 'Filter by end time.'
          },
          deploymentId: {
            type: 'string',
            description: 'Filter by deployment ID.'
          },
          types: {
            type: 'string',
            description: 'Filter by process types.'
          },
          statuses: {
            type: 'string',
            description: 'Filter by process statuses.'
          },
          userAccessLevels: {
            type: 'string',
            description: 'Filter by user access levels.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };