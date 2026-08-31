# Firebase Configuration Availability Report

**Repository:** `mozemedia5/Hanna-Agent`  
**Production URL recorded in GitHub:** `https://hanna-agent.vercel.app`
**Review date:** 31 August 2026  
**Author:** Manus AI

## Executive diagnosis

The production host target domain for Hanna is set to `https://hanna-agent.vercel.app`. Direct requests to [`https://hanna-agent.vercel.app/api/config`][1] and [`https://hanna-agent.vercel.app/`][2] serve the application and configuration endpoints once Vercel environment variables are populated and deployed.

> **Root cause:** the configured Vercel alias is stale, detached, deleted, or otherwise pointing to a deployment that no longer exists. Vercel environment variables can be present in a project, but they cannot affect a missing deployment. Vercel documents that variables are read during the build step or Function execution and that changes apply only to new deployments.[3]

## Evidence and request path

| Layer | Expected behavior | Observed behavior | Finding |
|---|---|---|---|
| Browser client | Fetch `/api/config` before initializing Firebase | The client calls `fetch("/api/config")` | Correct endpoint contract |
| Vercel route | Rewrite `/api/:path*` to `api/index.ts` | `vercel.json` declares this rewrite | Correct for a valid deployment; rewrites only matter after a deployment is serving traffic. Vercel describes rewrites as routing requests to another destination without changing the browser URL.[4] |
| Server Function | Return Firebase public config from `process.env` | Original code returned empty strings when variables were missing | Failure was silently masked as a generic client error |
| Production host | Serve the app and `/api/config` | Both return `DEPLOYMENT_NOT_FOUND` | The current alias is not attached to a live deployment |
| Firebase SDK | Receive `apiKey`, `authDomain`, `projectId`, and `appId` | Never reached in production because config fetch fails | Firebase is downstream of the Vercel failure |

Firebase’s web setup requires a registered web app configuration object to initialize the JavaScript SDK.[5] The values are browser configuration values, not Firebase Admin secrets, so exposing the public config through a controlled endpoint is appropriate; the important requirement is that the endpoint is served by the intended deployment.

## Code issues found

The original implementation had three weaknesses. First, the client only tried `/api/config`, so any stale alias, missing rewrite, or static-only deployment produced the generic message `Firebase configuration is unavailable.` Second, the server used `process.env.X || ""` for every field and always returned HTTP 200, which made an incomplete Vercel environment look like a valid response until Firebase initialization failed later. Third, the code only recognized the `FIREBASE_*` server naming convention, while Vercel projects are often configured with `VITE_FIREBASE_*` or `NEXT_PUBLIC_FIREBASE_*` names depending on the originating frontend setup.

## Fix implemented

The repository now includes a shared `server/firebaseConfig.ts` resolver. It accepts `FIREBASE_*`, `VITE_FIREBASE_*`, and `NEXT_PUBLIC_FIREBASE_*` aliases, trims values, and validates the required browser fields: `apiKey`, `authDomain`, `projectId`, and `appId`.

The `/api/config` function now returns **503** with a `missing` field when required values are absent instead of returning a misleading 200 response. It also supports both `/api/config` and `/config` because a Vercel rewrite may preserve or strip the `/api` prefix depending on the project routing shape.

The Vite build now inlines the same environment aliases as a browser-safe fallback. The client first tries the API endpoint, validates the JSON response, then falls back to the build-time `VITE_FIREBASE_*` values. If both paths fail, the error now includes the actual endpoint failure detail instead of hiding it behind a generic message.

## Deployment conclusion

The code-side failure is fixed and the changes are ready for a fresh Vercel deployment. The old production alias must still resolve to a real Vercel project/deployment. If the alias continues to return `DEPLOYMENT_NOT_FOUND` after the next push, the remaining issue is entirely in Vercel project/domain wiring: reconnect the GitHub repository to the intended Vercel project or update the repository’s production URL to the current Vercel domain, then redeploy the `main` branch. Also confirm each Firebase variable is scoped to **Production**; Vercel states that environment-variable changes apply only to new deployments.[3]

## Verification performed

The repository passes `pnpm check` and `pnpm build:client` after the fix. The production endpoint was independently tested before the fix and returned the documented `DEPLOYMENT_NOT_FOUND` response, confirming that the failure occurs before Firebase configuration can be read. The changes will be committed and pushed to `main` so a connected Vercel project can create a new production deployment.

## References

[1]: https://hanna-agent.vercel.app/api/config "Hanna production Firebase configuration endpoint"
[2]: https://hanna-agent.vercel.app/ "Hanna production homepage"
[3]: https://vercel.com/docs/environment-variables "Vercel — Environment variables"
[4]: https://vercel.com/docs/routing/rewrites "Vercel — Rewrites on Vercel"
[5]: https://firebase.google.com/docs/web/setup "Firebase — Add Firebase to your JavaScript project"
