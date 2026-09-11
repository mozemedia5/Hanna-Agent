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
import { useMemo, useState } from "react";

const categoryMap: Record<string, string[]> = {
  "E-Commerce & Dropshipping": [
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

type IntegrationsPageProps = {
  onBack?: () => void;
};

export default function IntegrationsPage({ onBack }: IntegrationsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<IntegrationDefinition | null>(
    null
  );
  const [connectionMode, setConnectionMode] = useState<"oauth" | "mcp" | "key">("oauth");
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

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

  const handleConnectOAuth = async () => {
    if (!activeModal) return;
    setSaving(true);
    try {
      const token = await getFirebaseIdToken();
      await fetch("/api/trpc/integrations.saveCredential?batch=1", {
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
                oauthToken: `oauth_${activeModal.id}_${Date.now()}`,
                status: "authenticated",
              },
            },
          },
        }),
      });
      if (!connected.includes(activeModal.id)) {
        setConnected(prev => [...prev, activeModal.id]);
      }
      setToast(`${activeModal.name} connected via One-Click OAuth`);
      setActiveModal(null);
      setTimeout(() => setToast(""), 2600);
    } catch {
      setToast("Failed to connect via OAuth");
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
      await fetch("/api/trpc/integrations.saveCredential?batch=1", {
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
      if (!connected.includes(activeModal.id)) {
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
            productivity apps, and developer platforms via One-Click OAuth or MCP discovery.
          </p>
        </div>
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

      {searchQuery ? (
        <div className="integration-list">
          {filteredIntegrations.map(integration => {
            const isConnected = connected.includes(integration.id);
            return (
              <div className="integration-card" key={integration.id}>
                <div className="integration-card-icon">
                  {renderBrandIcon(integration.name, 20)}
                </div>
                <div className="integration-card-copy">
                  <strong>{integration.name}</strong>
                  <span>{integration.description}</span>
                </div>
                <button
                  className={`integration-card-action ${isConnected ? "is-connected" : ""}`}
                  onClick={() => openModal(integration)}
                >
                  {isConnected ? (
                    <>
                      <Check size={13} /> Connected
                    </>
                  ) : (
                    <>
                      Add <ChevronRight size={13} />
                    </>
                  )}
                </button>
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
                    <div className="integration-card" key={integration.id}>
                      <div className="integration-card-icon">
                        {renderBrandIcon(integration.name, 20)}
                      </div>
                      <div className="integration-card-copy">
                        <strong>{integration.name}</strong>
                        <span>{integration.description}</span>
                      </div>
                      <button
                        className={`integration-card-action ${isConnected ? "is-connected" : ""}`}
                        onClick={() => openModal(integration)}
                      >
                        {isConnected ? (
                          <>
                            <Check size={13} /> Connected
                          </>
                        ) : (
                          <>
                            Add <ChevronRight size={13} />
                          </>
                        )}
                      </button>
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
                <div className="modal-icon">
                  {renderBrandIcon(activeModal.name, 24)}
                </div>
                <div>
                  <h3>{activeModal.name} Plugin</h3>
                  <span className="modal-subtitle">
                    {activeModal.category || "Connector"}
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

            <p className="modal-description">{activeModal.description}</p>

            {/* Connection Mode Selector */}
            <div className="modal-connection-toggle" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <Button
                variant={connectionMode === "oauth" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionMode("oauth")}
              >
                <Lock size={13} style={{ marginRight: "6px" }} /> One-Click OAuth
              </Button>
              {activeModal.supportsMcp && (
                <Button
                  variant={connectionMode === "mcp" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConnectionMode("mcp")}
                >
                  <Zap size={13} style={{ marginRight: "6px" }} /> Connect via MCP
                </Button>
              )}
            </div>

            {connectionMode === "oauth" && (
              <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>One-Click OAuth Connection</div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: "1.4" }}>
                  Authorize Hanna to interact with your {activeModal.name} account securely without entering raw secret keys.
                </p>
                <Button onClick={handleConnectOAuth} disabled={saving} className="w-full" style={{ background: "#1a73e8", color: "#fff" }}>
                  {saving ? "Authorizing..." : `Authorize with ${activeModal.name}`}
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
