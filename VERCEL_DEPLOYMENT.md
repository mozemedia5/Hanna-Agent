# Vercel deployment notes

Hanna’s Vercel entrypoint is `api/index.ts`. It creates the Express application without opening a port and exports the request handler expected by Vercel Functions. The local development bootstrap remains in `server/_core/index.ts`, where the managed dev server starts the app on the platform-provided port.

`vercel.json` routes `/api/*` requests to the serverless handler and serves the Vite output from `dist/public`. The handler exposes the tRPC API under `/api/trpc`; it does not import Manus OAuth, Manus LLM, Manus storage, or Manus runtime modules.

Configure server-only environment variables for the backend that you actually deploy. The current custom-backend seam supports the following future Firebase contract: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`, and `HANNA_ENCRYPTION_KEY`. Provider keys are user-owned data and must not be placed in `VITE_*` variables or Vercel project secrets as a substitute for the user settings flow. They should be encrypted and stored by the eventual Firebase adapter, then decrypted only in backend request execution.

Until the Firebase adapter is supplied, provider credentials use the development runtime store and are process-local. Treat that mode as development-only. The existing SQL schema and tables are preserved; no destructive migration is required for deployment and no database table is removed by the Manus decoupling work.

If Vercel reports a failure, capture both the deployment **Build Logs** and the runtime **Function Logs**. A generated bundle may contain ordinary diagnostic strings, but those strings alone do not establish a runtime failure. Validate the handler with a request to `/api/trpc`, verify that the server-only environment variables are present, and confirm that the deployed build uses the current `api/index.ts` entrypoint.
