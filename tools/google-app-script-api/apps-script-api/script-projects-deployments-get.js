import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Get a deployment of an Apps Script project.
 *
 * @param {Object} args - Arguments for the deployment retrieval.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} args.deploymentId - The ID of the deployment to retrieve.
 * @returns {Promise<Object>} - The deployment.
 */
const executeFunction = async ({ scriptId, deploymentId }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    if (!deploymentId) throw new Error('deploymentId is required');
    return await callGoogleApi({
      method: 'GET',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments/${enc(deploymentId)}`,
      label: 'DEPLOYMENT_GET'
    });
  } catch (error) {
    return toToolError(error, { scriptId, deploymentId });
  }
};

/**
 * Tool configuration for getting a deployment of an Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_get',
      description: 'Get a deployment of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          deploymentId: {
            type: 'string',
            description: 'The ID of the deployment to retrieve.'
          }
        },
        required: ['scriptId', 'deploymentId']
      }
    }
  }
};

export { apiTool };