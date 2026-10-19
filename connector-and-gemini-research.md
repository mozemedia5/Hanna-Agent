# Connector and Gemini API findings

## Gemini model and API failures

Google's model catalog lists `gemini-3.6-flash` as a stable Gemini API model. The Gemini 3.6 Flash pricing page lists standard input and output as free of charge on its Free Tier; Search/Maps grounding are not available on that Free Tier. A stable model is therefore a reasonable default for this free-tier target, subject to the user's project eligibility and rate limits.

Google's troubleshooting guide says 403 is a non-retryable client/configuration error and recommends checking API key validity, project/API permissions, and model access. Google also documents that exposed keys may be blocked. 503 is a transient unavailable/service-capacity response and should be retried with exponential backoff and jitter; repeated 503s cannot be fixed by changing permissions.

## Google OAuth and Workspace access

Google recommends the web-server authorization-code flow, validation of a secure `state` value against CSRF, exact redirect-URI matching, and offline access when refresh tokens are needed. Google recommends requesting only the scopes needed for a feature. Public apps using sensitive/restricted Google user-data scopes may require verification. Granular consent can mean a user grants only some requested scopes, so a connector should not be marked connected unless its required scope was actually granted.

## Shopify OAuth

Shopify's standalone-app documentation uses the OAuth authorization-code flow. The callback must validate the state value, verify Shopify's HMAC signature, validate the shop domain, and then exchange the authorization code server-side. Shopify app credentials, redirect URL, and the exact scopes must be configured in the Shopify app dashboard and deployment environment. The repository currently requests a very broad scope list; because its own config comments say it must exactly match the Shopify Dev Dashboard, that scope list must be audited and kept in sync with that app configuration.

## Sources

- [Gemini troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3.6 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash)
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth scope guidance](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Google Workspace authentication overview](https://developers.google.com/workspace/guides/auth-overview)
- [Shopify standalone-app authentication](https://shopify.dev/docs/apps/build/authentication-authorization/authenticate-standalone-apps)


## Deployment prerequisites for the updated connectors

The code reads these credentials from the server environment: `GEMINI_API_KEY` (optional `GEMINI_MODEL`), Google `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` (or the older `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) and optional `GOOGLE_REDIRECT_URI`, plus Shopify `SHOPIFY_OAUTH_CLIENT_ID`, `SHOPIFY_OAUTH_CLIENT_SECRET`, and optional `SHOPIFY_REDIRECT_URI`. Register each exact callback URL in the corresponding Google Cloud / Shopify app configuration. The Google integration requests Drive, Docs, Sheets, Slides, Gmail read/send, and Calendar scopes; enable the corresponding APIs and configure the OAuth consent screen and any required verification. The Shopify repository scope list is unusually broad and includes both Admin and customer/unauthenticated scopes; verify every item against the Shopify Dev Dashboard and reduce to least privilege only together with matching dashboard settings.

In this sandbox, none of `GEMINI_API_KEY`, Google OAuth client credentials, or Shopify OAuth client credentials were configured, so no live Gemini request or third-party OAuth/install flow was run. The local test suite uses mocked API responses for code-path validation; production access still depends on those server-side settings and provider-side app approvals.