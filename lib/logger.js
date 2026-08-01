/**
 * Enhanced logging utility for MCP server tool responses
 */

export class MCPLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enabledLevels = this.getEnabledLevels();
  }

  getEnabledLevels() {
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    const currentIndex = levels.indexOf(this.logLevel);
    return currentIndex >= 0 ? levels.slice(0, currentIndex + 1) : levels;
  }

  shouldLog(level) {
    return this.enabledLevels.includes(level);
  }

  formatMessage(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`;
    
    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  log(level, category, message, data = null) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, category, message, data);

    // In stdio MCP mode, stdout is the JSON-RPC channel — ALL diagnostic
    // logging must go to stderr, never stdout, or it corrupts the protocol.
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      process.stderr.write(formattedMessage + '\n');
    }
  }

  // Tool-specific logging methods
  logToolRequest(toolName, args) {
    this.log('info', 'TOOL_REQUEST', `Executing tool: ${toolName}`, {
      tool: toolName,
      arguments: args,
      requestId: this.generateRequestId()
    });
  }

  logToolResponse(toolName, response, duration, requestId) {
    this.log('info', 'TOOL_RESPONSE', `Tool completed: ${toolName}`, {
      tool: toolName,
      duration: `${duration}ms`,
      requestId,
      responseSize: JSON.stringify(response).length,
      success: !response.error
    });
  }

  logToolError(toolName, error, duration, requestId) {
    this.log('error', 'TOOL_ERROR', `Tool failed: ${toolName}`, {
      tool: toolName,
      duration: `${duration}ms`,
      requestId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }

  logAPICall(method, url, headers, body = null) {
    this.log('debug', 'API_CALL', `Making API request: ${method} ${url}`, {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
    });
  }

  logAPIResponse(method, url, status, responseTime, responseSize) {
    this.log('debug', 'API_RESPONSE', `API response: ${method} ${url}`, {
      method,
      url,
      status,
      responseTime: `${responseTime}ms`,
      responseSize: `${responseSize} bytes`
    });
  }

  logAuthentication(type, success, details = {}) {
    this.log('info', 'AUTH', `Authentication ${type}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      type,
      success,
      ...details
    });
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***REDACTED***';
    }
    return sanitized;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods
  error(category, message, data) {
    this.log('error', category, message, data);
  }

  warn(category, message, data) {
    this.log('warn', category, message, data);
  }

  info(category, message, data) {
    this.log('info', category, message, data);
  }

  debug(category, message, data) {
    this.log('debug', category, message, data);
  }

  trace(category, message, data) {
    this.log('trace', category, message, data);
  }
}

// Create a singleton instance
export const logger = new MCPLogger();

// Performance tracking decorator for tool functions
export function withLogging(toolName, originalFunction) {
  return async function(...args) {
    const requestId = logger.generateRequestId();
    const startTime = Date.now();
    
    try {
      logger.logToolRequest(toolName, args[0] || {});
      
      const result = await originalFunction.apply(this, args);
      const duration = Date.now() - startTime;
      
      logger.logToolResponse(toolName, result, duration, requestId);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logToolError(toolName, error, duration, requestId);
      throw error;
    }
  };
}
