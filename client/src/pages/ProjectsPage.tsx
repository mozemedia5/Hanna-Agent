import React, { useState } from "react";
import { FolderKanban, Plus, ArrowLeft, Trash2, Calendar, MessageSquare, ExternalLink, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  chatCount: number;
  category: string;
};

const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "Default Workspace",
    description: "Primary workspace for general store queries, market analysis, and agent execution.",
    createdAt: "2025-01-15",
    chatCount: 4,
    category: "General",
  },
  {
    id: "proj-2",
    name: "Shopify Store Operations",
    description: "Product catalog sync, inventory threshold checks, and automated order updates.",
    createdAt: "2025-02-01",
    chatCount: 2,
    category: "E-Commerce",
  },
  {
    id: "proj-3",
    name: "Marketing & Ad Campaigns",
    description: "High-ROAS Facebook & Google ad concepts, social captions, and video scripts.",
    createdAt: "2025-02-10",
    chatCount: 3,
    category: "Marketing",
  },
];

export default function ProjectsPage({ onBack }: { onBack?: () => void }) {
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("General");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handleCreateProject() {
    if (!newProjectName.trim()) return;
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || "Custom user workspace project.",
      createdAt: new Date().toISOString().split("T")[0],
      chatCount: 0,
      category: newProjectCategory,
    };
    setProjects(prev => [newProj, ...prev]);
    setNewProjectName("");
    setNewProjectDesc("");
    setShowCreateModal(false);
    showToast(`Project "${newProj.name}" created successfully!`);
  }

  function handleDeleteProject(id: string, name: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast(`Deleted project "${name}"`);
  }

  const filteredProjects = projects.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Eyebrow & Back Button Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--gemini-accent, #1a73e8)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              <ArrowLeft size={16} /> Back to Workspace
            </button>
          )}
          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderKanban size={24} style={{ color: "var(--gemini-accent, #1a73e8)" }} /> Workspace Projects
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            Organize chats, automated tasks, and connector workflows into dedicated project spaces.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          style={{ background: "var(--gemini-accent, #1a73e8)", color: "#ffffff", borderRadius: "10px", padding: "8px 16px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> New Project
        </Button>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, description, or category..."
          style={{
            width: "100%",
            padding: "10px 14px 10px 38px",
            background: "var(--surface, #1e1f20)",
            border: "1px solid var(--border, rgba(255,255,255,0.1))",
            borderRadius: "12px",
            color: "var(--text-primary, #ffffff)",
            fontSize: "13px",
          }}
        />
        <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-tertiary)" }} />
      </div>

      {/* Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {filteredProjects.map(proj => (
          <div
            key={proj.id}
            style={{
              background: "var(--surface, #1e1f20)",
              border: "1px solid var(--border, rgba(255,255,255,0.1))",
              borderRadius: "16px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    color: "var(--gemini-accent, #1a73e8)",
                    background: "rgba(26, 115, 232, 0.12)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {proj.category}
                </span>
                <button
                  onClick={() => handleDeleteProject(proj.id, proj.name)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "4px" }}
                  title="Delete project"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                {proj.name}
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {proj.description}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border, rgba(255,255,255,0.08))", paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "var(--text-tertiary)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <MessageSquare size={13} /> {proj.chatCount} chats
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={13} /> {proj.createdAt}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
          <FolderKanban size={32} style={{ color: "var(--text-tertiary)", marginBottom: "8px" }} />
          <p style={{ margin: 0, fontSize: "14px" }}>No projects found matching "{searchQuery}".</p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: "440px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "700" }}>Create New Project Workspace</h3>
            <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Growth Strategy"
                  style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Category
                </label>
                <select
                  value={newProjectCategory}
                  onChange={e => setNewProjectCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                >
                  <option value="General">General</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Automation">Automation</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Describe the objective of this project workspace..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Create Project</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
