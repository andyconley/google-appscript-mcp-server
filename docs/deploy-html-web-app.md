# Deploy an interactive HTML page as a web app

Point any MCP client — Claude Desktop, Claude Code, Codex, VS Code (Cline), anything that
speaks MCP — at this server to publish a self-contained HTML page as a Google Apps Script
web app with a shareable `/exec` URL.

The tool calls are the same everywhere; only the setup differs.

---

## Prerequisites

1. Server installed and OAuth authorized once — `node oauth-setup.js`. See the README [Quick Start](../README.md#-quick-start-guide).
2. Your MCP client configured to launch the server (below).

## Point your MCP client at the server

It's a **stdio** server: every client launches it by running `node` with the absolute
path to `mcpServer.js`. The server loads its OAuth client from its own `.env` and refreshes
the stored token itself, so there's no per-client auth step.

- **Claude Desktop / Claude Code / VS Code (Cline):** see the README [MCP Client Configuration](../README.md#-mcp-client-configuration).
- **Codex CLI** — add to `~/.codex/config.toml`:
  ```toml
  [mcp_servers.google_appscript]
  command = "node"
  args = ["/abs/path/to/google-appscript-mcp-server/mcpServer.js"]
  # Optional diagnostics: env = { DEV_TOOLS = "1" }
  ```
- **Any other MCP client:** register a stdio server, command `node`, one arg = the absolute path to `mcpServer.js`.

**Gotcha:** if the client can't find `node` (common with nvm and GUI-launched clients that
don't inherit your shell PATH), use an absolute node path — run `which node` to get it.

## Where auth lives

The stored token is OS-specific (mode `600`), refreshed automatically:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/google-apps-script-mcp/tokens.json` |
| Linux | `~/.config/google-apps-script-mcp/tokens.json` |
| Windows | `%APPDATA%\google-apps-script-mcp\tokens.json` |

- Whatever client you point at the server **acts as the authorized Google account**, with all
  granted scopes (create/modify/deploy/run any Apps Script project that account can reach).
  Only hand this to a client or session you trust.
- On a **401 "invalid authentication credentials,"** re-authorize with `node oauth-setup.js`.
  Don't let an agent attempt to re-auth on its own.

## The recipe

Tools you'll call: `script_projects_create`, `update_script_content`,
`script_projects_versions_create`, `script_projects_deployments_create`, `get_web_app_url`,
and `publish_web_app` for updates.

### 1. Create a project
`script_projects_create` → `{ "title": "My Interactive Page" }` → note the returned `scriptId`.

### 2. Write three files
`update_script_content` → `{ scriptId, files: [ ...three files... ] }`. Each file is
`{ "name", "type", "source" }`; types are `SERVER_JS`, `HTML`, `JSON`.

**Manifest** — `name: "appsscript"`, `type: "JSON"`:
```json
{
  "timeZone": "America/New_York",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": { "access": "MYSELF", "executeAs": "USER_DEPLOYING" }
}
```
`access`: `MYSELF` | `DOMAIN` | `ANYONE` | `ANYONE_ANONYMOUS`. Use `ANYONE_ANONYMOUS` only if
the page must load with no Google sign-in — that makes it fully public.

**Server** — `name: "Code"`, `type: "SERVER_JS"`:
```javascript
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('My Interactive Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```

**Page** — `name: "Index"`, `type: "HTML"`:
```html
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><style>/* inline CSS */</style></head>
  <body>
    <!-- your interactive page -->
    <script>/* inline JS */</script>
  </body>
</html>
```

Two things that bite people here:
- **The page must be self-contained** — inline CSS/JS. Apps Script serves HTML in a sandboxed
  iframe with a strict CSP, so external scripts/styles may be blocked. Embed assets as data URIs.
- **`update_script_content` replaces the whole project.** Send all three files in one call. To
  edit an existing project later, `script_projects_get_content` first and send the full set back
  — omitting a file deletes it.

### 3. Create a version
`script_projects_versions_create` → `{ scriptId, description: "v1" }` → note `versionNumber`.

### 4. Deploy as a web app
`script_projects_deployments_create` →
`{ scriptId, versionNumber, manifestFileName: "appsscript", description: "web app" }`.
The web-app entry point comes from the manifest's `webapp` block — that's why the manifest matters.

### 5. Get the URL
`get_web_app_url` → `{ scriptId }` → returns the `/exec` URL. That's the live page.

### Updating later (same URL)
`publish_web_app` → `{ scriptId, deploymentId, files: [...updated files...], description }` —
updates content, cuts a version, and repoints the existing deployment, so the URL doesn't change.

## Drop-in prompt

Paste this into the agent after the server is connected:

> Using the `google_appscript` MCP tools, publish an interactive HTML page as a web app:
> 1. `script_projects_create` to make a project; keep the `scriptId`.
> 2. `update_script_content` with three files in one call — an `appsscript` (JSON) manifest with a
>    `webapp` block, a `Code` (SERVER_JS) file whose `doGet()` returns
>    `HtmlService.createHtmlOutputFromFile('Index')`, and an `Index` (HTML) file with a
>    self-contained page (inline CSS/JS only).
> 3. `script_projects_versions_create`, then `script_projects_deployments_create` with
>    `manifestFileName: "appsscript"`.
> 4. `get_web_app_url` and return the `/exec` link.
> If any call returns 401, stop and tell me — do not re-authenticate.

## Notes

- A plain `doGet` that only returns HTML needs no extra OAuth scopes, so it won't trigger an
  authorization prompt. Code that touches Sheets/Drive/etc. may require the deploying user to
  authorize once.
- Default the access level to `MYSELF` or `DOMAIN` unless public access is intended.
