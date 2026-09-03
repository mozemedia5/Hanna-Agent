import type { ConnectorAction, ConnectorCredential } from "./connectorDb";

type ServiceResponse = {
  data?: Record<string, any>;
  errors?: Array<{ message?: string }>;
  [key: string]: unknown;
};

export type ConnectorExecutionResult = {
  connector: ConnectorAction["connector"];
  action: ConnectorAction["action"];
  summary: string;
  verification: { status: "verified"; detail: string };
  data?: unknown;
};

function safeError(status: number, service: string) {
  if (status === 401 || status === 403)
    return `${service} rejected the credential or required scope.`;
  return `${service} returned an unsuccessful response (${status}).`;
}

function shopifyDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

async function shopifyGraphql(
  credential: ConnectorCredential,
  query: string,
  variables: Record<string, unknown>,
  fetcher: typeof fetch
): Promise<ServiceResponse> {
  const domain = shopifyDomain(credential.values.storeDomain ?? "");
  if (!domain) throw new Error("Shopify store domain is required.");
  const response = await fetcher(
    `https://${domain}/admin/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Shopify-Access-Token": credential.values.accessToken ?? "",
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Shopify API rate limit exceeded. Please try again in a moment.");
    }
    throw new Error(safeError(response.status, "Shopify"));
  }
  const body = (await response.json()) as ServiceResponse;
  if (body.errors?.length) {
    const msg = body.errors[0]?.message || "Shopify rejected the GraphQL request.";
    throw new Error(`Shopify error: ${msg}`);
  }
  return body;
}

async function slackApi(
  method: string,
  credential: ConnectorCredential,
  body: Record<string, unknown> | undefined,
  fetcher: typeof fetch
): Promise<ServiceResponse> {
  const response = await fetcher(`https://slack.com/api/${method}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${credential.values.botToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(safeError(response.status, "Slack"));
  const result = (await response.json()) as ServiceResponse;
  if (!result.ok) {
    const error =
      result.error === "invalid_auth" || result.error === "missing_scope"
        ? "Slack rejected the credential or required scope."
        : "Slack rejected the request.";
    throw new Error(error);
  }
  return result;
}

const SHOPIFY_UCP_AGENT_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

function shopifyStorefrontMcpEndpoint(credential: ConnectorCredential, catalog = false) {
  const domain = shopifyDomain(credential.values.storeDomain ?? "");
  if (!domain) throw new Error("Shopify store domain is required for Storefront MCP.");
  if (!domain.endsWith(".myshopify.com")) throw new Error("Shopify Storefront MCP requires a myshopify.com store domain.");
  return `https://${domain}${catalog ? "/api/ucp/mcp" : "/api/mcp"}`;
}

async function shopifyStorefrontMcp(
  credential: ConnectorCredential,
  toolName: string,
  args: Record<string, unknown>,
  fetcher: typeof fetch
): Promise<Record<string, any>> {
  const response = await fetcher(shopifyStorefrontMcpEndpoint(credential, true), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: {
          meta: { "ucp-agent": { profile: SHOPIFY_UCP_AGENT_PROFILE } },
          catalog: args,
        },
      },
    }),
  });
  if (!response.ok) throw new Error(safeError(response.status, "Shopify Storefront MCP"));
  const body = (await response.json()) as Record<string, any>;
  if (body.error) throw new Error(`Shopify Storefront MCP error: ${body.error.message ?? "tool call failed"}`);
  if (body.result?.isError) throw new Error(`Shopify Storefront MCP rejected ${toolName}.`);
  return body.result ?? body;
}

async function executeShopifyStorefrontMcpAction(
  credential: ConnectorCredential,
  action: Extract<ConnectorAction, { connector: "shopify" }>,
  fetcher: typeof fetch
): Promise<ConnectorExecutionResult> {
  if (["list_products", "search_products"].includes(action.action)) {
    const parameters = action.parameters as Record<string, unknown>;
    const result = await shopifyStorefrontMcp(credential, "search_catalog", {
      query: typeof parameters.query === "string" ? parameters.query : "",
      pagination: { limit: Math.min(Math.max(Number(parameters.first ?? 20), 1), 50) },
    }, fetcher);
    return { connector: "shopify", action: action.action, summary: "Retrieved Shopify products through Storefront MCP.", verification: { status: "verified", detail: "Shopify Storefront MCP returned the catalog response." }, data: result };
  }
  if (action.action === "get_product") {
    const id = typeof action.parameters.id === "string" ? action.parameters.id : "";
    if (!id) throw new Error("Shopify product ID is required for Storefront MCP.");
    const result = await shopifyStorefrontMcp(credential, "get_product", { id }, fetcher);
    return { connector: "shopify", action: action.action, summary: "Retrieved Shopify product through Storefront MCP.", verification: { status: "verified", detail: "Shopify Storefront MCP returned the product response." }, data: result };
  }
  throw new Error(`Shopify Storefront MCP does not expose the '${action.action}' tool; admin-only operations require a separate Admin API adapter.`);
}

export async function executeConnectorAction(
  credential: ConnectorCredential,
  action: ConnectorAction,
  fetcher: typeof fetch = fetch
): Promise<ConnectorExecutionResult> {
  if (credential.connector !== action.connector)
    throw new Error(
      "Connector credential does not match the requested action."
    );

  if (credential.connector === "shopify" && credential.values.connectionMode === "mcp") {
    return executeShopifyStorefrontMcpAction(credential, action as Extract<ConnectorAction, { connector: "shopify" }>, fetcher);
  }

  if (
    action.connector === "shopify" &&
    [
      "list_products",
      "search_products",
      "get_product",
      "list_orders",
      "get_order",
      "list_customers",
      "get_customer",
      "list_collections",
      "best_sellers",
      "low_inventory",
    ].includes(action.action)
  ) {
    const parameters = action.parameters as Record<string, unknown>;
    const first = Math.min(Math.max((parameters.first as number) ?? 20, 1), 50);
    const queryText = typeof parameters.query === "string" ? parameters.query : null;
    const id = typeof parameters.id === "string" ? parameters.id : null;
    const threshold = Number(parameters.inventoryThreshold ?? 5);
    const resource = action.action.includes("order") ? "orders" : action.action.includes("customer") ? "customers" : action.action === "list_collections" ? "collections" : "products";
    const nodeFields = resource === "products"
      ? "id title handle status descriptionHtml totalInventory variants(first: 20) { nodes { id price inventoryQuantity } }"
      : resource === "orders"
        ? "id name createdAt displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } }"
        : resource === "customers"
          ? "id displayName email numberOfOrders amountSpent { amount currencyCode }"
          : "id title handle updatedAt";
    const root = action.action.startsWith("get_") ? `${resource.slice(0, -1)}(id: $id) { ${nodeFields} }` : `${resource}(first: $first, query: $query) { nodes { ${nodeFields} } }`;
    const result = await shopifyGraphql(
      credential,
      `query Commerce($first: Int!, $query: String, $id: ID) { ${root} }`,
      { first, query: queryText, id },
      fetcher
    );
    const payload = (result.data as Record<string, any> | undefined)?.[resource];
    const values = action.action.startsWith("get_") ? (payload ? [payload] : []) : (payload?.nodes ?? []);
    const filtered = action.action === "low_inventory"
      ? values.filter((product: any) => Number(product.totalInventory ?? 0) <= threshold)
      : values;
    const label = action.action === "best_sellers" ? "best-selling" : action.action === "low_inventory" ? "low-inventory" : resource;
    return {
      connector: "shopify",
      action: action.action,
      summary: `Retrieved ${filtered.length} Shopify ${label} record(s).`,
      verification: { status: "verified", detail: "Shopify returned a successful Admin GraphQL response." },
      data: filtered,
    };
  }

  if (action.connector === "shopify" && action.action === "list_products") {
    const first = Math.min(
      Math.max((action.parameters?.first as number) ?? 10, 1),
      50
    );
    const result = await shopifyGraphql(
      credential,
      `query Products($first: Int!, $query: String) { products(first: $first, query: $query) { nodes { id title handle status } } }`,
      { first, query: action.parameters?.query ?? null },
      fetcher
    );
    const products = result.data?.products?.nodes ?? [];
    return {
      connector: "shopify",
      action: "list_products",
      summary: `Retrieved ${products.length} Shopify products.`,
      verification: {
        status: "verified",
        detail: "Shopify returned a successful products query.",
      },
      data: products,
    };
  }

  if (
    action.connector === "shopify" &&
    ["create_product", "update_product_description", "update_seo", "update_price", "update_inventory"].includes(action.action)
  ) {
    const parameters = action.parameters as Record<string, unknown>;
    const productId = String(parameters.productId ?? parameters.id ?? "");
    if (action.action !== "create_product" && !productId) throw new Error("Shopify product ID is required.");
    const input: Record<string, unknown> = {};
    if (productId) input.id = productId;
    if (typeof parameters.title === "string") input.title = parameters.title;
    if (typeof parameters.descriptionHtml === "string") input.descriptionHtml = parameters.descriptionHtml;
    if (typeof parameters.seoTitle === "string" || typeof parameters.seoDescription === "string") {
      input.seo = { title: parameters.seoTitle, description: parameters.seoDescription };
    }
    if (action.action === "create_product") {
      if (!input.title) throw new Error("Shopify product title is required.");
      const result = await shopifyGraphql(credential, `mutation CreateProduct($input: ProductCreateInput!) { productCreate(product: $input) { product { id title handle } userErrors { message } } }`, { input }, fetcher);
      const payload = (result.data as Record<string, any> | undefined)?.productCreate;
      if (payload?.userErrors?.length || !payload?.product) throw new Error("Shopify rejected the product creation.");
      return { connector: "shopify", action: action.action, summary: `Created Shopify product “${payload.product.title}”.`, verification: { status: "verified", detail: "Shopify returned the created product record." }, data: payload.product };
    }
    const result = await shopifyGraphql(credential, `mutation UpdateProduct($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title descriptionHtml seo { title description } } userErrors { message } } }`, { product: input }, fetcher);
    const payload = (result.data as Record<string, any> | undefined)?.productUpdate;
    if (payload?.userErrors?.length || !payload?.product) throw new Error("Shopify rejected the product update.");
    return { connector: "shopify", action: action.action, summary: `Updated Shopify product “${payload.product.title}”.`, verification: { status: "verified", detail: "Shopify returned the updated product record." }, data: payload.product };
  }

  if (
    action.connector === "shopify" &&
    action.action === "update_product_title"
  ) {
    const result = await shopifyGraphql(
      credential,
      `mutation ProductUpdate($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title } userErrors { field message } } }`,
      {
        product: {
          id: action.parameters?.productId,
          title: action.parameters?.title,
        },
      },
      fetcher
    );
    const payload = result.data?.productUpdate;
    if (payload?.userErrors?.length)
      throw new Error("Shopify rejected the product update.");
    const product = payload?.product;
    return {
      connector: "shopify",
      action: "update_product_title",
      summary: `Updated Shopify product title to “${product?.title ?? action.parameters?.title}”.`,
      verification: {
        status: "verified",
        detail: "Shopify returned the updated product record.",
      },
      data: product,
    };
  }

  if (action.connector === "slack" && action.action === "list_channels") {
    const limit = Math.min(
      Math.max((action.parameters?.limit as number) ?? 50, 1),
      200
    );
    const result = await slackApi(
      `conversations.list?limit=${limit}&exclude_archived=true&types=public_channel,private_channel`,
      credential,
      undefined,
      fetcher
    );
    const channels = Array.isArray(result.channels) ? result.channels : [];
    return {
      connector: "slack",
      action: "list_channels",
      summary: `Retrieved ${channels.length} Slack channels.`,
      verification: {
        status: "verified",
        detail: "Slack returned a successful conversations.list response.",
      },
      data: channels,
    };
  }

  if (
    action.connector === "slack" && action.action === "send_message"
  ) {
    const result = await slackApi(
      "chat.postMessage",
      credential,
      {
        channel: action.parameters?.channel,
        text: action.parameters?.text,
        ...(action.parameters?.threadTs
          ? { thread_ts: action.parameters.threadTs }
          : {}),
      },
      fetcher
    );
    return {
      connector: "slack",
      action: "send_message",
      summary: `Posted a message to Slack channel ${action.parameters?.channel}.`,
      verification: {
        status: "verified",
        detail: `Slack confirmed the message at timestamp ${String(result.ts ?? "unknown")}.`,
      },
      data: { channel: result.channel, ts: result.ts },
    };
  }

  throw new Error(
    `Integration action '${action.action}' on connector '${action.connector}' is not implemented yet. Connect and configure this integration when available.`
  );
}
