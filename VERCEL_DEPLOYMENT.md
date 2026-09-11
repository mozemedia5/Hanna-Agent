# Vercel deployment notes

Hanna’s Vercel entrypoint is `api/index.ts`. It creates the Express application without opening a port and exports the request handler expected by Vercel Functions. The local development bootstrap remains in `server/_core/index.ts`, where the development server starts on the platform-provided port.

`vercel.json` routes `/api/*` requests to the serverless handler and serves the Vite output from `dist/public`. The handler exposes the tRPC API under `/api/trpc`.

Configure server-only environment variables for the backend you deploy:
- `GEMINI_API_KEY`: Primary Google Gemini API key for default first-party execution.
- `GEMINI_MODEL`: AI model string (defaulting to `gemini-2.5-flash`).
- `HANNA_ENCRYPTION_KEY`: Secret key for AES-256-GCM credential encryption.
- Firebase Configuration: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, and `FIREBASE_APP_ID`.

### Endpoint Contract & Health Verification
All API endpoints on Vercel must return structured JSON rather than generic Vercel HTML crash pages:
- `GET /api` -> `{ "status": "ok", "service": "hanna-agent-api" }`
- `GET /api/health` -> Structured health report JSON (`AI_READY`, `GEMINI_KEY_MISSING`, `GEMINI_AUTH_FAILED`, etc.)
- `GET /api/config` -> Public Firebase client configuration object or 503 status
- `GET /api/mcp` -> MCP server protocol manifest with available tools

If Vercel reports a failure, capture both the deployment **Build Logs** and runtime **Function Logs**. Validate the handler with requests to `/api` and `/api/health`, verify that server-only environment variables are present, and confirm that the deployed build uses the current `api/index.ts` entrypoint.
