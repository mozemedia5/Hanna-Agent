# Hanna provider architecture

Hanna keeps provider credentials out of browser code and client-side configuration. The Settings workspace submits a user-provided key to a protected tRPC procedure. The server encrypts the value with AES-256-GCM using the existing server-side `JWT_SECRET`, stores only the encrypted payload and a safe key hint in the database, and returns masked metadata. Raw keys are never returned by list procedures.

The temporary implementation continues to use Manus built-in LLM infrastructure for the Hanna assistant. The routing layer is isolated in `server/hannaRouting.ts`, so provider adapters can be introduced without rewriting the UI. The initial provider catalog includes Gemini, OpenAI, Anthropic, Llama/Groq, Cloudinary, Jules, Stitch, v0, and an extensible future-provider slot.

When Firebase is added, replace the persistence functions in `server/providerDb.ts` with Firebase Admin SDK calls. Keep the same server-only contract: authenticate the user, encrypt or use a managed server-side secret store, authorize access by user ID, and return only masked metadata. Cloudinary and other media services should be called from backend adapters, never from client-side components. Provider-specific API calls should be implemented behind a common adapter interface so Hanna can select a capability and provider without exposing credentials to Vercel/browser bundles.

The current UI intentionally supports connection state, key entry, save, disconnect, provider categories, secure notices, and future-provider extensibility. It requires Manus authentication before a credential can be saved.
