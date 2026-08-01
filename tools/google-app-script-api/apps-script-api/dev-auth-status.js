import { TokenManager } from '../../../lib/tokenManager.js';
import { SCOPES } from '../../../lib/oauth-helper.js';
import { toToolError } from '../../../lib/appsScriptClient.js';

/**
 * Report OAuth token status WITHOUT exposing the token itself: validity, expiry,
 * and — crucially — which requested scopes are actually granted. A per-endpoint
 * 401/403 with all-scopes-granted points at the endpoint's code, not the auth;
 * a missing scope points at re-consent. (This single check would have diagnosed
 * the original "Bearer undefined" saga.)
 *
 * @returns {Promise<Object>} token/scope status
 */
const executeFunction = async () => {
  try {
    const info = new TokenManager().getTokenInfo();
    const granted = (info.scope || '').split(/\s+/).filter(Boolean);
    const missing = SCOPES.filter((s) => !granted.includes(s));

    return {
      hasTokens: !!info.hasTokens,
      status: info.status,
      isExpired: info.isExpired ?? null,
      expiresAt: info.expiresAt ?? null,
      savedAt: info.savedAt ?? null,
      tokenLocation: info.location,
      grantedScopes: granted,
      requestedScopes: SCOPES,
      missingScopes: missing,
      note: missing.length
        ? 'Some requested scopes are NOT granted — re-run `node oauth-setup.js` to re-consent (revoke the old grant first).'
        : 'All requested scopes are granted.'
    };
  } catch (error) {
    return toToolError(error, {});
  }
};

const apiTool = {
  devOnly: true,
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'auth_status',
      description:
        'Report OAuth token validity, expiry, and granted-vs-requested scopes (never exposes the token). Dev/diagnostic tool.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
};

export { apiTool };
