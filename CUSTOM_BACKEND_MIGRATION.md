# Firebase backend migration

Hanna uses a provider-independent agent path and keeps provider/workspace SQL tables preserved for safe migration. The current provider and settings helpers use a backend-only runtime store as a temporary bridge; replace those functions with Firebase Admin Auth, Firestore, and Cloud Storage adapters before production use.

The active agent path requires a user-owned provider key. Hanna routes requests through the provider adapter layer and returns a safe configuration message when no key is available. External writes are approval-gated by the Agent Core.

The integrations catalog includes Shopify, Slack, WhatsApp Business, TikTok, Instagram, Meta Graph API, Google Workspace, Gmail, GitHub, Vercel, YouTube, Cloudinary, and generic MCP servers. Each definition declares credential fields, capabilities, and whether approval is required. Connector tokens must be stored and used server-side by the Firebase adapter; never put them in `VITE_*` variables or browser code.

## Required future environment contract

Use server-only variables for Firebase Admin credentials and storage configuration. The project intentionally does not commit values:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `HANNA_ENCRYPTION_KEY`

Until these are configured and the Firebase adapter is supplied, provider credentials are process-local and should be treated as development-only. The existing SQL tables remain intact for safe migration and can be retired later after a verified export.
