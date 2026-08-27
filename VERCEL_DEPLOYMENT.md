# Vercel deployment notes

The supplied deployment artifact is a bundled Express server, not a complete Vercel error trace. Its relevant behavior is that `server/_core/index.ts` creates an HTTP listener and searches for a local port before calling `server.listen`. That process-oriented entrypoint works on the Manus managed runtime but is not the correct request handler for Vercel Functions.

This repository now includes `api/index.ts`, which creates the Express app without opening a port and exports it as the Vercel function handler. The handler reuses the existing Manus OAuth routes, storage proxy, and tRPC router. `vercel.json` routes `/api/*` requests to that handler and serves the Vite output from `dist/public`. The Manus entrypoint remains unchanged for Manus hosting.

Configure the deployment with the same server-side variables used by the Manus project: `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`. Do not place user provider keys in Vercel environment variables or browser code. Users enter their own keys through the Settings modal; protected backend procedures encrypt them and store only encrypted values plus masked hints.

If Vercel still reports a failure after these changes, capture the deployment's **Build Logs** and **Function Logs** rather than only the generated bundle. The bundle itself contains normal source strings such as `Failed to connect` and `OAUTH_SERVER_URL is not configured`; those strings are not, by themselves, evidence of a runtime failure.
