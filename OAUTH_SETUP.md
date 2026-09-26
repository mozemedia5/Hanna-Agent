# OAuth API Integration

Hanna Agent supports real OAuth 2.0 for connector authorization. Tokens are exchanged **server-side only**, encrypted with the existing AES-256-GCM credential store, and never returned to the browser.

## Supported OAuth providers

| Provider | Connectors covered | Env vars |
|----------|-------------------|----------|
| Google | google-workspace, gmail, drive, docs, sheets, slides, calendar, youtube, google-ads | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` |
| GitHub | github | `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` |
| Slack | slack | `SLACK_OAUTH_CLIENT_ID`, `SLACK_OAUTH_CLIENT_SECRET` |
| Meta | instagram, facebook, meta-ads, threads, whatsapp | `META_OAUTH_CLIENT_ID`, `META_OAUTH_CLIENT_SECRET` |
| Shopify | shopify | `SHOPIFY_OAUTH_CLIENT_ID`, `SHOPIFY_OAUTH_CLIENT_SECRET` |
| X | x (Twitter) | `X_OAUTH_CLIENT_ID`, `X_OAUTH_CLIENT_SECRET` |
| TikTok | tiktok, tiktok-ads | `TIKTOK_OAUTH_CLIENT_KEY`, `TIKTOK_OAUTH_CLIENT_SECRET` |

API-key style connectors (HeyGen, Synthesia, Creatify, ElevenLabs, etc.) continue to use the credential form / MCP path.

## Routes

- `GET /api/oauth/:provider/start?connector=…&userId=…[&shop=…]` — redirects to provider consent
- `GET /api/oauth/:provider/callback` — exchanges `code`, stores tokens, redirects to `/integrations?oauth=success`
- `GET /api/oauth/status` — which providers have client credentials configured
- tRPC `integrations.startOAuth` — returns `{ provider, url }` for the client to navigate to
- tRPC `integrations.oauthStatus` — same as `/api/oauth/status`

## Client flow

1. User opens a connector modal and chooses **OAuth**.
2. Client calls `integrations.startOAuth` (authenticated).
3. Client navigates to the returned `url` (full-page redirect).
4. Provider redirects back to `/api/oauth/:provider/callback`.
5. Server stores encrypted tokens and redirects to `/integrations?oauth=success&connector=…`.
6. Integrations page reads the query string, refreshes `listCredentials`, and shows a toast.

## Shopify note

Shopify OAuth requires the shop domain on start:

```
/api/oauth/shopify/start?connector=shopify&userId=123&shop=your-store.myshopify.com
```

## Redirect URI to register with each provider

```
{APP_BASE_URL}/api/oauth/{provider}/callback
```

Example: `https://hanna.example.com/api/oauth/google/callback`

## Security

- OAuth `state` is HMAC-signed and expires in 15 minutes (CSRF protection).
- PKCE (S256) is used for X and TikTok.
- Access / refresh tokens are encrypted before persistence (`credentialCrypto`).
- Tokens are never included in `listCredentials` responses (masked hints only).
