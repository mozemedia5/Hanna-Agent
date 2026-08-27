# Vercel deployment notes

Hanna’s Vercel entrypoint is `api/index.ts`. It creates the Express application without opening a port and exports the request handler expected by Vercel Functions. The local development bootstrap remains in `server/_core/index.ts`, where the development server starts on the platform-provided port.

`vercel.json` routes `/api/*` requests to the serverless handler and serves the Vite output from `dist/public`. The handler exposes the tRPC API under `/api/trpc`.

Configure server-only environment variables for the backend you deploy. The Firebase contract supports `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`, and `HANNA_ENCRYPTION_KEY`. Provider and integration keys are user-owned data and must not be placed in `VITE_*` variables. They should be encrypted and stored by the Firebase adapter, then decrypted only during trusted backend execution.

Until the Firebase adapter is supplied, provider and connector credentials use a development-only process-local store. The existing SQL schema and tables are preserved; no destructive migration is required for deployment. Replace the temporary stores with Firebase/Firestore before relying on credentials across serverless invocations.

If Vercel reports a failure, capture both the deployment **Build Logs** and runtime **Function Logs**. Validate the handler with a request to `/api/trpc`, verify that server-only environment variables are present, and confirm that the deployed build uses the current `api/index.ts` entrypoint.
