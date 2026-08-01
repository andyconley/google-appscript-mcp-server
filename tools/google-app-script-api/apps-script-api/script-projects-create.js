import { getAuthHeaders } from '../../../lib/oauth-helper.js';

/**
 * Function to create a new Google Apps Script project.
 * OAuth authentication is handled automatically.
 *
 * @param {Object} args - Arguments for creating the script project.
 * @param {string} args.parentId - The ID of the parent project.
 * @param {string} args.title - The title of the new script project.
 * @returns {Promise<Object>} - The result of the project creation.
 */
const executeFunction = async ({ parentId, title }) => {
  const baseUrl = 'https://script.googleapis.com';

  try {
    console.error('🔨 Creating new Google Apps Script project:', title);
    
    // Validate required parameters
    if (!title) {
      throw new Error('title is required');
    }

    const projectData = {
      title
    };

    // Add parentId if provided
    if (parentId) {
      projectData.parentId = parentId;
    }

    // Construct the URL for the API request
    const url = new URL(`${baseUrl}/v1/projects`);
    console.error('🌐 API URL:', url.toString());

    // Get OAuth headers
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    console.error('🔐 Authorization headers obtained successfully');

    // Perform the fetch request
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(projectData)
    });

    console.error('📡 API Response Status:', response.status, response.statusText);

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
        url: url.toString(),
        error: errorData,
        timestamp: new Date().toISOString()
      };

      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    // Parse and return the response data
    const data = await response.json();
    console.error('✅ Successfully created script project');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating script project:', {
      message: error.message,
      stack: error.stack,
      title,
      parentId,
      timestamp: new Date().toISOString()
    });
    
    // Return detailed error information for debugging
    return { 
      error: true,
      message: error.message,
      details: {
        title,
        parentId,
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Unknown'
      }
    };
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