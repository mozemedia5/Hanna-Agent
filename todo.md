# Project TODO

- [x] Create a premium responsive application shell with Hanna identity, online/working status, desktop sidebar, mobile navigation, and light/dark theme support.
- [x] Build the Home command center with contextual greeting, Hanna command composer, quick actions, active work, recent projects, and recent activity.
- [x] Build the Hanna workspace with readable conversation UI, operational activity panel, model-routing summary, tool execution cards, and composer controls.
- [x] Add navigable workspace views for Projects, Tasks, Knowledge, Files, Apps & Integrations, AI Models, Marketing, Commerce, Automations, Developer, Activity, and Settings.
- [x] Add interactive task/project/knowledge/file cards with progressive disclosure and clear placeholder states for future capabilities.
- [x] Add server-side Hanna orchestration endpoint using Manus built-in LLM infrastructure without exposing credentials to the client.
- [x] Add provider-agnostic model catalog/routing presentation for Gemini, OpenAI, Claude, and future providers.
- [x] Add Vitest coverage for the Hanna server procedure and core routing behavior.
- [x] Run tests and visually verify desktop and mobile layouts.
- [x] Save a project checkpoint and create/sync a private GitHub repository named Hanna-Agent.
- [x] Make the Activity sidebar item actually navigate to an Activity workspace view and verify all listed sections are reachable.
- [x] Implement real interactive cards for tasks, projects, knowledge, and files, with click behavior and clear placeholder/empty states where features are deferred.
- [x] Add a visible AI Models and routing UI that presents Gemini, OpenAI, Claude, and future-provider slots, and reflect routing choices dynamically instead of hardcoding Gemini.
- [x] Add Vitest tests for the hanna.ask tRPC/server procedure, including success and fallback/error behavior, alongside the routing tests.
- [x] Wire CollectionView cards for Projects, Tasks, Knowledge, and Files to real click actions or navigation, with intentional deferred-state UX.
- [x] Bind the Hanna workspace routing panel to live routing results so model and capability update dynamically.
- [x] Add a Vitest case for hanna.ask covering an invokeLLM rejection and safe error behavior.
- [x] Replace CollectionView alert handlers with real in-app deferred-state dialogs for Projects, Tasks, Knowledge, and Files.
- [x] Add a caller().hanna.ask rejection test that verifies the safe error response from the actual tRPC procedure.

# Upgrade TODO

- [x] Upgrade Hanna chat to a richer ChatGPT-style workspace with conversation history, search, rename/archive affordances, markdown/code actions, and working composer controls.
- [x] Add a polished dark theme with persisted theme preference and accessible contrast across all workspaces.
- [x] Add user-managed provider/API key fields for Gemini, OpenAI, Anthropic, Llama, Cloudinary, Jules, Stitch, v0, and extensible custom providers.
- [x] Store provider credentials only through backend procedures, encrypt at rest with server-side secrets, and return masked metadata to the client.
- [x] Add backend provider abstraction so agents can route to Manus temporarily and later to user-owned providers without client-side API calls.
- [x] Add functional agent tool controls, approval states, file/context attachment affordances, and provider connection tests.
- [x] Add database schema, query helpers, and tRPC procedures for provider credentials and workspace settings.
- [x] Add Vitest coverage for credential encryption/masking, provider CRUD, routing, and error paths.
- [x] Verify desktop/mobile UX, run checks, save a checkpoint, and commit/push the upgrade to GitHub.

# Final upgrade verification

- [x] Add conversation history/search UI, rename/archive affordances, and message actions in Hanna chat.
- [x] Add extensible custom provider entries beyond the fixed provider catalog.
- [x] Implement tool controls, approval workflow, and provider connection testing.
- [x] Add database-backed workspace settings schema, helpers, and procedures for theme/provider preferences.
- [x] Add Vitest coverage for provider credential save/list/remove procedures.
- [x] Save a fresh post-upgrade checkpoint and create a new git commit/push reflecting the upgraded code.

# Final quality pass

- [x] Add message-level actions in Hanna chat such as copy, save, regenerate, or export.
- [x] Implement a real custom-provider creation flow with user-defined metadata and endpoint fields.
- [x] Add provider connection-test backend procedure and UI, and make tool cards trigger meaningful in-app actions.
- [x] Add Vitest coverage for provider credential CRUD helper behavior.

# Chat rendering enhancement

- [x] Add robust Markdown rendering for Hanna responses, including headings, lists, links, tables, blockquotes, and inline formatting.
- [x] Add syntax highlighting for fenced code blocks with language labels and readable dark code surfaces.
- [x] Add one-click copy buttons to every generated code block with copied-state feedback.
- [x] Add tests for Markdown/code rendering helpers and copy-action behavior where practical.
- [x] Run checks, save a new checkpoint, and push the changes to the Hanna-Agent GitHub repository.

# Vercel and settings modal update

- [x] Diagnose and document the Vercel deployment issue from the supplied output.
- [x] Add a secure settings modal for user-owned API keys with save, disconnect, masking, and connection-test actions.
- [x] Keep all provider calls and credential handling on the backend; never expose raw keys to browser or client bundles.
- [x] Add Vercel-compatible serverless entrypoint/configuration without removing Manus infrastructure.
- [x] Add/update tests for the settings flow and deployment-safe imports.
- [x] Run checks, save a checkpoint, and push the update to Hanna-Agent on GitHub.

# Vercel final verification

- [x] Add a deployment troubleshooting document describing the Vercel serverless entrypoint, required environment variables, and the supplied bundle-output diagnosis.
- [x] Add tests for settings/provider save, disconnect, connection-test, and masked-key behavior.
- [x] Add a lightweight test validating the Vercel serverless entrypoint wiring and rerun the full suite.
