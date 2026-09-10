/*
 * Integrations Page — Third-party service integrations
 * Shopify, Creatify, HeyGen, social media, marketing tools, etc.
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
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const categories = [
  {
    label: "E-Commerce & Dropshipping",
    ids: ["shopify", "woocommerce", "stripe", "cjdropshipping", "zendrop", "autods", "takeapp"],
  },
  {
    label: "Social Media & Customer Reach",
    ids: [
      "instagram",
      "tiktok",
      "youtube",
      "pinterest",
      "linktree",
      "beacons",
      "whatsapp",
    ],
  },
  {
    label: "Video & Visual Generation",
    ids: ["heygen", "invideo", "creatify", "synthesia", "elevenlabs"],
  },
  {
    label: "Marketing & Ads",
    ids: ["meta-ads", "google-ads", "hubspot", "mailchimp"],
  },
  {
    label: "CRM, ERP & Support",
    ids: ["salesforce", "zendesk", "intercom", "quickbooks", "twilio"],
  },
  {
    label: "Productivity & Collaboration",
    ids: ["google-workspace", "gmail", "slack", "notion", "airtable", "zapier"],
  },
  {
    label: "Developer & AI Tools",
    ids: [
      "github",
      "jira",
      "vercel",
      "jules",
      "stitch",
      "v0",
      "lovable",
    ],
  },
];

type IntegrationsPageProps = {
  onBack?: () => void;
};

export default function IntegrationsPage({ onBack }: IntegrationsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<IntegrationDefinition | null>(
    null
  );
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
    setFormInputs(
      integration.supportsMcp ? { connectionMode: "mcp" } : {}
    );
  };

  const handleSave = async () => {
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
                connectionMode: formInputs.connectionMode || "api",
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
          <span className="eyebrow">Extensions</span>
          <h1 className="page-title">Integrations</h1>
          <p className="page-description">
            Connect the places where your work lives. Link your store, social
            accounts, video generators, and marketing tools.
          </p>
        </div>
      </div>

      <div className="page-search">
        <Search size={14} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search integrations..."
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
              No integrations matching "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        categories.map(cat => {
          const catItems = filteredIntegrations.filter(i =>
            cat.ids.includes(i.id)
          );
          if (!catItems.length) return null;
          return (
            <div className="integration-category" key={cat.label}>
              <h3 className="integration-category-label">{cat.label}</h3>
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
                  {renderBrandIcon(activeModal.name, 22)}
                </div>
                <div>
                  <h3>{activeModal.name} Setup</h3>
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

            {activeModal.instructions.length > 0 && (
              <div className="modal-instructions">
                <div className="modal-instructions-label">
                  Connection Instructions
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
                Official Documentation <ExternalLink size={13} />
              </a>
            )}

            {activeModal.supportsMcp && (
              <div className="modal-connection-toggle">
                <Button
                  variant={
                    formInputs.connectionMode === "mcp" ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormInputs({ connectionMode: "mcp" })
                  }
                >
                  Connect using MCP
                </Button>
                <Button
                  variant={
                    formInputs.connectionMode === "mcp" ? "outline" : "default"
                  }
                  onClick={() =>
                    setFormInputs({ connectionMode: "api" })
                  }
                >
                  Use API key
                </Button>
              </div>
            )}

            <div className="modal-fields">
              {(activeModal.supportsMcp && formInputs.connectionMode === "mcp"
                ? ["serverUrl"]
                : activeModal.credentialFields
              ).map(field => (
                <label key={field} className="modal-field">
                  <span className="modal-field-label">
                    {field.replace(/([A-Z])/g, " $1")}
                  </span>
                  <input
                    type={
                      field.toLowerCase().includes("key") ||
                      field.toLowerCase().includes("token") ||
                      field.toLowerCase().includes("secret") ||
                      field.toLowerCase().includes("access")
                        ? "password"
                        : "text"
                    }
                    value={formInputs[field] || ""}
                    onChange={e =>
                      setFormInputs(prev => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    placeholder={`Enter your ${field}...`}
                  />
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Credentials"}
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
