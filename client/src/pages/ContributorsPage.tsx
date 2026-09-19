/*
 * Contributor Control Panel (Head of Contributors)
 * Manage seats, invite contributors, set monthly credits, and manage shared chat access.
 */
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Crown,
  Plus,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type Contributor = {
  id: string;
  email: string;
  name: string;
  role: "head" | "admin" | "editor" | "viewer";
  status: "active" | "invited" | "disabled";
  monthlyCreditLimit: number;
};

type ContributorsPageProps = {
  onBack?: () => void;
};

export default function ContributorsPage({ onBack }: ContributorsPageProps) {
  const { user } = useAuth();

  const [contributors, setContributors] = useState<Contributor[]>(() => {
    const saved = localStorage.getItem("hanna_contributors");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back
      }
    }
    const currentName = user?.displayName || user?.email?.split("@")[0] || "Workspace Head";
    const currentEmail = user?.email || "owner@workspace.com";
    return [
      {
        id: "head_owner",
        email: currentEmail,
        name: `${currentName} (Owner)`,
        role: "head",
        status: "active",
        monthlyCreditLimit: 20000,
      },
    ];
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "admin">("editor");
  const [inviteCredits, setInviteCredits] = useState("2000");
  const [toast, setToast] = useState("");
  const [deletingContributor, setDeletingContributor] = useState<Contributor | null>(null);

  useEffect(() => {
    localStorage.setItem("hanna_contributors", JSON.stringify(contributors));
  }, [contributors]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const emailClean = inviteEmail.trim().toLowerCase();
    if (contributors.some(c => c.email === emailClean)) {
      showToast("Contributor email already exists");
      return;
    }

    const newMember: Contributor = {
      id: `contrib_${Date.now()}`,
      email: emailClean,
      name: emailClean.split("@")[0],
      role: inviteRole,
      status: "invited",
      monthlyCreditLimit: Number(inviteCredits) || 2000,
    };

    setContributors(prev => [...prev, newMember]);
    setInviteEmail("");
    showToast(`Invitation sent to ${newMember.email}`);
  };

  const confirmDelete = (c: Contributor) => {
    if (c.role === "head") return;
    setDeletingContributor(c);
  };

  const handleExecuteRemove = () => {
    if (!deletingContributor) return;
    const id = deletingContributor.id;
    setContributors(prev => prev.filter(c => c.id !== id || c.role === "head"));
    setDeletingContributor(null);
    showToast("Contributor removed from workspace");
  };

  const handleUpdateCredits = (id: string, newCredits: number) => {
    setContributors(prev =>
      prev.map(c => (c.id === id ? { ...c, monthlyCreditLimit: newCredits } : c))
    );
    showToast("Monthly credit limit updated");
  };

  return (
    <div className="page-container custom-scroll" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <div className="page-header-top" style={{ marginBottom: "16px" }}>
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Back to workspace">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="page-header" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ background: "rgba(26,115,232,0.12)", color: "var(--gemini-accent)", padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Crown size={14} /> Head of Contributors Control Panel
          </span>
        </div>
        <h1 className="page-title" style={{ fontSize: "28px" }}>Contributor Seats &amp; Collaboration</h1>
        <p className="page-description" style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Invite team contributors, assign roles, set individual monthly credit caps, and manage shared chat access.
        </p>
      </div>

      {/* Invite Section */}
      <div className="settings-card" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} style={{ color: "var(--gemini-accent)" }} /> Invite New Contributor
        </h3>
        <form onSubmit={handleInvite} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", alignItems: "end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Contributor Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px" }}
            />
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px" }}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Monthly Credits
            </label>
            <input
              type="number"
              value={inviteCredits}
              onChange={e => setInviteCredits(e.target.value)}
              placeholder="2000"
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px" }}
            />
          </div>
          <div style={{ minWidth: "140px" }}>
            <Button type="submit" style={{ width: "100%", background: "var(--gemini-accent)", color: "#ffffff", borderRadius: "10px", padding: "10px 18px", fontWeight: "600" }}>
              <Plus size={16} style={{ marginRight: "6px" }} /> Send Invite
            </Button>
          </div>
        </form>
      </div>

      {/* Contributor List */}
      <div className="settings-card" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
          Active &amp; Pending Contributors ({contributors.length})
        </h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {contributors.map(c => (
            <div key={c.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-raised)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "var(--gemini-accent)" }}>
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary)" }}>{c.name}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{c.email}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", padding: "4px 10px", borderRadius: "999px", background: c.role === "head" ? "rgba(26,115,232,0.15)" : "var(--surface-raised)", color: c.role === "head" ? "var(--gemini-accent)" : "var(--text-secondary)" }}>
                  {c.role}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <Zap size={14} style={{ color: "var(--gemini-accent)" }} />
                  <input
                    type="number"
                    value={c.monthlyCreditLimit}
                    disabled={c.role === "head"}
                    onChange={e => handleUpdateCredits(c.id, Number(e.target.value))}
                    style={{ width: "80px", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "var(--text-primary)" }}
                  />
                  <span>cr/mo</span>
                </div>

                {c.role !== "head" && (
                  <button onClick={() => confirmDelete(c)} style={{ background: "none", border: "none", color: "#ea4335", cursor: "pointer", padding: "6px" }} title="Remove contributor">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {deletingContributor && (
        <div className="modal-overlay" onClick={() => setDeletingContributor(null)}>
          <div className="modal-content" style={{ maxWidth: "400px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Confirm Removal</h3>
              <button onClick={() => setDeletingContributor(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Are you sure you want to remove <strong>{deletingContributor.name}</strong> ({deletingContributor.email}) from this workspace? They will lose access to all shared chats and workspace credits.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setDeletingContributor(null)}>Cancel</Button>
              <Button onClick={handleExecuteRemove} style={{ background: "#ea4335", color: "#ffffff" }}>
                Remove Contributor
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
