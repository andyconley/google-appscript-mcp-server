/**
 * OAuth Token Manager for secure token storage and management
 * Handles access token refresh and secure storage of refresh tokens
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export class TokenManager {
  constructor() {
    this.tokenDir = this.getTokenDirectory();
    this.tokenFile = path.join(this.tokenDir, 'tokens.json');
    // Holds an in-flight refresh promise so concurrent callers coalesce
    // onto one refresh instead of racing (see _refreshSingleFlight).
    this._refreshPromise = null;
    this.ensureTokenDirectory();
  }

  /**
   * Get platform-specific directory for token storage
   * @returns {string} Token directory path
   */
  getTokenDirectory() {
    const platform = os.platform();
    const homedir = os.homedir();
    
    switch (platform) {
      case 'win32':
        return path.join(homedir, 'AppData', 'Roaming', 'google-apps-script-mcp');
      case 'darwin':
        return path.join(homedir, 'Library', 'Application Support', 'google-apps-script-mcp');
      default:
        return path.join(homedir, '.config', 'google-apps-script-mcp');
    }
  }

  /**
   * Ensure token directory exists
   */
  ensureTokenDirectory() {
    if (!fs.existsSync(this.tokenDir)) {
      fs.mkdirSync(this.tokenDir, { recursive: true });
      console.error(`📁 Created token directory: ${this.tokenDir}`);
    }
  }

  /**
   * Save OAuth tokens securely
   * @param {Object} tokens - OAuth tokens object
   */
  saveTokens(tokens) {
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope,
      saved_at: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(this.tokenFile, JSON.stringify(tokenData, null, 2), { mode: 0o600 });
      console.error(`💾 Tokens saved securely to: ${this.tokenFile}`);
      console.error(`🔒 File permissions: 600 (owner read/write only)`);
    } catch (error) {
      console.error('❌ Failed to save tokens:', error.message);
      throw new Error(`Failed to save tokens: ${error.message}`);
    }
  }

  /**
   * Load stored OAuth tokens
   * @returns {Object|null} Stored tokens or null if not found
   */
  loadTokens() {
    if (!fs.existsSync(this.tokenFile)) {
      console.error('📝 No stored tokens found');
      return null;
    }
    
    try {
      const tokenData = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
      console.error(`📖 Loaded tokens from: ${this.tokenFile}`);
      console.error(`💾 Tokens saved at: ${tokenData.saved_at || 'Unknown'}`);
      return tokenData;
    } catch (error) {
      console.error('❌ Failed to load tokens:', error.message);
      return null;
    }
  }

  /**
   * Check if current access token is expired or will expire soon
   * @param {Object} tokens - Token object
   * @returns {boolean} True if token is expired or will expire within 1 minute
   */
  isTokenExpired(tokens) {
    if (!tokens || !tokens.expires_at) {
      return true;
    }
    
    // Consider token expired if it expires within the next minute
    const bufferTime = 60000; // 1 minute buffer
    const isExpired = Date.now() >= (tokens.expires_at - bufferTime);
    
    if (isExpired) {
      console.error('⏰ Access token is expired or will expire soon');
    } else {
      const expiresIn = Math.round((tokens.expires_at - Date.now()) / 1000 / 60);
      console.error(`⏰ Access token expires in ${expiresIn} minutes`);
    }
    
    return isExpired;
  }

  /**
   * Refresh access token using stored refresh token
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @returns {Promise<Object>} New tokens
   */
  async refreshAccessToken(clientId, clientSecret) {
    const tokens = this.loadTokens();
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available. Please run OAuth setup again: node oauth-setup.js');
    }

    console.error('🔄 Refreshing access token...');
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token refresh failed:', response.status, errorText);
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const newTokens = await response.json();
      
      // Keep the existing refresh token if not provided in response
      if (!newTokens.refresh_token) {
        newTokens.refresh_token = tokens.refresh_token;
      }

      // Save the refreshed tokens
      this.saveTokens(newTokens);
      console.error('✅ Access token refreshed successfully');
      
      return newTokens;
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error.message);
      throw error;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @returns {Promise<string>} Valid access token
   */
  async getValidAccessToken(clientId, clientSecret) {
    let tokens = this.loadTokens();
    
    if (!tokens) {
      throw new Error('No tokens found. Please run OAuth setup first: node oauth-setup.js');
    }
    
    if (this.isTokenExpired(tokens)) {
      console.error('🔄 Token expired, refreshing...');
      tokens = await this._refreshSingleFlight(clientId, clientSecret);
    } else {
      console.error('✅ Using existing valid access token');
    }

    return tokens.access_token;
  }

  /**
   * Coalesce concurrent refreshes onto a single request. Without this, two
   * tool calls that both find the token expired would each POST to Google's
   * token endpoint; the second refresh can invalidate the first's access
   * token, causing intermittent 401s. All concurrent callers await the same
   * in-flight promise, which is cleared once it settles.
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @returns {Promise<Object>} New tokens
   */
  _refreshSingleFlight(clientId, clientSecret) {
    if (this._refreshPromise) {
      console.error('⏳ Refresh already in flight; awaiting existing request');
      return this._refreshPromise;
    }

    this._refreshPromise = this.refreshAccessToken(clientId, clientSecret)
      .finally(() => { this._refreshPromise = null; });

    return this._refreshPromise;
  }

  /**
   * Check if tokens are stored and available
   * @returns {boolean} True if refresh token is available
   */
  hasStoredTokens() {
    const tokens = this.loadTokens();
    return tokens && tokens.refresh_token;
  }

  /**
   * Clear stored tokens (for logout/reset)
   */
  clearTokens() {
    if (fs.existsSync(this.tokenFile)) {
      fs.unlinkSync(this.tokenFile);
      console.error('🗑️ Stored tokens cleared');
    }
  }

  /**
   * Get token storage information
   * @returns {Object} Token storage info
   */
  getTokenInfo() {
    const tokens = this.loadTokens();
    if (!tokens) {
      return {
        hasTokens: false,
        location: this.tokenFile,
        status: 'No tokens stored'
      };
    }

    const isExpired = this.isTokenExpired(tokens);
    const expiresAt = new Date(tokens.expires_at);
    
    return {
      hasTokens: true,
      location: this.tokenFile,
      savedAt: tokens.saved_at,
      expiresAt: expiresAt.toISOString(),
      isExpired,
      scope: tokens.scope,
      status: isExpired ? 'Token expired' : 'Token valid'
    };
  }
}

// Export using named export (already done at class declaration)
