import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Run a function in a Google Apps Script project (scripts.run).
 *
 * Requires the script to be deployed as an API executable and the calling
 * OAuth client to share the script's Cloud project.
 *
 * @param {Object} args
 * @param {string} args.scriptId - The ID of the script to run.
 * @param {string} args.functionName - The name of the function to execute.
 * @param {Array}  [args.parameters] - Parameters passed to the function (JSON-compatible values).
 * @param {boolean} [args.devMode=false] - Run the latest saved (HEAD) code instead of the deployed version.
 * @returns {Promise<Object>} The execution response (result or error).
 */
const executeFunction = async ({ scriptId, functionName, parameters, devMode = false }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    if (!functionName) throw new Error('functionName is required');

    const body = { function: functionName };
    if (Array.isArray(parameters)) body.parameters = parameters;
    if (devMode) body.devMode = true;

    return await callGoogleApi({
      method: 'POST',
      url: `${APPS_SCRIPT_BASE}/v1/scripts/${enc(scriptId)}:run`,
      body,
      label: 'SCRIPT_RUN'
    });
  } catch (error) {
    return toToolError(error, { scriptId, functionName });
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_run',
      description: 'Run a function in a Google Apps Script project. The script must be deployed as an API executable and share the calling OAuth client\'s Cloud project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script to run.'
          },
          functionName: {
            type: 'string',
            description: 'The name of the function to execute.'
          },
          parameters: {
            type: 'array',
            description: 'Parameters to pass to the function (JSON-compatible values).',
            items: {}
          },
          devMode: {
            type: 'boolean',
            description: 'Run the latest saved (HEAD) code instead of the deployed version. Only works for the script owner.'
          }
        },
        required: ['scriptId', 'functionName']
      }
    }
  }
};

export { apiTool };
