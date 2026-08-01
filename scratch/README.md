# scratch/

Inherited one-off development and debugging scripts (from the upstream repo and this fork's
development). **These are not an automated test suite** — there is no test runner wired up, and
each script hardcodes example IDs (now replaced with `YOUR_SCRIPT_ID_HERE` placeholders).

They are kept for reference only and are excluded from the runtime server (nothing under
`lib/`, `tools/`, or `mcpServer.js` imports from here). Safe to delete if you don't want them.

- `helpers/` — ad-hoc web-app deployment scripts written while building the server.
- `test/` — manual API probes and debugging scripts (OAuth checks, deployment fixes, etc.).
