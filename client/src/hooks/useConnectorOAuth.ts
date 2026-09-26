import { getFirebaseIdToken } from "@/_core/hooks/useAuth";

/**
 * Start real OAuth for a connector. Navigates the browser to the provider consent screen.
 * For Shopify, pass shop like "your-store.myshopify.com".
 */
export async function startConnectorOAuth(
  connectorId: string,
  options?: { shop?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await getFirebaseIdToken();
    const body: Record<string, unknown> = { connector: connectorId };
    if (options?.shop) body.shop = options.shop.trim().toLowerCase();

    const response = await fetch("/api/trpc/integrations.startOAuth?batch=1", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ 0: { json: body } }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { ok: false, error: errText || "OAuth start failed" };
    }

    const payload = await response.json();
    const result =
      payload?.[0]?.result?.data?.json ?? payload?.[0]?.result?.data;
    const url = result?.url as string | undefined;
    if (!url) {
      return {
        ok: false,
        error:
          result?.message ||
          "This connector does not support browser OAuth or is not configured.",
      };
    }

    window.location.assign(url);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to start OAuth";
    return { ok: false, error: msg };
  }
}

/** Read OAuth callback query params after redirect from OAuth callback */
export function readOAuthReturnParams(): {
  status: "success" | "error" | null;
  connector?: string;
  reason?: string;
} {
  const params = new URLSearchParams(window.location.search);
  const oauth = params.get("oauth");
  if (oauth === "success" || oauth === "error") {
    return {
      status: oauth,
      connector: params.get("connector") || undefined,
      reason: params.get("reason") || undefined,
    };
  }
  return { status: null };
}

export function clearOAuthReturnParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth");
  url.searchParams.delete("connector");
  url.searchParams.delete("provider");
  url.searchParams.delete("reason");
  window.history.replaceState({}, "", url.pathname + url.search);
}
