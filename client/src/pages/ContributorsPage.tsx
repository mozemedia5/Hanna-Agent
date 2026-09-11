/*
 * Contributor Control Panel (Head of Contributors)
 * Manage seats, invite contributors, set monthly credits, and manage shared chat access.
 */
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Crown,
  Mail,
  Plus,
  Shield,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

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
  const [contributors, setContributors] = useState<Contributor[]>([
    {
      id: "c1",
      email: "owner@workspace.com",
      name: "Head of Contributors (Owner)",
      role: "head",
      status: "active",
      monthlyCreditLimit: 20000,
    },
    {
      id: "c2",
      email: "alex@store.com",
      name: "Alex E-Commerce Lead",
      role: "admin",
      status: "active",
      monthlyCreditLimit: 5000,
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "admin">("editor");
  const [inviteCredits, setInviteCredits] = useState("2000");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: Contributor = {
      id: `contrib_${Date.now()}`,
      email: inviteEmail.trim().toLowerCase(),
      name: inviteEmail.split("@")[0],
      role: inviteRole,
      status: "invited",
      monthlyCreditLimit: Number(inviteCredits) || 2000,
    };

    setContributors(prev => [...prev, newMember]);
    setInviteEmail("");
    showToast(`Invitation sent to ${newMember.email}`);
  };

  const handleRemove = (id: string) => {
    setContributors(prev => prev.filter(c => c.id !== id || c.role === "head"));
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
        <form onSubmit={handleInvite} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px auto", gap: "12px", alignItems: "end" }}>
          <div>
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
          <div>
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
          <div>
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
          <Button type="submit" style={{ background: "var(--gemini-accent)", color: "#ffffff", borderRadius: "10px", padding: "10px 18px", fontWeight: "600" }}>
            <Plus size={16} style={{ marginRight: "6px" }} /> Send Invite
          </Button>
        </form>
      </div>

      {/* Contributor List */}
      <div className="settings-card" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
          Active &amp; Pending Contributors ({contributors.length})
        </h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {contributors.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-raised)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "var(--gemini-accent)" }}>
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary)" }}>{c.name}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{c.email}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                  <button onClick={() => handleRemove(c.id)} style={{ background: "none", border: "none", color: "#ea4335", cursor: "pointer", padding: "6px" }} title="Remove contributor">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
