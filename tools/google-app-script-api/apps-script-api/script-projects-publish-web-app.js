import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';
import { logger } from '../../../lib/logger.js';

/**
 * Composite tool: publish a web app in one call. Optionally updates the project
 * content, creates a new version from the current content, then repoints an
 * existing deployment to that version (the deployment URL stays stable).
 *
 * This wraps the three-call updateContent -> versions.create -> deployments.update
 * workflow so a caller can't leave it half-done.
 *
 * @param {Object} args
 * @param {string} args.scriptId - The script project ID.
 * @param {string} args.deploymentId - The existing deployment to repoint.
 * @param {string} [args.description] - Version/deployment description.
 * @param {Array}  [args.files] - If provided, the project content is updated first.
 * @returns {Promise<Object>} { versionNumber, deploymentId, url, deployment }
 */
const executeFunction = async ({ scriptId, deploymentId, description, files }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    if (!deploymentId) throw new Error('deploymentId is required');

    // 1. Optionally push new content first.
    if (Array.isArray(files) && files.length > 0) {
      logger.info('PUBLISH_WEBAPP', 'Updating project content before publishing', { scriptId, fileCount: files.length });
      await callGoogleApi({
        method: 'PUT',
        url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/content`,
        body: { files },
        label: 'PUBLISH_WEBAPP'
      });
    }

    // 2. Create a new version from the current (saved) content.
    const version = await callGoogleApi({
      method: 'POST',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/versions`,
      body: description ? { description } : {},
      label: 'PUBLISH_WEBAPP'
    });

    // 3. Repoint the existing deployment to the new version (URL unchanged).
    const deployment = await callGoogleApi({
      method: 'PUT',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments/${enc(deploymentId)}`,
      body: {
        deploymentConfig: {
          manifestFileName: 'appsscript',
          versionNumber: version.versionNumber,
          description: description || `Published version ${version.versionNumber}`
        }
      },
      label: 'PUBLISH_WEBAPP'
    });

    const webApp = (deployment.entryPoints || []).find(e => e.entryPointType === 'WEB_APP')?.webApp;
    logger.info('PUBLISH_WEBAPP', 'Publish complete', { scriptId, deploymentId, versionNumber: version.versionNumber });
    return {
      versionNumber: version.versionNumber,
      deploymentId,
      url: webApp?.url || null,
      deployment
    };
  } catch (error) {
    logger.error('PUBLISH_WEBAPP', 'Failed to publish web app', { scriptId, deploymentId, message: error.message });
    return toToolError(error, { scriptId, deploymentId });
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'publish_web_app',
      description: 'Publish a Google Apps Script web app in one step: optionally update content, create a new version, and repoint an existing deployment to it (deployment URL stays stable).',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          deploymentId: {
            type: 'string',
            description: 'The ID of the existing deployment to repoint.'
          },
          description: {
            type: 'string',
            description: 'Description for the new version and deployment.'
          },
          files: {
            type: 'array',
            description: 'Optional project files to write before publishing (Apps Script content format: { name, type, source }). If omitted, the current saved content is published.',
            items: { type: 'object' }
          }
        },
        required: ['scriptId', 'deploymentId']
      }
    }
  }
};

export { apiTool };
