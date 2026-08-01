import { callGoogleApi, toToolError, DRIVE_BASE } from '../../../lib/appsScriptClient.js';

/**
 * List / search the user's Apps Script projects via the Drive API.
 *
 * The Apps Script REST API has no "list my projects" method — every other tool
 * requires a scriptId you already know. A standalone Apps Script project is a
 * Drive file (mimeType application/vnd.google-apps.script) whose Drive file id
 * IS the scriptId, so Drive files.list is the discovery path.
 *
 * NOTE: requires a Drive scope (drive.metadata.readonly). If this returns 403
 * "insufficient authentication scopes", re-run the OAuth setup to re-consent
 * with the added scope: `node oauth-setup.js` (revoke the old grant first).
 *
 * @param {Object} args
 * @param {string} [args.nameContains] - Filter to projects whose name contains this text.
 * @param {number} [args.pageSize=50] - Results per page (max 100).
 * @param {string} [args.pageToken] - Pagination token from a previous call.
 * @returns {Promise<Object>} { scripts: [{ scriptId, name, modifiedTime, owner }], nextPageToken }
 */
const executeFunction = async ({ nameContains, pageSize = 50, pageToken }) => {
  try {
    let q = "mimeType='application/vnd.google-apps.script' and trashed=false";
    if (nameContains) {
      // Escape single quotes for the Drive query language.
      q += ` and name contains '${String(nameContains).replace(/'/g, "\\'")}'`;
    }

    const res = await callGoogleApi({
      method: 'GET',
      url: `${DRIVE_BASE}/files`,
      query: {
        q,
        pageSize,
        pageToken,
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken,files(id,name,modifiedTime,owners(emailAddress))'
      },
      label: 'DRIVE_LIST_SCRIPTS'
    });

    return {
      scripts: (res.files || []).map(f => ({
        scriptId: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
        owner: f.owners?.[0]?.emailAddress || null
      })),
      nextPageToken: res.nextPageToken || null
    };
  } catch (error) {
    return toToolError(error, { nameContains });
  }
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'list_script_projects',
      description: "List or search the user's Google Apps Script projects (via Drive). Returns each project's scriptId and name. Use this to discover a scriptId when you don't already have one. Requires a Drive scope; re-run OAuth setup if it reports insufficient scopes.",
      parameters: {
        type: 'object',
        properties: {
          nameContains: {
            type: 'string',
            description: 'Only return projects whose name contains this text.'
          },
          pageSize: {
            type: 'integer',
            description: 'Results per page (max 100, default 50).'
          },
          pageToken: {
            type: 'string',
            description: 'Pagination token from a previous response.'
          }
        },
        required: []
      }
    }
  }
};

export { apiTool };
