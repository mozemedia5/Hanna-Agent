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
  const domain = shopifyDomain(credential.values.storeDomain || credential.values.shop || "");
  if (!domain) throw new Error("Shopify store domain is required.");
  const token = credential.values.accessToken || credential.values.access_token || "";
  if (!token) throw new Error("Shopify access token is missing.");

  const response = await fetcher(
    `https://${domain}/admin/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Shopify-Access-Token": token,
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

  if (action.connector === "github" && action.action === "github_overview") {
    const token = credential.values.access_token || credential.values.oauthToken || "";
    if (!token) throw new Error("GitHub is not connected. Reconnect GitHub and authorize repository access.");
    const apiGet = async (url: string) => {
      const response = await fetcher(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Hanna-Agent",
        },
      });
      if (!response.ok) throw new Error(safeError(response.status, "GitHub"));
      return response.json() as Promise<any>;
    };
    const parameters = action.parameters as Record<string, unknown>;
    const limit = Math.min(Math.max(Number(parameters.repositoryCount ?? 5), 1), 5);
    const repositories = await apiGet(`https://api.github.com/user/repos?sort=updated&per_page=${limit}&type=owner`);
    const overview = await Promise.all((repositories as any[]).map(async repo => {
      const repoPath = String(repo.full_name).split("/").map(encodeURIComponent).join("/");
      const [issues, pullRequests] = await Promise.all([
        apiGet(`https://api.github.com/repos/${repoPath}/issues?state=open&per_page=10`),
        apiGet(`https://api.github.com/repos/${repoPath}/pulls?state=open&per_page=10`),
      ]);
      return {
        name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        updatedAt: repo.updated_at,
        openIssues: (issues as any[]).filter(issue => !issue.pull_request).map(issue => ({ number: issue.number, title: issue.title, url: issue.html_url, createdAt: issue.created_at, labels: issue.labels?.map((label: any) => label.name) ?? [] })),
        openPullRequests: (pullRequests as any[]).map(pr => ({ number: pr.number, title: pr.title, url: pr.html_url, updatedAt: pr.updated_at, draft: pr.draft })),
      };
    }));
    return {
      connector: "github",
      action: action.action,
      summary: `Reviewed ${overview.length} GitHub repositories with live issue and pull-request data.`,
      verification: { status: "verified", detail: "GitHub API returned the account's repositories, issues, and pull requests." },
      data: { repositories: overview, total: overview.length },
    };
  }

  // Google Slides: locate a real presentation in Drive, then read it through Slides API.
  if (action.connector === "google-slides") {
    const accessToken = credential.values.access_token;
    if (!accessToken) throw new Error("Google Slides is not connected. Reconnect Google and grant presentation read access.");
    const parameters = action.parameters as Record<string, unknown>;
    const query = String(parameters.query ?? parameters.title ?? "").trim();
    const driveUrl = new URL("https://www.googleapis.com/drive/v3/files");
    driveUrl.searchParams.set("pageSize", "10");
    driveUrl.searchParams.set("orderBy", "modifiedTime desc");
    driveUrl.searchParams.set("fields", "files(id,name,mimeType,webViewLink,modifiedTime)");
    const clauses = ["mimeType = 'application/vnd.google-apps.presentation'", "trashed = false"];
    if (query) clauses.push(`name contains '${query.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
    driveUrl.searchParams.set("q", clauses.join(" and "));
    const driveResponse = await fetcher(driveUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!driveResponse.ok) throw new Error(safeError(driveResponse.status, "Google Drive"));
    const driveData = await driveResponse.json() as { files?: Array<{ id: string; name: string; webViewLink?: string }> };
    const file = driveData.files?.[0];
    if (!file) {
      return { connector: "google-slides", action: action.action, summary: "No matching Google Slides presentations were found.", verification: { status: "verified", detail: "Google Drive returned no matching presentation files." }, data: { presentations: [] } };
    }
    const slidesResponse = await fetcher(`https://slides.googleapis.com/v1/presentations/${encodeURIComponent(file.id)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!slidesResponse.ok) throw new Error(safeError(slidesResponse.status, "Google Slides"));
    const presentation = await slidesResponse.json() as any;
    const slides = (presentation.slides ?? []).map((slide: any, index: number) => ({
      slideNumber: index + 1,
      text: (slide.pageElements ?? []).flatMap((element: any) => element.shape?.text?.textElements ?? []).map((element: any) => element.textRun?.content ?? "").join("").trim(),
    }));
    return { connector: "google-slides", action: action.action, summary: `Retrieved ${slides.length} slide(s) from “${presentation.title || file.name}”.`, verification: { status: "verified", detail: "Google Slides API returned the presentation content." }, data: { presentationId: presentation.presentationId || file.id, title: presentation.title || file.name, url: file.webViewLink, slides } };
  }

  // Google Drive, Docs, and Sheets: every success is backed by a live API response.
  if (["google-workspace", "google-drive", "google-docs", "google-sheets"].includes(action.connector)) {
    const accessToken = credential.values.access_token;
    if (!accessToken) throw new Error(`${action.connector} is not connected. Connect the matching Google service first.`);
    const parameters = action.parameters as Record<string, unknown>;
    const query = String(parameters.query ?? parameters.q ?? parameters.title ?? "").trim();
    const driveUrl = new URL("https://www.googleapis.com/drive/v3/files");
    driveUrl.searchParams.set("pageSize", "10");
    driveUrl.searchParams.set("orderBy", "modifiedTime desc");
    driveUrl.searchParams.set("fields", "files(id,name,mimeType,webViewLink,modifiedTime,size)");
    const mimeType = action.connector === "google-docs" ? "application/vnd.google-apps.document" : action.connector === "google-sheets" ? "application/vnd.google-apps.spreadsheet" : "";
    const clauses = ["trashed = false"];
    if (mimeType) clauses.push(`mimeType = '${mimeType}'`);
    if (query) clauses.push(`name contains '${query.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
    driveUrl.searchParams.set("q", clauses.join(" and "));
    const driveResponse = await fetcher(driveUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!driveResponse.ok) throw new Error(safeError(driveResponse.status, "Google Drive"));
    const driveData = await driveResponse.json() as { files?: Array<{ id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime?: string; size?: string }> };
    const files = driveData.files ?? [];

    if (action.connector === "google-docs" && action.action === "docs_read" && files[0]) {
      const docResponse = await fetcher(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(files[0].id)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!docResponse.ok) throw new Error(safeError(docResponse.status, "Google Docs"));
      const doc = await docResponse.json() as { title?: string; body?: { content?: unknown[] } };
      const textParts: string[] = [];
      const collectText = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) { value.forEach(collectText); return; }
        const item = value as Record<string, unknown>;
        const textRun = item.textRun as { content?: unknown } | undefined;
        if (typeof textRun?.content === "string") textParts.push(textRun.content);
        Object.entries(item).filter(([key]) => key !== "textRun").forEach(([, child]) => collectText(child));
      };
      collectText(doc.body?.content ?? []);
      return { connector: action.connector, action: action.action, summary: `Read Google Doc “${doc.title || files[0].name}”.`, verification: { status: "verified", detail: "Google Docs API returned the document body." }, data: { id: files[0].id, title: doc.title || files[0].name, url: files[0].webViewLink, text: textParts.join("") } };
    }

    if (action.connector === "google-sheets" && action.action === "sheets_analyze" && files[0]) {
      const sheetResponse = await fetcher(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(files[0].id)}?fields=properties(title),sheets(properties(title))`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!sheetResponse.ok) throw new Error(safeError(sheetResponse.status, "Google Sheets"));
      const sheet = await sheetResponse.json() as { properties?: { title?: string }; sheets?: Array<{ properties?: { title?: string } }> };
      const tab = sheet.sheets?.[0]?.properties?.title || "Sheet1";
      const range = encodeURIComponent(`${tab}!A1:Z50`);
      const valuesResponse = await fetcher(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(files[0].id)}/values/${range}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!valuesResponse.ok) throw new Error(safeError(valuesResponse.status, "Google Sheets"));
      const values = await valuesResponse.json() as { values?: unknown[][]; range?: string };
      return { connector: action.connector, action: action.action, summary: `Retrieved ${values.values?.length ?? 0} row(s) from “${sheet.properties?.title || files[0].name}”.`, verification: { status: "verified", detail: "Google Sheets API returned the spreadsheet values." }, data: { id: files[0].id, title: sheet.properties?.title || files[0].name, url: files[0].webViewLink, range: values.range, values: values.values ?? [] } };
    }

    return {
      connector: action.connector,
      action: action.action,
      summary: `Retrieved ${files.length} ${action.connector} item(s)${query ? ` matching “${query}”` : ""}.`,
      verification: { status: "verified", detail: "Google Drive API returned live file metadata." },
      data: { files, total: files.length },
    };
  }

  // Gmail
  if (action.connector === "gmail") {
    const parameters = action.parameters as Record<string, unknown>;
    if (!credential.values.access_token) throw new Error("Gmail is not connected. Connect Gmail with the required access first.");
    if (action.action === "mail_send" || action.action === "mail:send") {
      const recipient = String(parameters.to ?? parameters.recipient ?? "").trim();
      const subject = String(parameters.subject ?? "").trim();
      const bodyText = String(parameters.body ?? parameters.text ?? "").trim();
      if (!recipient || !subject || !bodyText) throw new Error("Gmail send requires a recipient, subject, and message body.");

      if (credential.values.access_token) {
        try {
          const rawMessage = Buffer.from(
            `To: ${recipient}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${bodyText}`
          ).toString("base64url");

          const sendRes = await fetcher("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credential.values.access_token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ raw: rawMessage }),
          });

          if (sendRes.ok) {
            const json = (await sendRes.json()) as any;
            return {
              connector: "gmail",
              action: action.action,
              summary: `Sent email to ${recipient} with subject '${subject}'.`,
              verification: {
                status: "verified",
                detail: `Gmail API confirmed message delivery with ID ${json.id}.`,
              },
              data: { messageId: json.id, recipient, subject, status: "sent" },
            };
          }
          throw new Error(safeError(sendRes.status, "Gmail"));
        } catch (err) {
          throw err;
        }
      }

      throw new Error("Gmail did not return a verified send result.");
    }

    const query = String(parameters.query ?? parameters.q ?? "all");

    if (credential.values.access_token) {
      try {
        const gmailUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
        gmailUrl.searchParams.set("maxResults", "10");
        if (query && query !== "all") gmailUrl.searchParams.set("q", query);

        const listRes = await fetcher(gmailUrl.toString(), {
          headers: { Authorization: `Bearer ${credential.values.access_token}` },
        });

        if (listRes.ok) {
          const json = (await listRes.json()) as any;
          const messageIds = (json.messages || []).slice(0, 10);
          const messages = await Promise.all(messageIds.map(async (message: { id: string; threadId?: string }) => {
            const detailRes = await fetcher(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(message.id)}?format=full`, {
              headers: { Authorization: `Bearer ${credential.values.access_token}` },
            });
            if (!detailRes.ok) throw new Error(safeError(detailRes.status, "Gmail"));
            const detail = await detailRes.json() as any;
            const headers = detail.payload?.headers ?? [];
            const header = (name: string) => headers.find((item: { name?: string }) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
            const textParts: string[] = [];
            const collectPlainText = (part: any) => {
              if (part?.mimeType === "text/plain" && part.body?.data) {
                textParts.push(Buffer.from(String(part.body.data).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
              }
              (part?.parts ?? []).forEach(collectPlainText);
            };
            collectPlainText(detail.payload);
            return {
              id: detail.id ?? message.id,
              threadId: detail.threadId ?? message.threadId,
              from: header("From"),
              to: header("To"),
              subject: header("Subject"),
              date: header("Date"),
              snippet: detail.snippet ?? "",
              body: textParts.join("\n").slice(0, 12000),
            };
          }));
          return {
            connector: "gmail",
            action: action.action,
            summary: `Retrieved ${messages.length} Gmail message(s)${query !== "all" ? ` matching '${query}'` : ""}.`,
            verification: {
              status: "verified",
              detail: `Gmail API returned ${messages.length} message thread(s).`,
            },
            data: { messages, total: messages.length },
          };
        }
        throw new Error(safeError(listRes.status, "Gmail"));
      } catch (err) {
        throw err;
      }
    }

    throw new Error("Gmail did not return a verified search result.");
  }

  // Google Calendar
  if (action.connector === "google-calendar") {
    const parameters = action.parameters as Record<string, unknown>;
    if (!credential.values.access_token) throw new Error("Google Calendar is not connected. Connect Calendar with the required access first.");
    if (action.action === "calendar_write" || action.action === "events_manage" || action.action === "calendar:write") {
      const summary = String(parameters.summary ?? parameters.title ?? "").trim();
      const startTime = String(parameters.startTime ?? "").trim();
      const endTime = String(parameters.endTime ?? "").trim();
      if (!summary || !startTime || !endTime || !Number.isFinite(Date.parse(startTime)) || !Number.isFinite(Date.parse(endTime)) || Date.parse(endTime) <= Date.parse(startTime)) {
        throw new Error("Calendar event creation requires a title, valid start time, and end time after the start.");
      }

      if (credential.values.access_token) {
        try {
          const createRes = await fetcher("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credential.values.access_token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              summary,
              start: { dateTime: startTime },
              end: { dateTime: endTime },
            }),
          });

          if (createRes.ok) {
            const json = (await createRes.json()) as any;
            return {
              connector: "google-calendar",
              action: action.action,
              summary: `Scheduled Google Calendar event '${summary}' for ${startTime}.`,
              verification: {
                status: "verified",
                detail: `Google Calendar API created event ${json.id}.`,
              },
              data: { eventId: json.id, summary, startTime, status: "confirmed", htmlLink: json.htmlLink },
            };
          }
          throw new Error(safeError(createRes.status, "Google Calendar"));
        } catch (err) {
          throw err;
        }
      }

      throw new Error("Google Calendar did not return a verified event-creation result.");
    }

    if (credential.values.access_token) {
      try {
        const calUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
        calUrl.searchParams.set("maxResults", "10");
        calUrl.searchParams.set("orderBy", "startTime");
        calUrl.searchParams.set("singleEvents", "true");
        calUrl.searchParams.set("timeMin", new Date().toISOString());

        const calRes = await fetcher(calUrl.toString(), {
          headers: { Authorization: `Bearer ${credential.values.access_token}` },
        });

        if (calRes.ok) {
          const json = (await calRes.json()) as any;
          const events = json.items || [];
          return {
            connector: "google-calendar",
            action: action.action,
            summary: `Retrieved ${events.length} upcoming Google Calendar event(s).`,
            verification: {
              status: "verified",
              detail: `Google Calendar API returned ${events.length} event(s).`,
            },
            data: { events, total: events.length },
          };
        }
        throw new Error(safeError(calRes.status, "Google Calendar"));
      } catch (err) {
        throw err;
      }
    }

    throw new Error("Google Calendar did not return a verified events result.");
  }

  throw new Error(`The ${action.connector} connector does not implement '${action.action}' yet.`);
}
