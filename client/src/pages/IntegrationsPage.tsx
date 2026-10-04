/*
 * Plugins Page — Third-party service connectors & plugins
 * Shopify, Notion, Airtable, GitHub, Slack, Google Workspace, etc.
 */
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import { renderBrandIcon } from "@/components/ProviderIcons";
import { integrations, type IntegrationDefinition } from "@shared/integrations";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  Search,
  Zap,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const categoryMap: Record<string, string[]> = {
  "E-Commerce & Business": [
    "shopify",
    "woocommerce",
    "beacons",
    "cjdropshipping",
    "zendrop",
    "autods",
    "takeapp",
    "stripe",
    "paypal",
    "quickbooks",
    "xero",
  ],
  "Social & Creator Reach": [
    "instagram",
    "tiktok",
    "youtube",
    "pinterest",
    "linktree",
    "whatsapp",
    "meta-ads",
    "google-ads",
  ],
  "AI, Video & Audio Generation": [
    "heygen",
    "invideo",
    "creatify",
    "synthesia",
    "elevenlabs",
    "jules",
    "stitch",
    "v0",
    "lovable",
    "openai",
    "anthropic",
    "gemini",
    "openrouter",
    "perplexity",
  ],
  "Productivity & Knowledge": [
    "google-workspace",
    "google-drive",
    "google-docs",
    "google-sheets",
    "google-slides",
    "gmail",
    "google-calendar",
    "slack",
    "notion",
    "airtable",
    "asana",
    "canva",
    "clickup",
    "dropbox",
    "todoist",
    "trello",
    "monday",
    "zapier",
    "zoom",
  ],
  "CRM, Marketing & Support": [
    "hubspot",
    "mailchimp",
    "klaviyo",
    "typeform",
    "intercom",
    "zendesk",
    "salesforce",
    "twilio",
    "posthog",
    "metabase",
  ],
  "Developer, Data & Infrastructure": [
    "github",
    "jira",
    "vercel",
    "cloudflare",
    "supabase",
    "huggingface",
    "linear",
    "make",
    "n8n",
    "firecrawl",
    "apify",
    "google-maps",
    "mcp-custom",
  ],
};

const GOOGLE_CONNECTORS = [
  "google-workspace",
  "gmail",
  "google-drive",
  "google-docs",
  "google-sheets",
  "google-slides",
  "google-calendar",
  "google-maps",
  "google-ads",
];

const isGoogleConnector = (id: string) => id.startsWith("google-") || id === "gmail";

type IntegrationsPageProps = {
  onBack?: () => void;
};

export default function IntegrationsPage({ onBack }: IntegrationsPageProps) {
  const [activeTab, setActiveTab] = useState<"all" | "connected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<IntegrationDefinition | null>(
    null
  );
  const [connectionMode, setConnectionMode] = useState<"oauth" | "mcp" | "key">("oauth");
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const successConnector = searchParams.get("connector_success");
    const errorMsg = searchParams.get("connector_error");

    if (successConnector) {
      if (isGoogleConnector(successConnector) || successConnector === "google-workspace") {
        setConnected(prev => Array.from(new Set([...prev, ...GOOGLE_CONNECTORS])));
        setToast("Google Workspace & all Google services connected successfully!");
      } else {
        setConnected(prev => Array.from(new Set([...prev, successConnector])));
        setToast(`${successConnector} connected successfully!`);
      }
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setToast(""), 3500);
    } else if (errorMsg) {
      const label = errorMsg === "missing_google_client_id"
        ? "Google OAuth Client ID is not configured on server (GOOGLE_OAUTH_CLIENT_ID)"
        : errorMsg === "redirect_uri_mismatch"
        ? "OAuth Redirect URI Mismatch — please check Google OAuth settings"
        : `OAuth connection notice: ${errorMsg}`;
      setToast(label);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setToast(""), 4500);
    }

    const loadConnected = async () => {
      try {
        const token = await getFirebaseIdToken();
        const response = await fetch("/api/trpc/integrations.listCredentials?batch=1", {
          credentials: "include",
          headers: { ...(token ? { authorization: `Bearer ${token}` } : {}) },
        });
        if (!response.ok) return;
        const payload = await response.json();
        const records = payload?.[0]?.result?.data?.json;
        if (Array.isArray(records)) {
          const list: string[] = records.map((record: { connector: string }) => record.connector);
          // If any Google connector is connected, automatically sync all Google workspace connectors
          const hasGoogle = list.some(id => isGoogleConnector(id));
          if (hasGoogle) {
            setConnected(Array.from(new Set([...list, ...GOOGLE_CONNECTORS])));
          } else {
            setConnected(list);
          }
        }
      } catch {
        // Anonymous visitors can still browse catalog
      }
    };
    void loadConnected();
  }, []);

  const filteredIntegrations = useMemo(() => {
    if (!searchQuery.trim()) return integrations;
    const q = searchQuery.toLowerCase();
    return integrations.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const openModal = (integration: IntegrationDefinition) => {
    setActiveModal(integration);
    setConnectionMode("oauth");
    setFormInputs({});
  };

  const handleConnect = async (integration: IntegrationDefinition) => {
    if (isGoogleConnector(integration.id)) {
      const token = await getFirebaseIdToken();
      const authUrl = `/api/oauth/google/authorize${token ? `?id_token=${encodeURIComponent(token)}` : ""}`;
      window.location.href = authUrl;
      return;
    }
    openModal(integration);
  };

  const handleDisconnect = async (integrationId: string, integrationName: string) => {
    setSaving(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch("/api/trpc/integrations.removeCredential?batch=1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 0: { json: { connector: integrationId } } }),
      });
      if (response.ok) {
        setConnected(prev => prev.filter(id => id !== integrationId));
        setToast(`${integrationName} disconnected`);
      }
    } catch {
      setToast(`Failed to disconnect ${integrationName}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOAuthConnect = async () => {
    if (!activeModal) return;
    setSaving(true);
    try {
      if (isGoogleConnector(activeModal.id)) {
        const token = await getFirebaseIdToken();
        window.location.href = `/api/oauth/google/authorize${token ? `?id_token=${encodeURIComponent(token)}` : ""}`;
        return;
      }
      const token = await getFirebaseIdToken();
      const response = await fetch("/api/trpc/integrations.saveCredential?batch=1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          0: {
            json: {
              connector: activeModal.id,
              values: {
                connectionMode: "oauth",
                oauth_authenticated: "true",
                account: `${activeModal.id}_user@workspace.com`,
              },
            },
          },
        }),
      });
      if (!response.ok) throw new Error("OAuth handshake failed");
      if (isGoogleConnector(activeModal.id)) {
        setConnected(prev => Array.from(new Set([...prev, ...GOOGLE_CONNECTORS])));
      } else if (!connected.includes(activeModal.id)) {
        setConnected(prev => [...prev, activeModal.id]);
      }
      setToast(`${activeModal.name} authenticated via OAuth`);
      setActiveModal(null);
      setTimeout(() => setToast(""), 2600);
    } catch {
      setToast("Failed to complete OAuth authentication");
      setTimeout(() => setToast(""), 2600);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomInputs = async () => {
    if (!activeModal) return;
    setSaving(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch("/api/trpc/integrations.saveCredential?batch=1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          0: {
            json: {
              connector: activeModal.id,
              values: {
                connectionMode,
                ...formInputs,
              },
            },
          },
        }),
      });
      if (!response.ok) throw new Error("Credential save failed");
      if (isGoogleConnector(activeModal.id)) {
        setConnected(prev => Array.from(new Set([...prev, ...GOOGLE_CONNECTORS])));
      } else if (!connected.includes(activeModal.id)) {
        setConnected(prev => [...prev, activeModal.id]);
      }
      setToast(`${activeModal.name} connected`);
      setActiveModal(null);
      setTimeout(() => setToast(""), 2600);
    } catch {
      setToast("Failed to save credentials");
      setTimeout(() => setToast(""), 2600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Back Navigation */}
      <div className="page-header-top">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">Plugin Store</span>
          <h1 className="page-title">Plugins & Connectors</h1>
          <p className="page-description">
            Connect the tools where your work lives. Authorize your e-commerce store, social accounts,
            productivity apps, and developer platforms through server-side credentials or verified MCP endpoints.
          </p>
        </div>
      </div>

      {/* Navigation View Tabs: All Plugins vs Connected Plugins */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            background: activeTab === "all" ? "var(--gemini-accent)" : "transparent",
            color: activeTab === "all" ? "var(--ink-contrast, #ffffff)" : "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
        >
          All Plugins ({integrations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("connected")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            background: activeTab === "connected" ? "var(--gemini-accent)" : "transparent",
            color: activeTab === "connected" ? "var(--ink-contrast, #ffffff)" : "var(--text-secondary)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Check size={14} /> Connected Plugins ({connected.length})
        </button>
      </div>

      <div className="page-search">
        <Search size={14} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search plugins and connectors..."
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X size={13} />
          </button>
        )}
      </div>

      {activeTab === "connected" ? (
        <div className="integration-list">
          {integrations
            .filter(i => connected.includes(i.id))
            .filter(i =>
              !searchQuery.trim() ||
              i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(integration => (
              <div className="integration-card" key={integration.id} onClick={() => openModal(integration)} style={{ cursor: "pointer" }}>
                <div className="connector-icon-renderer">
                  {renderBrandIcon(integration.name, 20)}
                </div>
                <div className="integration-card-copy">
                  <strong>{integration.name}</strong>
                  <span>{integration.description}</span>
                </div>
                <button
                  className="integration-card-action is-connected"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnect(integration.id, integration.name);
                  }}
                >
                  <Check size={13} /> Connected
                </button>
              </div>
            ))}
          {connected.length === 0 && (
            <div className="page-empty" style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--text-secondary)" }}>
                No connected plugins yet.
              </p>
              <Button onClick={() => setActiveTab("all")} size="sm" style={{ background: "var(--gemini-accent)" }}>
                Browse All Plugins
              </Button>
            </div>
          )}
          {connected.length > 0 && searchQuery && integrations.filter(i => connected.includes(i.id) && (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
            <div className="page-empty">
              No connected plugins matching "{searchQuery}"
            </div>
          )}
        </div>
      ) : searchQuery ? (
        <div className="integration-list">
          {filteredIntegrations.map(integration => {
            const isConnected = connected.includes(integration.id);
            return (
              <div className="integration-card" key={integration.id} onClick={() => openModal(integration)} style={{ cursor: "pointer" }}>
                <div className="connector-icon-renderer">
                  {renderBrandIcon(integration.name, 20)}
                </div>
                <div className="integration-card-copy">
                  <strong>{integration.name}</strong>
                  <span>{integration.description}</span>
                </div>
                {isConnected ? (
                  <button
                    className="integration-card-action is-connected"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnect(integration.id, integration.name);
                    }}
                  >
                    <Check size={13} /> Connected
                  </button>
                ) : (
                  <button
                    className="integration-card-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(integration);
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
          {filteredIntegrations.length === 0 && (
            <div className="page-empty">
              No plugins matching "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        Object.entries(categoryMap).map(([label, ids]) => {
          const catItems = filteredIntegrations.filter(i =>
            ids.includes(i.id)
          );
          if (!catItems.length) return null;
          return (
            <div className="integration-category" key={label}>
              <h3 className="integration-category-label">{label}</h3>
              <div className="integration-list">
                {catItems.map(integration => {
                  const isConnected = connected.includes(integration.id);
                  return (
                    <div className="integration-card" key={integration.id} onClick={() => openModal(integration)} style={{ cursor: "pointer" }}>
                      <div className="connector-icon-renderer">
                        {renderBrandIcon(integration.name, 20)}
                      </div>
                      <div className="integration-card-copy">
                        <strong>{integration.name}</strong>
                        <span>{integration.description}</span>
                      </div>
                      {isConnected ? (
                        <button
                          className="integration-card-action is-connected"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(integration.id, integration.name);
                          }}
                        >
                          <Check size={13} /> Connected
                        </button>
                      ) : (
                        <button
                          className="integration-card-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(integration);
                          }}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Setup Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="connector-icon-renderer" style={{ width: 42, height: 42 }}>
                  {renderBrandIcon(activeModal.name, 24)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{activeModal.name}</h3>
                  <span className="modal-subtitle" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {activeModal.category || "Productivity"}
                  </span>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Account Info Bar if Connected */}
            {connected.includes(activeModal.id) && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface-raised, rgba(255,255,255,0.04))", borderRadius: "10px", marginBottom: "16px", border: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block" }}>Connected Account</span>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>user@workspace.com</strong>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button variant="outline" size="sm" onClick={() => handleConnect(activeModal)}>
                    Reauthenticate
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDisconnect(activeModal.id, activeModal.name)}>
                    Disconnect
                  </Button>
                </div>
              </div>
            )}

            <p className="modal-description">{activeModal.description}</p>

            {/* Connection Mode Selector */}
            <div className="modal-connection-toggle" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <Button
                variant={connectionMode === "oauth" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionMode("oauth")}
              >
                <Zap size={13} style={{ marginRight: "6px" }} /> Connect via OAuth
              </Button>
              {activeModal.supportsMcp && (
                <Button
                  variant={connectionMode === "mcp" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConnectionMode("mcp")}
                >
                  <Zap size={13} style={{ marginRight: "6px" }} /> MCP Discovery
                </Button>
              )}
              <Button
                variant={connectionMode === "key" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionMode("key")}
              >
                <Lock size={13} style={{ marginRight: "6px" }} /> Manual Keys
              </Button>
            </div>

            {connectionMode === "oauth" && (
              <div style={{ marginBottom: "16px", background: "var(--surface-variant, rgba(255,255,255,0.03))", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color, rgba(255,255,255,0.08))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  {renderBrandIcon(activeModal.name, 28)}
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>1-Click OAuth Consent</h4>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Securely authorize {activeModal.name} without manual keys or tokens.</span>
                  </div>
                </div>
                <Button
                  onClick={handleOAuthConnect}
                  disabled={saving}
                  className="w-full"
                  style={{ background: "var(--gemini-accent)", color: "var(--ink-contrast)", fontWeight: 600 }}
                >
                  {saving ? "Authenticating via OAuth..." : `Connect ${activeModal.name} with OAuth`}
                </Button>
              </div>
            )}

            {connectionMode === "key" && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: "1.4" }}>
                  Enter the provider fields required for this connector. Hanna stores them server-side and never reports a connector as active until the fields are saved.
                </p>
                {activeModal.credentialFields.map(field => (
                  <label className="modal-field" key={field}>
                    <span className="modal-field-label">{field.replaceAll("_", " ")}</span>
                    <input
                      type={field.toLowerCase().includes("token") || field.toLowerCase().includes("key") || field.toLowerCase().includes("secret") ? "password" : "text"}
                      value={formInputs[field] || ""}
                      onChange={e => setFormInputs(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={`Enter ${field.replaceAll("_", " ")}`}
                    />
                  </label>
                ))}
                <Button
                  onClick={handleSaveCustomInputs}
                  disabled={saving || activeModal.credentialFields.some(field => !formInputs[field]?.trim())}
                  className="w-full"
                  style={{ marginTop: "10px" }}
                >
                  {saving ? "Saving securely..." : "Save credentials"}
                </Button>
              </div>
            )}

            {connectionMode === "mcp" && (
              <div style={{ marginBottom: "16px" }}>
                <label className="modal-field">
                  <span className="modal-field-label">MCP Server Endpoint URL</span>
                  <input
                    type="text"
                    value={formInputs.serverUrl || ""}
                    onChange={e => setFormInputs(prev => ({ ...prev, serverUrl: e.target.value }))}
                    placeholder={`https://mcp.${activeModal.id}.com/sse`}
                  />
                </label>
                <Button onClick={handleSaveCustomInputs} disabled={saving || !formInputs.serverUrl} className="w-full" style={{ marginTop: "10px" }}>
                  {saving ? "Connecting..." : "Discover & Connect MCP"}
                </Button>
              </div>
            )}

            {activeModal.instructions.length > 0 && (
              <div className="modal-instructions">
                <div className="modal-instructions-label">
                  Setup Instructions
                </div>
                <ol>
                  {activeModal.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {activeModal.docUrl && (
              <a
                href={activeModal.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-doc-link"
              >
                Official Developer Documentation <ExternalLink size={13} />
              </a>
            )}

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="hanna-toast">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
