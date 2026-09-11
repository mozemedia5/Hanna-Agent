/*
 * Connectors Page — API keys and model provider credentials
 * Manage connections to AI models: Gemini, OpenAI, Anthropic, Groq, etc.
 */
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import { renderBrandIcon } from "@/components/ProviderIcons";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ExternalLink,
  KeyRound,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type ConnectorEntry = {
  id: string;
  name: string;
  model: string;
  docUrl: string;
  instructions: string[];
  credentialFields: string[];
};

const connectors: ConnectorEntry[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "Hanna Lite (Gemini 2.5 Flash) / Hanna Pro (Gemini 2.5 Flash)",
    docUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    instructions: [
      "Go to Google AI Studio (aistudio.google.com).",
      "Click 'Get API Key' → 'Create API Key'.",
      "Copy your key starting with 'AIzaSy...'.",
      "Paste your key below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "openai",
    name: "OpenAI",
    model: "GPT-4o / o-series",
    docUrl: "https://platform.openai.com/api-keys",
    instructions: [
      "Log into platform.openai.com.",
      "Navigate to API Keys.",
      "Click 'Create new secret key'.",
      "Copy key starting with 'sk-' and paste below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    model: "Claude 3.5 Sonnet / Opus",
    docUrl: "https://docs.anthropic.com/en/api/getting-started",
    instructions: [
      "Log into console.anthropic.com.",
      "Go to Settings → API Keys.",
      "Create a key starting with 'sk-ant-'.",
      "Paste your key below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "llama",
    name: "Groq / Llama",
    model: "Llama 3.3 70B / Mixtral",
    docUrl: "https://console.groq.com/keys",
    instructions: [
      "Log into console.groq.com.",
      "Navigate to API Keys.",
      "Click 'Create API Key'.",
      "Paste your Groq key starting with 'gsk_' below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "jules",
    name: "Jules AI Agent",
    model: "Google Jules Autonomous SE",
    docUrl: "https://jules.google/docs",
    instructions: [
      "Access Google Jules Developer Console.",
      "Go to API & Auth Settings.",
      "Generate a Jules Agent Token.",
      "Paste key below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "stitch",
    name: "Stitch UI",
    model: "Google Stitch UI Generator",
    docUrl: "https://stitch.google/docs",
    instructions: [
      "Access Google Stitch UI Console.",
      "Go to API Keys section.",
      "Generate an API Token.",
      "Paste key below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "v0",
    name: "v0 by Vercel",
    model: "v0 Generative UI System",
    docUrl: "https://v0.dev/docs/api",
    instructions: [
      "Log into v0.dev.",
      "Go to Account Settings → API Keys.",
      "Create a secret token.",
      "Paste key below.",
    ],
    credentialFields: ["apiKey"],
  },
  {
    id: "custom",
    name: "Custom provider",
    model: "OpenAI-compatible endpoint",
    docUrl: "https://platform.openai.com/docs/api-reference",
    instructions: [
      "Enter any OpenAI-compatible API key.",
      "Provide custom base endpoint URL if needed.",
      "Save below.",
    ],
    credentialFields: ["apiKey"],
  },
];

type ConnectorsPageProps = {
  onBack?: () => void;
};

export default function ConnectorsPage({ onBack }: ConnectorsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<ConnectorEntry | null>(null);
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return connectors;
    const q = searchQuery.toLowerCase();
    return connectors.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const openModal = (connector: ConnectorEntry) => {
    setActiveModal(connector);
    setFormInputs({});
  };

  const handleSave = async () => {
    if (!activeModal) return;
    const apiKey = formInputs["apiKey"] || formInputs["key"] || "";
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const token = await getFirebaseIdToken();
      await fetch("/api/trpc/providers.save?batch=1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          0: {
            json: {
              provider: activeModal.id,
              displayName: activeModal.name,
              apiKey: apiKey.trim(),
            },
          },
        }),
      });
      setToast(`${activeModal.name} API key connected`);
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
          <span className="eyebrow">Connections</span>
          <h1 className="page-title">Connectors</h1>
          <p className="page-description">
            Manage API keys for AI models. Keys are encrypted server-side and
            used when you select or request specific AI models.
          </p>
        </div>
      </div>

      <div className="page-search">
        <Search size={14} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search connectors..."
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Gemini highlighted as default */}
      <div className="connector-highlight">
        <div className="connector-highlight-icon">
          <Zap size={18} />
        </div>
        <div className="connector-highlight-copy">
          <strong>Hanna Lite (Gemini 2.5 Flash) &amp; Hanna Pro (Gemini 2.5 Flash)</strong>
          <span>
            Hanna uses proprietary engine configurations powered by Gemini 2.5 Flash (Hanna Lite and Hanna Pro). Add your Gemini API key to activate custom limits and full capability.
          </span>
        </div>
      </div>

      <div className="connector-list">
        {filtered.map(connector => (
          <div className="connector-card" key={connector.id}>
            <div className="connector-card-icon">
              {renderBrandIcon(connector.name, 22)}
            </div>
            <div className="connector-card-copy">
              <strong>{connector.name}</strong>
              <span>{connector.model}</span>
            </div>
            <button
              className="connector-card-action"
              onClick={() => openModal(connector)}
            >
              <KeyRound size={13} />
              Connect key
              <ChevronRight size={13} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="page-empty">No connectors matching "{searchQuery}"</div>
        )}
      </div>

      {/* Setup Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon">
                  {renderBrandIcon(activeModal.name, 22)}
                </div>
                <div>
                  <h3>{activeModal.name} Setup</h3>
                  <span className="modal-subtitle">AI Model API Key</span>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                <X size={18} />
              </button>
            </div>

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

            <div className="modal-fields">
              {activeModal.credentialFields.map(field => (
                <label key={field} className="modal-field">
                  <span className="modal-field-label">
                    {field.replace(/([A-Z])/g, " $1")}
                  </span>
                  <input
                    type="password"
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
