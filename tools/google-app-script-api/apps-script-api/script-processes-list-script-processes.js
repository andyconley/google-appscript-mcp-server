import { callGoogleApi, toToolError, APPS_SCRIPT_BASE } from '../../../lib/appsScriptClient.js';

/**
 * List script processes for a given script ID.
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
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/processes:listScriptProcesses`,
      query: {
        scriptId,
        pageSize,
        'scriptProcessFilter.functionName': functionName,
        pageToken,
        'scriptProcessFilter.startTime': startTime,
        'scriptProcessFilter.endTime': endTime,
        'scriptProcessFilter.deploymentId': deploymentId,
        'scriptProcessFilter.types': types,
        'scriptProcessFilter.statuses': statuses,
        'scriptProcessFilter.userAccessLevels': userAccessLevels
      },
      label: 'SCRIPT_PROCESSES_LIST'
    });
  } catch (error) {
    return toToolError(error, { scriptId });
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