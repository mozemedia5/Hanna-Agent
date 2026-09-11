# Hanna AI Response & Diagnostic Report

## Executive Summary
This document analyzes the AI request pipeline in Hanna, explains the potential root causes whenever Hanna fails to respond or returns an error, and documents the fixes and verifications applied to resolve these issues and align with model naming specifications.

---

## Why Hanna May Not Respond (Root Causes)

1. **Missing or Unconfigured Primary API Key (`GEMINI_API_KEY`)**
   - **Diagnosis:** Hanna defaults to running on proprietary models (`Hanna Lite` backed by `gemini-2.5-flash` and `Hanna Pro` backed by `gemini-3.6-flash`). If `GEMINI_API_KEY` is missing in the backend environment and no custom provider key has been saved in Connectors, requests throw an unhandled key error.
   - **Impact:** `executeHannaRequest` returns an error status or exception, causing the chat frontend to display a fallback message.

2. **Daily Allowance / Quota Exhaustion (`consumeDailyTokens`)**
   - **Diagnosis:** The daily token allowance tracking (`300` tokens/day for `Hanna Lite` free tier and `1500` tokens/day for `Hanna Pro`) blocks requests when exceeded unless the user attaches their own API key.
   - **Impact:** Hanna throws a token limit error message advising the user to connect their own model key in Connectors.

3. **Invalid or Unrecognized Requested Model Name**
   - **Diagnosis:** Previously, user model requests using proprietary names like `Hanna Lite` or `Hanna Pro` were not explicitly mapped to their target underlying Gemini models (`gemini-2.5-flash` and `gemini-3.6-flash`).
   - **Impact:** Mismatched requested model names could fall back to an unexpected provider configuration or fail model routing validation.

4. **Network / Timeout / Upstream Provider Failures**
   - **Diagnosis:** Upstream Gemini API rate limiting (`429`), temporary outages, or response timeouts can cause `invokeUserProvider` to fail.

---

## Fixes & Changes Applied

### 1. Proprietary Engine Model Routing
- **Hanna Lite:** Configured to map directly to `gemini-2.5-flash`.
- **Hanna Pro:** Configured to map directly to `gemini-3.6-flash`.
- **Implementation in `server/aiConfig.ts`:**
  ```typescript
  export const HANNA_LITE_MODEL = "gemini-2.5-flash";
  export const HANNA_PRO_MODEL = "gemini-3.6-flash";

  export function resolveProviderAndModel(requestedModelOrProvider?: string): ResolvedAiPair {
    ...
    const isPro = requestedModelOrProvider?.toLowerCase().includes("pro");
    const targetModel = isPro ? HANNA_PRO_MODEL : HANNA_LITE_MODEL;
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: targetModel,
      isCustom: false,
    };
  }
  ```

### 2. Client Model Selector & Copy Update
- Updated `client/src/pages/Home.tsx` to display **Hanna Lite (Gemini 2.5 Flash)** and **Hanna Pro (Gemini 3.6 Flash)** in the header model picker menu instead of raw Gemini 2.5 Flash labels.
- Updated model references in `ConnectorsPage.tsx`, `UpgradePage.tsx`, and `UsagePage.tsx` to maintain consistent branding.

### 3. Responsive Layout Fix for Integrations & Connectors Descriptions
- Updated `.integration-card-copy span` and `.connector-card-copy span` in `client/src/index.css` to enable clean 2-line wrapping with `-webkit-line-clamp: 2`.
- Added mobile and tablet media query breakpoints (`max-width: 768px` and `max-width: 480px`) so integration/connector cards and actions adapt seamlessly across viewports.

---

## Verification & Test Results
- Ran full unit & integration test suite (`pnpm test`): **17 passed | 1 skipped (70 tests passed)**.
- Performed TypeScript type check (`pnpm check`): **0 errors**.
- Build check (`pnpm build`): Successfully built Vite frontend and server backend artifacts.
