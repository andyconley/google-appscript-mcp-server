import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Delete a deployment of an Apps Script project.
 *
 * @param {Object} args - Arguments for the deletion.
 * @param {string} args.scriptId - The ID of the script project.
 * @param {string} args.deploymentId - The ID of the deployment to delete.
 * @returns {Promise<Object>} - The result of the deletion operation.
 */
const executeFunction = async ({ scriptId, deploymentId }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    if (!deploymentId) throw new Error('deploymentId is required');
    return await callGoogleApi({
      method: 'DELETE',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments/${enc(deploymentId)}`,
      label: 'DEPLOYMENT_DELETE'
    });
  } catch (error) {
    return toToolError(error, { scriptId, deploymentId });
  }
};

/**
 * Tool configuration for deleting a deployment of an Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_delete',
      description: 'Delete a deployment of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          deploymentId: {
            type: 'string',
            description: 'The ID of the deployment to delete.'
          }
        },
        required: ['scriptId', 'deploymentId']
      }
    }
  }
};

export { apiTool };
