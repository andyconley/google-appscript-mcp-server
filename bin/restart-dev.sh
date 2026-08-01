#!/usr/bin/env bash
# Restart helper for the stdio MCP server.
#
# A stdio MCP server's lifecycle is owned by the MCP client (e.g. Claude
# desktop): it cannot restart itself, and the client does the initialize
# handshake once. This script only KILLS the running mcpServer.js process(es).
# The client then respawns a fresh process (running updated code) on its next
# call / reconnect.
#
# For tool-file edits you usually don't need this at all — call the reload_tools
# management tool instead (DEV_TOOLS=1). Use this for core changes (mcpServer.js,
# lib/*, scopes).
set -euo pipefail

pids=$(pgrep -f "mcpServer.js" || true)
if [ -z "$pids" ]; then
  echo "No running mcpServer.js process found."
  exit 0
fi

echo "Killing mcpServer.js process(es): $pids"
# shellcheck disable=SC2086
kill $pids
echo "Done. Your MCP client will respawn the server (with updated code) on its next call/reconnect."
