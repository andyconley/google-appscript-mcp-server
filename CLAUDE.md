# CLAUDE.md — working conventions for this repo

Guidance for AI coding assistants (and humans) working in this repo. This is a
fork of [mohalmah/google-appscript-mcp-server](https://github.com/mohalmah/google-appscript-mcp-server)
(a Postman-generated MCP server wrapping the Google Apps Script REST API),
maintained by [andyconley](https://github.com/andyconley) with fixes and added
capabilities. Keep upstream credit intact.

## ✅ Pre-commit checklist (do every time)

1. **Tests pass** — run `npm test` (hermetic; no creds/network). Green is required for any code change.
2. **README updated** — if you added/removed/changed anything user-facing (a tool, flag, env var, scope, behavior), update `README.md` in the *same* commit. It's not a changelog — just keep it accurate (feature list, tools table, scopes table, env vars).
3. **Conventional Commit message** — `type(scope): summary` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`). Body explains the *why*. End with:
   `Co-Authored-By: <assistant> <noreply@…>` when authored with an AI assistant.
4. **No secrets** — never stage `.env` or token files (both gitignored). Keep example script/deployment IDs as placeholders (`YOUR_SCRIPT_ID_HERE`), not real ones.
5. **Only commit `package-lock.json` when dependencies actually changed.**
6. Prefer a feature branch; fast-forward merge to `main` when green.

## 🧪 Testing

- `npm test` — hermetic unit + contract tests (`node --test`, no extra deps). Runs offline: auth is faked by seeding the token cache (`_tokenManager`), `fetch` is mocked.
- `npm run test:integration` — opt-in live tests; skipped unless `RUN_INTEGRATION=1` and `INTEGRATION_SCRIPT_ID=<readable scriptId>`.
- **When you add a tool, add a request-shaping test** in `test/tools.test.js` (assert method/URL/encoded-ids/body/error shape). The schema/contract test (`test/schema.test.js`) already guards that every tool in `tools/paths.js` loads with a valid, unique schema — it will fail the build if a tool file is broken.
- Requires Node 18+ (CI uses 22).
- `scratch/` holds inherited one-off debug scripts — **not** a test suite. Keep the `test` script scoped to `test/*.test.js` so `node --test` doesn't pick them up.

## 🏗️ Architecture & conventions (keep these invariants)

- **All API calls go through the shared client** `lib/appsScriptClient.js`. Never inline `fetch`/auth in a tool. Use:
  - `callGoogleApi({ method, url, query, body, label })` — auth + URL build + timeout + retry + error handling.
  - `toToolError(error, ctx)` in every tool's `catch`.
  - `enc` (= `encodeURIComponent`) for **every** path id (`scriptId`, `deploymentId`, `versionNumber`). Raw interpolation is a security bug.
  - `APPS_SCRIPT_BASE` / `DRIVE_BASE`.
- **Uniform failure contract**: tools return `{ error: true, message, details, rawError }`. The CallTool handler maps a truthy `error` to MCP `isError`. Don't invent other shapes.
- **Preserve each tool's `definition` block exactly** when refactoring — MCP clients depend on the schema (name, params, required).
- **stdio safety**: stdout is the JSON-RPC channel. **Never log to stdout.** The logger routes non-error levels to stderr; in server-loaded code use `console.error`, never `console.log`. (`scratch/` CLI scripts may use stdout.)
- **Logging**: log arg *keys + sizes* at info, full args at debug (tool args may contain script source / secrets and can be large).
- **Timeout/retry** live in the client: `REQUEST_TIMEOUT_MS` (default 45000), `RETRY_BACKOFF_MS`. Retry 429 for any method; 5xx/network/timeout only for idempotent GETs (a retried write can duplicate a create).
- **Token handling** in `lib/tokenManager.js`: single-flight refresh + in-memory cache. Don't reintroduce a per-call file read.
- **Adding a tool**: create the file under `tools/google-app-script-api/apps-script-api/`, export `apiTool = { function, definition }`, register it in `tools/paths.js`. Dev/diagnostic tools set `devOnly: true` and are hidden unless `DEV_TOOLS=1`.

## 🔐 OAuth scopes

- Requested scopes live in `SCOPES` in `lib/oauth-helper.js`. Adding a scope requires **re-consent** (`node oauth-setup.js`) — a token only carries scopes granted at consent time.
- Keep the README **OAuth Scopes Reference** table in sync when tools/scopes change.
- `auth_status` (with `DEV_TOOLS=1`) reports granted-vs-requested scopes — the fast way to tell an auth problem (missing scope) from a code problem (endpoint bug).

## 🔁 Restarting & reloading (stdio server)

A stdio MCP server can't restart itself — its lifecycle is owned by the client.
- **Tool-file edits**: call `reload_tools` (`DEV_TOOLS=1`) — hot-reloads without a restart.
- **Core edits** (`mcpServer.js`, `lib/*`, scopes): run `bin/restart-dev.sh` to stop the process; the client respawns fresh code on reconnect.

## 🔀 Remotes

- `origin` → `andyconley/google-appscript-mcp-server` (this fork).
- `upstream` → `mohalmah/google-appscript-mcp-server` (original). Credit upstream in the README fork notice; pull fixes from `upstream` as needed.
