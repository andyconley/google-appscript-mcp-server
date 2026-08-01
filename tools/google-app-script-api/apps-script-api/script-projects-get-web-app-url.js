import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Return the web app /exec URL(s) and access config for a script project.
 * If deploymentId is given, inspects just that deployment; otherwise scans all
 * deployments and returns every web-app entry point found.
 *
 * @param {Object} args
 * @param {string} args.scriptId - The script project ID.
 * @param {string} [args.deploymentId] - A specific deployment to inspect.
 * @returns {Promise<Object>} { scriptId, webApps: [{ deploymentId, versionNumber, url, access, executeAs }] }
 */
const executeFunction = async ({ scriptId, deploymentId }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');

    let deployments;
    if (deploymentId) {
      const one = await callGoogleApi({
        method: 'GET',
        url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments/${enc(deploymentId)}`,
        label: 'GET_WEBAPP_URL'
      });
      deployments = [one];
    } else {
      const list = await callGoogleApi({
        method: 'GET',
        url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/deployments`,
        label: 'GET_WEBAPP_URL'
      });
      deployments = list.deployments || [];
    }

    const webApps = deployments.flatMap(d =>
      (d.entryPoints || [])
        .filter(e => e.entryPointType === 'WEB_APP')
        .map(e => ({
          deploymentId: d.deploymentId,
          versionNumber: d.deploymentConfig?.versionNumber ?? 'HEAD',
          url: e.webApp?.url || null,
          access: e.webApp?.entryPointConfig?.access || null,
          executeAs: e.webApp?.entryPointConfig?.executeAs || null
        }))
    );

    return { scriptId, webApps };
  } catch (error) {
    return toToolError(error, { scriptId, deploymentId });
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_web_app_url',
      description: "Get the web app /exec URL(s) and access config for a script project's deployments.",
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project.'
          },
          deploymentId: {
            type: 'string',
            description: 'Optional specific deployment to inspect. If omitted, all deployments are scanned.'
          }
        },
        required: ['scriptId']
      }
    }
  }
};

export { apiTool };
