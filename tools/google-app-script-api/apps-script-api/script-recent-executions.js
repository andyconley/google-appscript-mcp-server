import { callGoogleApi, toToolError, APPS_SCRIPT_BASE } from '../../../lib/appsScriptClient.js';

// Apps Script ProcessStatus values that represent a failed/aborted run.
const FAILURE_STATUSES = ['FAILED', 'TIMED_OUT', 'CANCELED'];

/**
 * List recent executions (runs) of an Apps Script project using execution
 * metadata (processes.listScriptProcesses). Returns which function ran, its
 * status, when, and how long it took — the "what ran and did it fail" view.
 *
 * This uses execution METADATA only (no extra scope). It does NOT return
 * console.log output — that lives in Cloud Logging and needs a separate tool
 * and the logging.read scope.
 *
 * @param {Object} args
 * @param {string} args.scriptId - The script project ID.
 * @param {boolean} [args.onlyFailures=false] - Only return failed/timed-out/canceled runs.
 * @param {string} [args.functionName] - Filter to a specific function.
 * @param {number} [args.pageSize=20] - Max executions to return (API max 50).
 * @param {string} [args.pageToken] - Pagination token from a previous call.
 * @returns {Promise<Object>} { scriptId, count, failures, executions, nextPageToken }
 */
const executeFunction = async ({ scriptId, onlyFailures = false, functionName, pageSize = 20, pageToken }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');

    const res = await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/processes:listScriptProcesses`,
      query: {
        scriptId,
        pageSize,
        pageToken,
        'scriptProcessFilter.functionName': functionName,
        'scriptProcessFilter.statuses': onlyFailures ? FAILURE_STATUSES : undefined
      },
      label: 'RECENT_EXECUTIONS'
    });

    const executions = (res.processes || []).map(p => ({
      functionName: p.functionName || null,
      status: p.processStatus || null,
      type: p.processType || null,
      startTime: p.startTime || null,
      duration: p.duration || null,
      failed: FAILURE_STATUSES.includes(p.processStatus)
    }));

    return {
      scriptId,
      count: executions.length,
      failures: executions.filter(e => e.failed).length,
      executions,
      nextPageToken: res.nextPageToken || null
    };
  } catch (error) {
    return toToolError(error, { scriptId });
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'recent_executions',
      description: 'List recent executions of an Apps Script project (function, status, start time, duration). Optionally filter to failures. Uses execution metadata — no extra scope, and does not include console.log output.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          onlyFailures: {
            type: 'boolean',
            description: 'Only return failed / timed-out / canceled executions.'
          },
          functionName: {
            type: 'string',
            description: 'Filter to executions of a specific function.'
          },
          pageSize: {
            type: 'integer',
            description: 'Max executions to return (API max 50, default 20).'
          },
          pageToken: {
            type: 'string',
            description: 'Pagination token from a previous response.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };
