import { useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { renderBrandIcon } from "@/components/ProviderIcons";
import { trpc } from "@/lib/trpc";
import type { ApprovalRequest } from "@/hooks/useChatWorkflow";

type ApprovalDecision = "once" | "always" | "deny";
type Props = {
  request: ApprovalRequest;
  onResolved?: (resolution: any) => void;
};

function readableAction(action: string) {
  return action.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function PermissionApprovalCard({ request, onResolved }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [resolution, setResolution] = useState<any>(null);
  const [failure, setFailure] = useState("");
  const resolveApproval = trpc.integrations.resolveApproval.useMutation();
  const isPending = resolveApproval.isPending;

  const decide = async (decision: ApprovalDecision) => {
    setFailure("");
    try {
      const result = await resolveApproval.mutateAsync({
        approvalId: request.approvalId,
        decision,
      });
      setResolution(result);
      onResolved?.(result);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "The approval request could not be completed.");
      setResolution({ status: "uncertain" });
    }
  };

  const formatJson = (value: unknown) => {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <section className="permission-approval-card" aria-label={`${request.connector} permission request`}>
      <div className="permission-approval-icon" aria-hidden="true">
        {renderBrandIcon(request.connector, 38)}
      </div>

      <div className="permission-approval-title">
        Hanna wants to use
        <strong>{readableAction(request.action)}</strong>
        <span>from <b>{readableAction(request.connector)}</b></span>
      </div>

      {!resolution && (
        <button
          type="button"
          className="permission-approval-details-toggle"
          onClick={() => setShowDetails(value => !value)}
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide details" : "Show details"}
          <ChevronDown size={18} className={showDetails ? "is-open" : ""} />
        </button>
      )}

      {showDetails && !resolution && (
        <div className="permission-approval-details">
          <div><span>Requested scope</span><code>{request.scope}</code></div>
          <div><span>Exact request</span><pre>{formatJson(request.parameters)}</pre></div>
          <p>This request expires {new Date(request.expiresAt).toLocaleString()}. Nothing runs until you choose an option.</p>
        </div>
      )}

      {failure && <p className="permission-approval-error" role="alert">{failure}</p>}

      {resolution?.status === "failed" || resolution?.status === "uncertain" ? (
        <div className="permission-approval-outcome is-denied" role="status">
          <ShieldAlert size={18} />
          Hanna could not confirm the outcome. Check the connector activity before retrying.
        </div>
      ) : null}

      {resolution?.status === "denied" ? (
        <div className="permission-approval-outcome is-denied" role="status">
          <XCircle size={18} /> Permission denied. Hanna did not access this scope.
        </div>
      ) : resolution?.status === "completed" ? (
        <div className="permission-approval-result" role="status">
          <div className="permission-approval-outcome is-allowed">
            <CheckCircle2 size={18} />
            {resolution.decision === "always" ? "Allowed always for this scope" : "Allowed once"}
          </div>
          {resolution.summary && <p className="permission-approval-summary">{resolution.summary}</p>}
          {resolution.verification?.detail && <p className="permission-approval-verification">Verified by {request.connector}: {resolution.verification.detail}</p>}
          {resolution.data !== undefined && (
            <details className="permission-approval-live-data">
              <summary>View live result data</summary>
              <pre>{formatJson(resolution.data)}</pre>
            </details>
          )}
        </div>
      ) : (
        <div className="permission-approval-actions">
          <button type="button" className="permission-approval-button is-primary" onClick={() => void decide("once")} disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            Allow once
          </button>
          <button type="button" className="permission-approval-button" onClick={() => void decide("always")} disabled={isPending}>
            Allow always
          </button>
          <p className="permission-approval-scope-note">Always allow applies only to <code>{request.scope}</code>.</p>
          <button type="button" className="permission-approval-button" onClick={() => void decide("deny")} disabled={isPending}>
            Deny
          </button>
          {isPending && <span className="permission-approval-progress"><ShieldAlert size={14} /> Waiting for the connector to verify the result…</span>}
        </div>
      )}
    </section>
  );
}
