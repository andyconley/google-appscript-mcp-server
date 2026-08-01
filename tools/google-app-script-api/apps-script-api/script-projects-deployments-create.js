import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Create a deployment of an Apps Script project.
 *
 * @param {Object} args - Arguments for creating the deployment.
 * @param {string} args.scriptId - The ID of the script to deploy.
 * @param {string} args.manifestFileName - The name of the manifest file.
 * @param {number} args.versionNumber - The version number of the script.
 * @param {string} args.description - A description for the deployment.
 * @returns {Promise<Object>} - The created deployment.
 */
const executeFunction = async ({ scriptId, manifestFileName, versionNumber, description }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'POST',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments`,
      body: { manifestFileName, versionNumber, description },
      label: 'DEPLOYMENT_CREATE'
    });
  } catch (error) {
    return toToolError(error, { scriptId, versionNumber });
  }
};

/**
 * Tool configuration for creating a deployment of an Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_deployments_create',
      description: 'Creates a deployment of an Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script to deploy.'
          },
          manifestFileName: {
            type: 'string',
            description: 'The name of the manifest file.'
          },
          versionNumber: {
            type: 'number',
            description: 'The version number of the script.'
          },
          description: {
            type: 'string',
            description: 'A description for the deployment.'
          }
        },
        required: ['scriptId', 'manifestFileName', 'versionNumber', 'description']
      }
    }
  }
};

export { apiTool };
