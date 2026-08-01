import { callGoogleApi, toToolError, APPS_SCRIPT_BASE } from '../../../lib/appsScriptClient.js';

/**
 * List processes for a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the process listing.
 * @param {string} args.scriptId - The ID of the script to filter processes.
 * @param {string} [args.startTime] - The start time for filtering processes.
 * @param {string} [args.functionName] - The name of the function to filter processes.
 * @param {string} [args.deploymentId] - The deployment ID to filter processes.
 * @param {string} [args.projectName] - The project name to filter processes.
 * @param {Array<string>} [args.statuses] - The statuses to filter processes.
 * @param {string} [args.pageToken] - Token for pagination.
 * @param {Array<string>} [args.types] - The types of processes to filter.
 * @param {Array<string>} [args.userAccessLevels] - User access levels to filter.
 * @param {number} [args.pageSize=100] - The number of processes to return per page.
 * @param {string} [args.endTime] - The end time for filtering processes.
 * @param {string} [args.fields] - Partial-response field selector.
 * @returns {Promise<Object>} - The result of the process listing.
 */
const executeFunction = async ({
  scriptId,
  startTime,
  functionName,
  deploymentId,
  projectName,
  statuses,
  pageToken,
  types,
  userAccessLevels,
  pageSize = 100,
  endTime,
  fields
}) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/processes`,
      query: {
        'userProcessFilter.scriptId': scriptId,
        'userProcessFilter.startTime': startTime,
        'userProcessFilter.functionName': functionName,
        'userProcessFilter.deploymentId': deploymentId,
        'userProcessFilter.projectName': projectName,
        'userProcessFilter.statuses': statuses ? statuses.join(',') : undefined,
        pageToken,
        'userProcessFilter.types': types ? types.join(',') : undefined,
        'userProcessFilter.userAccessLevels': userAccessLevels ? userAccessLevels.join(',') : undefined,
        'userProcessFilter.endTime': endTime,
        fields,
        pageSize
      },
      label: 'SCRIPT_PROCESSES_LIST'
    });
  } catch (error) {
    return toToolError(error, { scriptId });
  }
};

/**
 * Tool configuration for listing processes in Google Apps Script.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_processes_list',
      description: 'List processes for a Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script to filter processes.'
          },
          startTime: {
            type: 'string',
            description: 'The start time for filtering processes.'
          },
          functionName: {
            type: 'string',
            description: 'The name of the function to filter processes.'
          },
          deploymentId: {
            type: 'string',
            description: 'The deployment ID to filter processes.'
          },
          projectName: {
            type: 'string',
            description: 'The project name to filter processes.'
          },
          statuses: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'The statuses to filter processes.'
          },
          pageToken: {
            type: 'string',
            description: 'Token for pagination.'
          },
          types: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'The types of processes to filter.'
          },
          userAccessLevels: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'User access levels to filter.'
          },
          pageSize: {
            type: 'integer',
            description: 'The number of processes to return per page.'
          },
          endTime: {
            type: 'string',
            description: 'The end time for filtering processes.'
          },
          fields: {
            type: 'string',
            description: 'Selector specifying which fields to include in a partial response.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };
