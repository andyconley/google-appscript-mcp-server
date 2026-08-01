/**
 * Shared HTTP client for Google API calls (Apps Script + Drive).
 *
 * Centralizes the auth + URL-building + error-handling + logging that was
 * previously copy-pasted (inconsistently) into every tool. Every tool should
 * go through callGoogleApi so the auth and failure contract is uniform by
 * construction — which is what prevents the original "Bearer undefined" class
 * of bug from recurring per-endpoint.
 */

import { getAuthHeaders } from './oauth-helper.js';
import { logger } from './logger.js';

/**
 * Make an authenticated Google API request.
 *
 * @param {Object} opts
 * @param {string} opts.method - HTTP method (GET, POST, PUT, DELETE).
 * @param {string} opts.url - Fully-qualified URL (no query string).
 * @param {Object} [opts.query] - Query params; null/undefined values are skipped.
 * @param {Object} [opts.body] - JSON body for write methods.
 * @param {string} [opts.label] - Log label (defaults to method).
 * @returns {Promise<Object>} Parsed JSON response ({} for empty bodies).
 * @throws {Error} With a clean message built from the API error payload.
 */
export async function callGoogleApi({ method, url, query, body, label }) {
  const tag = label || method;
  const startTime = Date.now();

  const target = new URL(url);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        target.searchParams.append(key, String(value));
      }
    }
  }
  target.searchParams.set('prettyPrint', 'true');

  const headers = await getAuthHeaders();
  headers['Accept'] = 'application/json';

  const init = { method, headers };
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  logger.logAPICall(method, target.toString(), headers, body ?? null);

  const response = await fetch(target.toString(), init);
  const responseSize = response.headers.get('content-length') || 'unknown';
  logger.logAPIResponse(method, target.toString(), response.status, Date.now() - startTime, responseSize);

  const text = await response.text();

  if (!response.ok) {
    // Parse the error body as JSON when possible, but never let a non-JSON
    // error page (HTML 502, proxy page) throw and mask the real status.
    let apiError;
    try {
      apiError = JSON.parse(text);
    } catch {
      apiError = { error: { message: text || response.statusText } };
    }
    const message = apiError?.error?.message || apiError?.message || response.statusText;
    logger.error(tag, 'API request failed', { status: response.status, url: target.toString(), apiError });
    throw new Error(`API Error (${response.status}): ${message}`);
  }

  // Some endpoints (e.g. deployments.delete) return an empty 200 body.
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Standard error shape for tools. Keeps every tool's failure payload identical
 * so the CallTool handler's isError detection (truthy `error`) always works.
 *
 * @param {Error} error
 * @param {Object} [context] - Extra fields (scriptId, deploymentId, ...).
 * @returns {Object} { error: true, message, details, rawError }
 */
export function toToolError(error, context = {}) {
  return {
    error: true,
    message: error.message,
    details: { ...context, timestamp: new Date().toISOString() },
    rawError: { name: error.name, stack: error.stack }
  };
}

export const APPS_SCRIPT_BASE = 'https://script.googleapis.com';
export const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
