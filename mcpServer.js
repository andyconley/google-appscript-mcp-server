#!/usr/bin/env node

import dotenv from "dotenv";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { discoverTools } from "./lib/tools.js";
import { logger } from "./lib/logger.js";
import { setReloadHandler } from "./lib/devControl.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const SERVER_NAME = "generated-mcp-server";

function transformTools(tools) {
  logger.info('SETUP', `Transforming ${tools.length} discovered tools`);
  const transformedTools = tools
    .map((tool) => {
      const definitionFunction = tool.definition?.function;
      if (!definitionFunction) {
        logger.warn('SETUP', `Tool missing definition function`, { toolPath: tool.path });
        return;
      }
      logger.debug('SETUP', `Transformed tool: ${definitionFunction.name}`, {
        name: definitionFunction.name,
        description: definitionFunction.description,
        requiredParams: definitionFunction.parameters?.required || []
      });
      return {
        name: definitionFunction.name,
        description: definitionFunction.description,
        inputSchema: definitionFunction.parameters,
      };
    })
    .filter(Boolean);
  
  logger.info('SETUP', `Successfully transformed ${transformedTools.length} tools`);
  return transformedTools;
}

async function setupServerHandlers(server, state) {
  // `state` is a shared, mutable holder ({ tools, transformed }). Handlers read
  // it dynamically so reload_tools can swap in freshly-discovered tools without
  // a process restart. Normal operation just reads the values set at startup.
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info('REQUEST', `Handling ListTools request; returning ${state.transformed.length} tools`);
    return { tools: state.transformed };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const startTime = Date.now();
    const requestId = logger.generateRequestId();
    const toolName = request.params.name;
    const args = request.params.arguments;
    
    logger.info('REQUEST', `CallTool request received`, {
      requestId,
      toolName,
      arguments: args,
      timestamp: new Date().toISOString()
    });

    const tool = state.tools.find((t) => t.definition.function.name === toolName);
    if (!tool) {
      logger.error('REQUEST', `Tool not found: ${toolName}`, {
        requestId,
        availableTools: state.tools.map(t => t.definition.function.name)
      });
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }

    const requiredParameters = tool.definition?.function?.parameters?.required || [];
    
    // Validate required parameters
    for (const requiredParameter of requiredParameters) {
      if (!(requiredParameter in args)) {
        logger.error('REQUEST', `Missing required parameter`, {
          requestId,
          toolName,
          missingParameter: requiredParameter,
          providedArgs: Object.keys(args)
        });
        throw new McpError(
          ErrorCode.InvalidParams,
          `Missing required parameter: ${requiredParameter}`
        );
      }
    }

    try {
      logger.info('EXECUTION', `Executing tool: ${toolName}`, {
        requestId,
        toolPath: tool.path,
        validatedArgs: args
      });

      const result = await tool.function(args);
      const duration = Date.now() - startTime;

      // Unified failure contract: tools signal failure by returning a
      // truthy `error` field. Surface that to the client via MCP's isError
      // flag so a failed call is never mistaken for a successful one.
      const isError = !!(result && typeof result === 'object' && result.error);

      // Serialize once and reuse for both the response body and log metrics.
      const resultText = JSON.stringify(result, null, 2);

      logger.info('EXECUTION', `Tool execution completed`, {
        requestId,
        toolName,
        duration: `${duration}ms`,
        resultType: typeof result,
        resultSize: resultText.length,
        isError
      });

      // Log detailed result for debugging
      logger.debug('EXECUTION', `Tool result details`, {
        requestId,
        toolName,
        result: result
      });

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
        isError,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('EXECUTION', `Tool execution failed`, {
        requestId,
        toolName,
        duration: `${duration}ms`,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        args: args
      });

      console.error("[Error] Tool execution threw:", error);

      // Return a model-visible error result (isError) rather than throwing a
      // protocol-level McpError, so a thrown failure and a returned
      // { error: true } failure look identical to the client.
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: true, message: error.message, name: error.name },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });
}

async function run() {
  const args = process.argv.slice(2);
  const isSSE = args.includes("--sse");
  
  logger.info('STARTUP', `Starting MCP server in ${isSSE ? 'SSE' : 'STDIO'} mode`);
  
  const tools = await discoverTools();
  logger.info('STARTUP', `Discovered ${tools.length} tools`, {
    toolPaths: tools.map(t => t.path),
    toolNames: tools.map(t => t.definition?.function?.name).filter(Boolean)
  });

  // Shared mutable state read by all handlers. reload_tools swaps these in place.
  const state = { tools, transformed: transformTools(tools) };

  // Let the reload_tools management tool re-discover tools without a restart.
  setReloadHandler(async () => {
    const fresh = await discoverTools({ bustCache: true });
    state.tools = fresh;
    state.transformed = transformTools(fresh);
    logger.info('RELOAD', `Reloaded ${fresh.length} tools`);
    return { toolCount: fresh.length, toolNames: fresh.map(t => t.definition.function.name) };
  });

  if (isSSE) {
    const app = express();
    const transports = {};
    const servers = {};
    let sessionCounter = 0;

    app.get("/sse", async (_req, res) => {
      // Monotonic counter avoids the collision two connections in the same
      // millisecond would hit with a Date.now()-based id.
      const sessionId = `sse_${++sessionCounter}`;
      logger.info('SSE', `New SSE connection established`, { sessionId });
      
      // Create a new Server instance for each session
      const server = new Server(
        {
          name: SERVER_NAME,
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      
      server.onerror = (error) => {
        logger.error('SSE', `Server error for session ${sessionId}`, error);
        console.error("[Error]", error);
      };
      
      await setupServerHandlers(server, state);

      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;
      servers[transport.sessionId] = server;

      res.on("close", async () => {
        logger.info('SSE', `SSE connection closed`, { sessionId: transport.sessionId });
        delete transports[transport.sessionId];
        await server.close();
        delete servers[transport.sessionId];
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId;
      const transport = transports[sessionId];
      const server = servers[sessionId];

      if (transport && server) {
        logger.debug('SSE', `Processing message for session`, { sessionId });
        await transport.handlePostMessage(req, res);
      } else {
        logger.warn('SSE', `No transport/server found for session`, { sessionId });
        res.status(400).send("No transport/server found for sessionId");
      }
    });

    const port = process.env.PORT || 3001;
    // Bind to loopback by default: these endpoints are UNAUTHENTICATED and act
    // with the user's Google OAuth token, so exposing them on a network
    // interface would be an open proxy to their account. Override with
    // SSE_HOST=0.0.0.0 only behind your own auth/proxy.
    const host = process.env.SSE_HOST || '127.0.0.1';
    app.listen(port, host, () => {
      logger.info('SSE', `SSE server running on ${host}:${port}`);
      console.error(`[SSE Server] running on ${host}:${port}`);
    });
  } else {
    // stdio mode: single server instance
    logger.info('STDIO', 'Initializing STDIO server');
    
    const server = new Server(
      {
        name: SERVER_NAME,
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    server.onerror = (error) => {
      logger.error('STDIO', 'Server error', error);
      console.error("[Error]", error);
    };
    
    await setupServerHandlers(server, state);

    process.on("SIGINT", async () => {
      logger.info('STDIO', 'Received SIGINT, shutting down gracefully');
      await server.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    logger.info('STDIO', 'STDIO server ready for connections');
    await server.connect(transport);
  }
}

run().catch(console.error);
