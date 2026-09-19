import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  ArrowLeft,
  Trash2,
  Calendar,
  MessageSquare,
  FileText,
  Pin,
  MoreVertical,
  Upload,
  BookOpen,
  Share2,
  Archive,
  FolderInput,
  Check,
  Search,
  X,
  FileUp,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProjectFile = {
  id: string;
  name: string;
  type: "pdf" | "image" | "audio" | "video" | "other";
  size: string;
  uploadedAt: string;
};

export type ProjectChat = {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: string;
  category: string;
  chats: ProjectChat[];
  files: ProjectFile[];
};

const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "Default Workspace",
    description: "Primary workspace for general store queries, market analysis, and agent execution.",
    instructions: "Always provide step-by-step clear answers with code examples or direct action steps when requested.",
    createdAt: "2025-01-15",
    category: "General",
    chats: [
      { id: "c-1", title: "Market Research Overview", lastMessage: "Here is the breakdown of top market trends...", updatedAt: "Today", isPinned: true },
      { id: "c-2", title: "Shopify Theme Debugging", lastMessage: "Updated Liquid template code block attached.", updatedAt: "Yesterday" },
    ],
    files: [
      { id: "f-1", name: "Q1_Market_Brief.pdf", type: "pdf", size: "2.4 MB", uploadedAt: "Jan 18" },
      { id: "f-2", name: "Store_Banner.png", type: "image", size: "1.1 MB", uploadedAt: "Jan 20" },
    ],
  },
  {
    id: "proj-2",
    name: "Shopify Store Operations",
    description: "Product catalog sync, inventory threshold checks, and automated order updates.",
    instructions: "Focus on e-commerce catalog optimization, high converting product descriptions, and stock management.",
    createdAt: "2025-02-01",
    category: "E-Commerce",
    chats: [
      { id: "c-3", title: "Inventory Threshold Sync", lastMessage: "Ran daily inventory check; 3 items low in stock.", updatedAt: "Feb 02" },
    ],
    files: [
      { id: "f-3", name: "Product_Catalog.csv", type: "other", size: "540 KB", uploadedAt: "Feb 01" },
    ],
  },
];

export default function ProjectsPage({ onBack }: { onBack?: () => void }) {
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "files" | "instructions">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectInstructions, setNewProjectInstructions] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("General");

  // Chat Actions Menu & Modal State
  const [openChatMenuId, setOpenChatMenuId] = useState<string | null>(null);
  const [showAddChatModal, setShowAddChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [toast, setToast] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      instructions: newProjectInstructions.trim() || "Provide clear, structured responses tailored to this project.",
      createdAt: new Date().toISOString().split("T")[0],
      category: newProjectCategory,
      chats: [],
      files: [],
    };
    setProjects(prev => [newProj, ...prev]);
    setNewProjectName("");
    setNewProjectDesc("");
    setNewProjectInstructions("");
    setShowCreateModal(false);
    showToast(`Project "${newProj.name}" created successfully!`);
  }

  function handleDeleteProject(id: string, name: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    showToast(`Deleted project "${name}"`);
  }

  function handleAddChatToProject() {
    if (!activeProjectId || !newChatTitle.trim()) return;
    const newChat: ProjectChat = {
      id: `chat-${Date.now()}`,
      title: newChatTitle.trim(),
      lastMessage: "Conversation initialized in project workspace.",
      updatedAt: "Just now",
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, chats: [newChat, ...p.chats] } : p));
    setNewChatTitle("");
    setShowAddChatModal(false);
    showToast(`Added chat "${newChat.title}" to project`);
  }

  function handleProjectFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeProjectId || !e.target.files?.length) return;
    const filesArray = Array.from(e.target.files);
    const uploaded: ProjectFile[] = filesArray.map(f => {
      const isPdf = f.type === "application/pdf" || f.name.endsWith(".pdf");
      const isImg = f.type.startsWith("image/");
      const isAud = f.type.startsWith("audio/");
      const isVid = f.type.startsWith("video/");
      const kind: ProjectFile["type"] = isPdf ? "pdf" : isImg ? "image" : isAud ? "audio" : isVid ? "video" : "other";
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        type: kind,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: "Just now",
      };
    });
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, files: [...uploaded, ...p.files] } : p));
    showToast(`Uploaded ${uploaded.length} file(s) to project`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function togglePinChat(chatId: string) {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        chats: p.chats.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c),
      };
    }));
    setOpenChatMenuId(null);
    showToast("Chat pin status updated");
  }

  function archiveProjectChat(chatId: string) {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        chats: p.chats.map(c => c.id === chatId ? { ...c, isArchived: !c.isArchived } : c),
      };
    }));
    setOpenChatMenuId(null);
    showToast("Chat archived");
  }

  function deleteProjectChat(chatId: string) {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        chats: p.chats.filter(c => c.id !== chatId),
      };
    }));
    setOpenChatMenuId(null);
    showToast("Chat removed from project");
  }

  const currentProject = projects.find(p => p.id === activeProjectId);

  const filteredProjects = projects.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Hidden file uploader for project files */}
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleProjectFileUpload} multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.csv" />

      {/* Eyebrow & Back Button Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <button
            onClick={() => {
              if (activeProjectId) {
                setActiveProjectId(null);
              } else if (onBack) {
                onBack();
              }
            }}
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
            <ArrowLeft size={16} /> {activeProjectId ? "All Projects" : "Back to Workspace"}
          </button>
          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderKanban size={24} style={{ color: "var(--gemini-accent, #1a73e8)" }} />
            {currentProject ? currentProject.name : "Workspace Projects"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            {currentProject ? currentProject.description : "Organize chats, uploaded files (PDFs, images, audio, video), and project instructions into dedicated spaces."}
          </p>
        </div>

        {!activeProjectId && (
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{ background: "var(--gemini-accent, #1a73e8)", color: "#ffffff", borderRadius: "10px", padding: "8px 16px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> New Project
          </Button>
        )}
      </div>

      {/* PROJECT DETAILS VIEW */}
      {currentProject ? (
        <div>
          {/* Navigation Tabs for Active Project */}
          <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
            <button
              onClick={() => setActiveTab("chats")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", padding: "8px 16px", borderRadius: "10px", background: activeTab === "chats" ? "var(--surface-raised, #2a2b2d)" : "transparent", color: activeTab === "chats" ? "var(--gemini-accent, #1a73e8)" : "var(--text-secondary)", border: "none", cursor: "pointer" }}
            >
              <MessageSquare size={16} /> Chats ({currentProject.chats.length})
            </button>
            <button
              onClick={() => setActiveTab("files")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", padding: "8px 16px", borderRadius: "10px", background: activeTab === "files" ? "var(--surface-raised, #2a2b2d)" : "transparent", color: activeTab === "files" ? "var(--gemini-accent, #1a73e8)" : "var(--text-secondary)", border: "none", cursor: "pointer" }}
            >
              <FileText size={16} /> Files ({currentProject.files.length})
            </button>
            <button
              onClick={() => setActiveTab("instructions")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", padding: "8px 16px", borderRadius: "10px", background: activeTab === "instructions" ? "var(--surface-raised, #2a2b2d)" : "transparent", color: activeTab === "instructions" ? "var(--gemini-accent, #1a73e8)" : "var(--text-secondary)", border: "none", cursor: "pointer" }}
            >
              <BookOpen size={16} /> Project Instructions
            </button>
          </div>

          {/* TAB 1: CHATS */}
          {activeTab === "chats" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Project Chats</h3>
                <Button onClick={() => setShowAddChatModal(true)} size="sm" style={{ background: "var(--gemini-accent, #1a73e8)", color: "#ffffff" }}>
                  <Plus size={14} /> Add New Chat
                </Button>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {currentProject.chats.map(chat => (
                  <div
                    key={chat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--surface, #1e1f20)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <MessageSquare size={18} style={{ color: "var(--gemini-accent)" }} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{chat.title}</strong>
                          {chat.isPinned && <Pin size={12} style={{ color: "#fbbc04", transform: "rotate(45deg)" }} />}
                          {chat.isArchived && <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--surface-raised)", borderRadius: "4px", color: "var(--text-tertiary)" }}>Archived</span>}
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{chat.lastMessage}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{chat.updatedAt}</span>

                      {/* Ellipsis (...) menu on every chat */}
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setOpenChatMenuId(openChatMenuId === chat.id ? null : chat.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "4px" }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openChatMenuId === chat.id && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "28px",
                              zIndex: 100,
                              background: "var(--surface-raised, #2a2b2d)",
                              border: "1px solid var(--border)",
                              borderRadius: "12px",
                              padding: "6px",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                              minWidth: "160px",
                              display: "grid",
                              gap: "4px",
                            }}
                          >
                            <button
                              onClick={() => togglePinChat(chat.id)}
                              style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "8px 10px", background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                            >
                              <Pin size={14} /> {chat.isPinned ? "Unpin Chat" : "Pin Chat"}
                            </button>
                            <button
                              onClick={() => archiveProjectChat(chat.id)}
                              style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "8px 10px", background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                            >
                              <Archive size={14} /> {chat.isArchived ? "Unarchive" : "Archive"}
                            </button>
                            <button
                              onClick={() => { setOpenChatMenuId(null); showToast("Link copied"); }}
                              style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "8px 10px", background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                            >
                              <Share2 size={14} /> Share Chat
                            </button>
                            <div style={{ height: "1px", background: "var(--border)", margin: "2px 0" }} />
                            <button
                              onClick={() => deleteProjectChat(chat.id)}
                              style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "8px 10px", background: "transparent", border: "none", color: "#ea4335", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                            >
                              <Trash2 size={14} /> Delete Chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {currentProject.chats.length === 0 && (
                  <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-tertiary)", padding: "20px" }}>No chats in this project yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FILES */}
          {activeTab === "files" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Project Files & Assets</h3>
                <Button onClick={() => fileInputRef.current?.click()} size="sm" style={{ background: "var(--gemini-accent, #1a73e8)", color: "#ffffff" }}>
                  <FileUp size={14} /> Upload File (PDF, Image, Audio, Video)
                </Button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                {currentProject.files.map(file => (
                  <div
                    key={file.id}
                    style={{
                      background: "var(--surface, #1e1f20)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {file.type === "pdf" ? <FileText size={20} style={{ color: "#ea4335" }} /> : file.type === "image" ? <ImageIcon size={20} style={{ color: "#34a853" }} /> : file.type === "audio" ? <AudioIcon size={20} style={{ color: "#fbbc04" }} /> : file.type === "video" ? <VideoIcon size={20} style={{ color: "#a142f4" }} /> : <FileText size={20} style={{ color: "var(--gemini-accent)" }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</strong>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{file.size} • {file.uploadedAt}</span>
                    </div>
                  </div>
                ))}

                {currentProject.files.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "var(--text-tertiary)", fontSize: "13px" }}>
                    No files uploaded to this project yet. Upload PDFs, images, audio, or videos to share with Hanna.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INSTRUCTIONS */}
          {activeTab === "instructions" && (
            <div style={{ background: "var(--surface, #1e1f20)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: "700" }}>Project Context & System Instructions</h3>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--text-secondary)" }}>
                Hanna strictly follows these specific context instructions when executing chats and tasks within <strong>"{currentProject.name}"</strong>.
              </p>
              <textarea
                value={currentProject.instructions}
                onChange={e => {
                  const val = e.target.value;
                  setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, instructions: val } : p));
                }}
                rows={5}
                style={{ width: "100%", background: "var(--surface-raised, #2a2b2d)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", color: "var(--text-primary)", fontSize: "13px" }}
              />
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => showToast("Project instructions saved")} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Save Instructions</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PROJECTS LIST GRID */
        <>
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
                onClick={() => setActiveProjectId(proj.id)}
                style={{
                  background: "var(--surface, #1e1f20)",
                  border: "1px solid var(--border, rgba(255,255,255,0.1))",
                  borderRadius: "16px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
                      onClick={e => { e.stopPropagation(); handleDeleteProject(proj.id, proj.name); }}
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
                    <MessageSquare size={13} /> {proj.chats.length} chats
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <FileText size={13} /> {proj.files.length} files
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
        </>
      )}

      {/* Add New Chat Modal */}
      {showAddChatModal && (
        <div className="modal-overlay" onClick={() => setShowAddChatModal(false)}>
          <div className="modal-content" style={{ maxWidth: "420px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "700" }}>Add New Chat to Project</h3>
            <input
              type="text"
              value={newChatTitle}
              onChange={e => setNewChatTitle(e.target.value)}
              placeholder="Chat title / conversation topic..."
              style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px", marginBottom: "16px" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setShowAddChatModal(false)}>Cancel</Button>
              <Button onClick={handleAddChatToProject} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Add Chat</Button>
            </div>
          </div>
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
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Project System Instructions
                </label>
                <textarea
                  value={newProjectInstructions}
                  onChange={e => setNewProjectInstructions(e.target.value)}
                  placeholder="Custom context instructions for Hanna when responding in this project..."
                  rows={2}
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
