import { callGoogleApi, toToolError, APPS_SCRIPT_BASE } from '../../../lib/appsScriptClient.js';

/**
 * Create a new Google Apps Script project.
 *
 * @param {Object} args
 * @param {string} args.title - The title of the new script project.
 * @param {string} [args.parentId] - The ID of the parent project.
 * @returns {Promise<Object>} The created project.
 */
const executeFunction = async ({ parentId, title }) => {
  try {
    if (!title) throw new Error('title is required');
    return await callGoogleApi({
      method: 'POST',
      url: `${APPS_SCRIPT_BASE}/v1/projects`,
      body: { title, ...(parentId ? { parentId } : {}) },
      label: 'PROJECTS_CREATE'
    });
  } catch (error) {
    return toToolError(error, { title, parentId });
  }
};

/**
 * Tool configuration for creating a new Google Apps Script project.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'script_projects_create',
      description: 'Create a new Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          parentId: {
            type: 'string',
            description: 'The ID of the parent project.'
          },
          title: {
            type: 'string',
            description: 'The title of the new script project.'
          }
        },
        required: ['parentId', 'title']
      }
    }
  }
};

export { apiTool };
