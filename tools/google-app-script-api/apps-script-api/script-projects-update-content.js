import { callGoogleApi, toToolError, APPS_SCRIPT_BASE, enc } from '../../../lib/appsScriptClient.js';

/**
 * Update the content of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.scriptId - The ID of the script project to update.
 * @param {Array<Object>} args.files - The files to be updated in the script project.
 * @returns {Promise<Object>} - The result of the update operation.
 */
const executeFunction = async ({ scriptId, files }) => {
  try {
    if (!scriptId) throw new Error('scriptId is required');
    return await callGoogleApi({
      method: 'PUT',
      url: `${APPS_SCRIPT_BASE}/v1/projects/${enc(scriptId)}/content`,
      body: { files },
      label: 'SCRIPT_UPDATE_CONTENT'
    });
  } catch (error) {
    return toToolError(error, { scriptId, filesCount: files?.length || 0 });
  }
};

/**
 * Tool configuration for updating Google Apps Script project content.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_script_content',
      description: 'Updates the content of a specified Google Apps Script project.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: {
            type: 'string',
            description: 'The ID of the script project to update.'
          },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the file.'
                },
                lastModifyUser: {
                  type: 'object',
                  properties: {
                    photoUrl: { type: 'string' },
                    domain: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                },
                type: {
                  type: 'string',
                  description: 'The type of the file.'
                },
                updateTime: { type: 'string' },
                source: { type: 'string' },
                createTime: { type: 'string' },
                functionSet: {
                  type: 'object',
                  properties: {
                    values: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          parameters: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                value: { type: 'string' }
                              }
                            }
                          },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            description: 'The files to be updated in the script project.'
          }
        },
        required: ['scriptId', 'files']
      }
    }
  }
};

export { apiTool };
