import { getOAuthAccessToken } from '../../../lib/oauth-helper.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to update the content of a Google Apps Script project.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.scriptId - The ID of the script project to update.
 * @param {Array<Object>} args.files - The files to be updated in the script project.
 * @returns {Promise<Object>} - The result of the update operation.
 */
const executeFunction = async ({ scriptId, files }) => {
  const baseUrl = 'https://script.googleapis.com';
  const startTime = Date.now();

  try {
    logger.info('SCRIPT_UPDATE_CONTENT', 'Starting script content update', { 
      scriptId, 
      filesCount: files?.length || 0 
    });

    // Get OAuth access token
    const token = await getOAuthAccessToken();
    
    // Construct the URL for the request
    const url = `${baseUrl}/v1/projects/${scriptId}/content`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Prepare the body of the request
    const requestBody = { scriptId, files };
    const body = JSON.stringify(requestBody);

    logger.logAPICall('PUT', url, headers, requestBody);

    // Perform the fetch request
    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body
    });
    
    const fetchDuration = Date.now() - fetchStartTime;
    const responseSize = response.headers.get('content-length') || 'unknown';
    
    logger.logAPIResponse('PUT', url, response.status, fetchDuration, responseSize);

    // Check if the response was successful
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        errorData = { message: errorText };
      }

      const detailedError = {
        status: response.status,
        statusText: response.statusText,
        url,
        errorResponse: errorData,
        duration: Date.now() - startTime,
        scriptId,
        filesCount: files?.length || 0,
        timestamp: new Date().toISOString()
      };

      logger.error('SCRIPT_UPDATE_CONTENT', 'API request failed', detailedError);
      
      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    
    logger.info('SCRIPT_UPDATE_CONTENT', 'Successfully updated script content', {
      scriptId,
      filesCount: files?.length || 0,
      duration: Date.now() - startTime
    });
    
    console.error('✅ Successfully updated script content');
    return data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      scriptId,
      filesCount: files?.length || 0,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Unknown'
    };

    logger.error('SCRIPT_UPDATE_CONTENT', 'Error updating script project content', errorDetails);
    
    console.error('❌ Error updating script project content:', errorDetails);
    
    // Return detailed error information for debugging
    return { 
      error: true,
      message: error.message,
      details: errorDetails,
      rawError: {
        name: error.name,
        stack: error.stack
      }
    };
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