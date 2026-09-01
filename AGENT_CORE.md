# Hanna Agent Core

Hanna now has a provider- and integration-independent foundation for agentic execution. The core is deliberately organized around capabilities rather than hard-coded provider names.

## Architecture

```text
Hanna UI → tRPC/API → Agent Core → Model adapter
                         ↓
                 DynamicToolRegistry
                         ↓
                 ToolExecutionEngine
                         ↓
                 Native adapter or MCP adapter
```

`DynamicToolRegistry` accepts tool definitions at runtime. A tool definition contains its identity, provider, capabilities, schemas, availability, risk level, required scopes, and execution adapter. New tools can be registered without changing the planner or runtime. `discover(capability)` returns only currently available tools matching a capability.

`ToolExecutionEngine` is the security boundary between model decisions and side effects. It rejects missing or unavailable tools, blocks approval-required tools until explicitly approved, applies execution timeouts, and returns normalized success/error results. It never executes arbitrary model-provided code.

`runAgentLoop` provides a bounded multi-step execution loop. It lets a model decision call a registered tool, feeds the normalized result into the next decision, supports confirmation pauses, and stops at configured step, tool-call, or wall-clock limits. Only safe summaries belong in user-visible activity; hidden chain-of-thought is not exposed.

`runAgentCore` remains the compatibility entrypoint used by Hanna's existing chat procedure. It preserves the current provider-selection and approval behavior while using the richer registry and loop primitives for future native and MCP integrations.

## Adding a tool

Register a definition from an adapter or plugin:

```ts
registry.register({
  id: "commerce.product.search",
  label: "Search products",
  description: "Find products in the connected commerce provider.",
  provider: "shopify",
  capabilities: ["commerce.product.read"],
  requiresApproval: false,
  scopes: ["products:read"],
  riskLevel: "low",
  readOnly: true,
  execute: async (arguments_, context) =>
    adapter.searchProducts(arguments_, context),
});
```

Shopify, GitHub, Vercel, Render, Cloudinary, Google, Gmail, Instagram, TikTok, advertising, and other integrations should enter through this same adapter contract. MCP-discovered tools should be normalized into the same `AgentTool` shape.

## Deployment

The Vercel function entrypoint is `api/index.ts`, while `server/_core/index.ts` remains the local listener. Server-only secrets must be configured in Vercel project environment variables. In particular, `HANNA_ENCRYPTION_KEY` is required before storing credentials; provider and integration secrets must not use `VITE_*` variables or be committed to Git.

The current credential stores are development-only process-local seams pending the Firebase/Firestore adapter. They are intentionally not presented as durable production persistence. Replace those methods with a user/workspace-scoped database adapter before relying on credentials across serverless invocations.

## Verification

Run:

```bash
pnpm check
pnpm test
pnpm build
```

The dynamic registry regression test demonstrates that a new tool can be added after registry creation and executed without modifying the agent runtime.
