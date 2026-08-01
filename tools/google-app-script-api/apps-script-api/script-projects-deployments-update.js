import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Update a deployment of an Apps Script project.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.scriptId - The ID of the script to update.
 * @param {string} args.deploymentId - The ID of the deployment to update.
 * @param {Object} args.deploymentConfig - The configuration for the deployment.
 * @param {string} args.deploymentConfig.manifestFileName - The name of the manifest file.
 * @param {number} [args.deploymentConfig.versionNumber] - The version number of the deployment.
 * @param {string} [args.deploymentConfig.description] - A description of the deployment.
 * @returns {Promise<Object>} - The updated deployment.
 */
const executeFunction = async ({ scriptId, deploymentId, deploymentConfig }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    if (!deploymentId) throw new Error('deploymentId is required');

    // Omit versionNumber entirely when it is not a number so the deployment
    // tracks HEAD (the API treats a missing versionNumber as "latest saved
    // content").
    const cleanConfig = { ...deploymentConfig };
    if (typeof cleanConfig.versionNumber !== 'number') {
      delete cleanConfig.versionNumber;
    }

    return await callGoogleApi({
      method: 'PUT',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments/${enc(deploymentId)}`,
      body: { deploymentConfig: cleanConfig },
      label: 'DEPLOYMENT_UPDATE'
    });
  } catch (error) {
    return toToolError(error, { scriptId, deploymentId });
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