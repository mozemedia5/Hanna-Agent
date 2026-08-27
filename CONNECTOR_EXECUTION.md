# Shopify and Slack connector execution

Hanna now supports authenticated Shopify and Slack actions through protected server procedures. Connector secrets are accepted by the settings workspace, encrypted with the existing AES-256-GCM credential utility, and never returned in connector listings or action responses. The current runtime store is process-local and development-only; replace `server/connectorDb.ts` with a Firebase/Firestore adapter before production use.

## Supported actions

| Connector | Action | API | Required scope or permission | Approval |
| --- | --- | --- | --- | --- |
| Shopify | List products | Admin GraphQL `products` query | `read_products` | Required |
| Shopify | Update product title | Admin GraphQL `productUpdate` mutation | `write_products` | Required |
| Slack | List channels | Web API `conversations.list` | `channels:read` and relevant private/DM read scopes | Required |
| Slack | Send message | Web API `chat.postMessage` | `chat:write` | Required |

Shopify uses the user’s store domain and Admin API access token. The backend sends the token in the `X-Shopify-Access-Token` header to the versioned Admin GraphQL endpoint. Slack uses a bot token and sends it only in the backend `Authorization: Bearer` header. Hanna does not accept tokens in URLs or expose them to the browser after saving.

## Approval lifecycle

The client first calls `integrations.previewAction`, which creates a short-lived, user-scoped pending request. No third-party request is made during preview. The user then explicitly confirms the action through `integrations.approveAction`. Only an approved request can call `integrations.executeApproved`; the backend checks ownership, expiration, connector credentials, and action shape before contacting Shopify or Slack. A successful response is normalized into a safe summary and verification detail, and the request is marked completed. Unapproved, expired, cross-user, missing-credential, authentication, scope, and upstream failures fail closed.

## User setup

For Shopify, create or configure an app with the minimum Admin API scopes needed for the selected actions, install it on the intended store, and enter the `.myshopify.com` store domain plus Admin API access token in **Apps & Integrations**. For Slack, create a Slack app, install it in the intended workspace with `chat:write` and the read scopes required by channel discovery, then enter the bot token and use channel IDs rather than display names for message actions. The app must be a member of private channels where it will post.

## Firebase migration

The temporary connector credential and approval maps should be replaced by Firestore collections such as `connectorCredentials/{userId}_{connector}` and `approvalRequests/{requestId}`. Store encrypted credential payloads, masked field hints, timestamps, owner IDs, approval status, expiration, action parameters, and verification metadata. Apply Firestore security rules so users can access only their own records; perform third-party calls only in trusted server-side code or Cloud Functions. Never place connector tokens in `VITE_*` variables, browser local storage, URLs, logs, or client responses.

Official references: Shopify authentication uses an access token in the `X-Shopify-Access-Token` header for the Admin GraphQL API [1]. Shopify’s products query and product update mutation define the catalog operations [2] [3]. Slack’s `chat.postMessage` uses the Web API with the `chat:write` scope, while `conversations.list` requires the applicable conversation read scopes [4] [5].

## References

[1]: https://shopify.dev/docs/api/usage/authentication "Shopify API authentication"
[2]: https://shopify.dev/docs/api/admin-graphql/latest/queries/products "Shopify Admin GraphQL products query"
[3]: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate "Shopify Admin GraphQL productUpdate mutation"
[4]: https://docs.slack.dev/reference/methods/chat.postMessage "Slack chat.postMessage method"
[5]: https://docs.slack.dev/reference/methods/conversations.list "Slack conversations.list method"
