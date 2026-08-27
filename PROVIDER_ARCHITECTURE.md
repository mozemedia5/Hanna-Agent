# Provider architecture

Hanna keeps provider credentials out of browser code and client-side configuration. The Settings workspace submits a user-provided key to a protected tRPC procedure. The server encrypts the value with AES-256-GCM using the server-side `HANNA_ENCRYPTION_KEY`, stores only the encrypted payload and a safe key hint, and returns masked metadata. Raw keys are never returned by list procedures.

The routing layer is isolated in `server/hannaRouting.ts`, and provider adapters can be introduced without rewriting the UI. The initial provider catalog includes Gemini, OpenAI, Anthropic, Llama/Groq, Cloudinary, and extensible future-provider slots.

When Firebase is connected, replace the persistence functions in `server/providerDb.ts` with Firebase Admin SDK calls. Keep the same server-only contract: authenticate the user with Firebase Auth, encrypt or use a managed server-side secret store, authorize access by user ID, and return only masked metadata. Cloudinary and other media services should be called from backend adapters, never from client-side components. Provider-specific API calls should remain behind a common adapter interface so Hanna can select a capability and provider without exposing credentials to browser bundles.

The current UI supports connection state, key entry, save, disconnect, provider categories, secure notices, and future-provider extensibility. Authentication is represented by the Firebase auth seam in `client/src/_core/hooks/useAuth.ts` and `server/_core/context.ts`.
