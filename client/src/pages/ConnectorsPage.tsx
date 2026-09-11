/**
 * Connectors Page — Hanna's model runtime is managed by the deployment.
 * External services remain available from the separate Integrations page.
 */
import { ArrowLeft, Check, Zap } from "lucide-react";

type ConnectorsPageProps = {
  onBack?: () => void;
};

export default function ConnectorsPage({ onBack }: ConnectorsPageProps) {
  return (
    <div className="page-container">
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
          <h1 className="page-title">Hanna engine</h1>
          <p className="page-description">
            Hanna uses the Gemini API configured securely in the Vercel server environment.
            External services and business tools are managed from Integrations.
          </p>
        </div>
      </div>

      <div className="connector-highlight">
        <div className="connector-highlight-icon">
          <Zap size={18} />
        </div>
        <div className="connector-highlight-copy">
          <strong>Gemini 2.5 Flash</strong>
          <span>
            Hanna Lite and Hanna Pro use the managed Gemini runtime. The server-side
            GEMINI_API_KEY is never displayed or entered in this page.
          </span>
        </div>
      </div>

      <div className="connector-card" style={{ marginTop: 18 }}>
        <div className="connector-card-icon">
          <Check size={22} />
        </div>
        <div className="connector-card-copy">
          <strong>Managed by deployment</strong>
          <span>Configure GEMINI_API_KEY in Vercel to activate Hanna responses.</span>
        </div>
      </div>
    </div>
  );
}
