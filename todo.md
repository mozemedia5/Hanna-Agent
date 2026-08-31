# Project TODO

- [x] Create a premium responsive application shell with Hanna identity, online/working status, desktop sidebar, mobile navigation, and light/dark theme support.
- [x] Build the Home command center with contextual greeting, Hanna command composer, quick actions, active work, recent projects, and recent activity.
- [x] Build the Hanna workspace with readable conversation UI, operational activity panel, model-routing summary, tool execution cards, and composer controls.
- [x] Add navigable workspace views for Projects, Tasks, Knowledge, Files, Apps & Integrations, AI Models, Marketing, Commerce, Automations, Developer, Activity, and Settings.
- [x] Add interactive task/project/knowledge/file cards with progressive disclosure and clear placeholder states for future capabilities.
- [x] Add server-side Hanna orchestration endpoint using user-owned provider adapters without exposing credentials to the client.
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
- [x] Add a Vitest case for hanna.ask covering a provider adapter rejection and safe error behavior.
- [x] Replace CollectionView alert handlers with real in-app deferred-state dialogs for Projects, Tasks, Knowledge, and Files.
- [x] Add a caller().hanna.ask rejection test that verifies the safe error response from the actual tRPC procedure.

# Upgrade TODO

- [x] Upgrade Hanna chat to a richer ChatGPT-style workspace with conversation history, search, rename/archive affordances, markdown/code actions, and working composer controls.
- [x] Add a polished dark theme with persisted theme preference and accessible contrast across all workspaces.
- [x] Add user-managed provider/API key fields for Gemini, OpenAI, Anthropic, Llama, Cloudinary, Jules, Stitch, v0, and extensible custom providers.
- [x] Store provider credentials only through backend procedures, encrypt at rest with server-side secrets, and return masked metadata to the client.
- [x] Add backend provider abstraction for user-owned providers without client-side API calls.
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
- [x] Add Vercel-compatible serverless entrypoint/configuration for the custom backend seam.
- [x] Add/update tests for the settings flow and deployment-safe imports.
- [x] Run checks, save a checkpoint, and push the update to Hanna-Agent on GitHub.

# Vercel final verification

- [x] Add a deployment troubleshooting document describing the Vercel serverless entrypoint, required environment variables, and the supplied bundle-output diagnosis.
- [x] Add tests for settings/provider save, disconnect, connection-test, and masked-key behavior.
- [x] Add a lightweight test validating the Vercel serverless entrypoint wiring and rerun the full suite.

# Chat API-key validation update

- [x] Detect missing or invalid API-key/provider configuration before sending a chat request.
- [x] Show an inline chat error with clear recovery guidance and a direct settings action.
- [x] Add visual warning/disabled states to the composer and provider routing indicator.
- [x] Add tests for missing-key and invalid-key error behavior.
- [x] Run checks, save a checkpoint, and push the update to Hanna-Agent on GitHub.

# Browser error repair

- [x] Diagnose the attached browser error and locate the broken component prop/state contract.
- [x] Repair the chat composer/API-key error state without removing secure backend provider handling.
- [x] Add a regression test for the repaired error-state contract.
- [x] Run TypeScript, tests, production build, and live preview verification.
- [x] Save a checkpoint and push the validated fix to Hanna-Agent on GitHub.
- [x] Add a frontend regression test for the repaired Composer error-state contract, including visible error guidance, disabled send, settings action, and error clearing on input.
- [x] Extract and test the actual pre-send missing-provider-key decision used by Home.submit.
- [x] Extract and test the actual backend provider-failure response decision used by Home.submit.
- [x] Save a fresh checkpoint and push the validated chat API-key error fix to Hanna-Agent on GitHub.

# Agent core and shared brief update

- [x] Implement a server-side Hanna Agent Core with understand, plan, decide, execute, and verify stages.
- [x] Add provider-agnostic model routing for Gemini, Groq, Mistral, OpenRouter, and future user-owned providers.
- [x] Add a typed tool registry with permission scopes, approval requirements, execution status, and verification results.
- [x] Add multi-step plan stages and progress traces for file analysis, summarization, question generation, and other agent workflows.
- [x] Add a functional Human Biology-style example plan that plans PDF analysis and 20-question generation without fabricating tool results.
- [x] Repair the browser runtime error from the supplied artifact and preserve the secure Composer API-key error behavior.
- [x] Add regression tests for Agent Core stages, tool approval boundaries, provider fallback, and the browser error.
- [x] Run TypeScript, tests, production build, live preview verification, save a checkpoint, and push to Hanna-Agent on GitHub.

# Firebase, Cloudinary, and Vercel integration migration

- [x] Use Firebase-ready authentication, data, and storage interfaces with explicit environment-variable contracts, without committing credentials.
- [x] Add secure user-owned provider fields for Gemini, OpenAI, Anthropic, Groq/Llama, Mistral, OpenRouter, and custom OpenAI-compatible models.
- [x] Add an extensible integrations catalog for Shopify, Slack, WhatsApp, TikTok, Instagram, Meta, Google Workspace, Gmail, GitHub, Vercel, YouTube, Cloudinary, and generic MCP-style connectors.
- [x] Add backend-only credential/token handling and connector capability/permission metadata; do not expose raw secrets to the browser.
- [x] Migrate Agent Core to the custom provider and integration contracts with approval-gated tool execution.
- [x] Preserve provider, workspace, and user data tables while moving runtime ownership to Firebase-compatible adapters.
- [x] Add tests for runtime imports, provider/integration catalog behavior, Firebase contract validation, and agent routing.
- [x] Run TypeScript, tests, production build, and live preview verification; save a checkpoint and push the migration to GitHub.

# Safe Firebase migration scope

- [x] Preserve providerCredentials, workspaceSettings, and existing user data; do not execute destructive SQL.
- [x] Keep Firebase-ready provider, integration, and Agent Core contracts active without exposing credentials.
- [x] Verify the app remains functional, run tests/build, and save a new checkpoint; the migration is pushed to GitHub.

# Final Firebase runtime audit

- [x] Use the Firebase authentication seam while keeping the app runnable in unauthenticated mode.
- [x] Remove legacy cookie-based authentication and document the Firebase replacement path.
- [x] Keep provider/workspace SQL tables preserved while preparing the Firebase migration.
- [x] Add focused Firebase contract tests and an import audit test for active server/API entrypoints.
- [x] Re-run full checks/build/live preview and push the migration to GitHub.
- [x] Default Hanna to the polished dark theme while preserving a user’s explicit light-mode preference.

# Authenticated Shopify and Slack connector execution

- [x] Add backend-only encrypted credential records and connector-specific authentication contracts for Shopify and Slack.
- [x] Add typed Shopify and Slack action handlers with least-privilege scopes, approval requirements, and verification results.
- [x] Add approval-gated tRPC procedures and UI controls for previewing, approving, executing, and verifying connector actions.
- [x] Add tests proving tokens never reach client responses, unapproved writes never execute, and successful actions are verified.
- [x] Document Shopify store connection requirements, Slack OAuth/token requirements, local setup, and Firebase migration notes.
- [x] Run TypeScript, tests, build, live connector-flow verification, save a checkpoint, and push the changes to Hanna-Agent on GitHub.

# Direct GitHub Settings Update

- [x] Inspect the current Hanna-Agent frontend Settings and connection-management contracts.
- [x] Add a unified Settings area for app integrations, connectors, API keys, MCPs, and related connection controls.
- [x] Preserve existing backend/server implementation and existing test contracts unless frontend wiring requires a compatible change.
- [x] Run type checks, tests, and production build against Hanna-Agent.
- [x] Commit and push the verified changes to the Hanna-Agent GitHub repository.

# Production Build Repair

- [x] Inspect the failed main-branch GitHub check and its exact production-build error (GitHub status APIs were unavailable to the current token).
- [x] Reproduce the failure locally in the Hanna-Agent checkout (the local production build passes).
- [x] Inspect and harden the repository-side deployment configuration and build entrypoints.
- [x] Fix any reproducible deployment mismatch without unnecessary backend or database changes.
- [x] Run TypeScript checks, tests, and production build after the repair.
- [ ] Push the verified repair to the main branch.
