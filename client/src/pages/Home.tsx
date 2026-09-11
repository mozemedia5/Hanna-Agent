/*
 * Hanna — Main App Shell
 * Layout with sidebar, page routing, and profile popup.
 */
import { Button } from "@/components/ui/button";
import {
  Archive,
  ArrowUp,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  Globe2,
  ImageIcon,
  Layers3,
  LogOut,
  Megaphone,
  Menu,
  Mic,
  Paperclip,
  PlugZap,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Store,
  X,
  Zap,
  CreditCard,
  Gift,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import type { User } from "firebase/auth";
import {
  listUserConversations,
  saveUserConversation,
  type ClientConversation,
} from "@/lib/firestore";

import SettingsPage from "./SettingsPage";
import ConnectorsPage from "./ConnectorsPage";
import IntegrationsPage from "./IntegrationsPage";
import CollectionsPage from "./CollectionsPage";
import NotificationsPage from "./NotificationsPage";
import ProfilePage from "./ProfilePage";
import UpgradePage from "./UpgradePage";
import UsagePage from "./UsagePage";

type Page =
  | "chat"
  | "settings"
  | "connectors"
  | "integrations"
  | "collections"
  | "notifications"
  | "profile"
  | "upgrade"
  | "usage";

type ToolKey =
  | "Web Search"
  | "Image Input"
  | "Voice"
  | "Study"
  | "Deep Research"
  | "Image Gen";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  tokenCount?: number;
};

const estimateTokens = (c: string) => Math.max(1, Math.ceil(c.length / 4));

type Chat = { id: number; title: string; period: string; messages: Message[] };

const toolConfigs: Array<{ label: ToolKey; icon: typeof Globe2; hint: string }> = [
  { label: "Web Search", icon: Globe2, hint: "Search the web" },
  { label: "Image Input", icon: ImageIcon, hint: "Add an image" },
  { label: "Voice", icon: Mic, hint: "Talk to Hanna" },
  { label: "Study", icon: BookOpen, hint: "Learn step by step" },
  { label: "Deep Research", icon: Search, hint: "Build a sourced brief" },
  { label: "Image Gen", icon: Sparkles, hint: "Create a visual" },
];

export type UploadedFile = {
  id: string; name: string; type: "image" | "pdf" | "video" | "other";
  url: string; dataUrl?: string; size: number;
};

const seedChats: Chat[] = [
  { id: 0, title: "New conversation", period: "Today", messages: [] },
];

function HannaMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`hanna-mark ${small ? "hanna-mark-small" : ""}`} aria-hidden="true">
      <img src="/hanna-icon-192.png" alt="" />
    </span>
  );
}

function ChatItem({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  return (
    <button className={`chat-history-item ${active ? "is-active" : ""}`} onClick={onClick} title={chat.title}>
      <span className="chat-history-title">{chat.title}</span>
      {active && <span className="chat-history-dot" aria-hidden="true" />}
    </button>
  );
}

function ToolChip({ label, icon: Icon, active, onClick }: { label: ToolKey; icon: typeof Globe2; active: boolean; onClick: () => void }) {
  return (
    <button className={`tool-chip ${active ? "is-active" : ""}`} onClick={onClick} aria-pressed={active}>
      <Icon size={14} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

export default function Home({ user, onLogout }: { user?: User | null; onLogout?: () => Promise<void> }) {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const [chats, setChats] = useState<Chat[]>(seedChats);
  const [activeChatId, setActiveChatId] = useState(0);
  const [composer, setComposer] = useState("");
  const [selectedTools, setSelectedTools] = useState<ToolKey[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [model, setModel] = useState("Hanna Lite");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) ?? chats[0], [activeChatId, chats]);
  const hasMessages = activeChat.messages.length > 0;

  useEffect(() => {
    void listUserConversations().then(stored => {
      if (!stored.length) return;
      const formatted = stored.map(chat => ({ ...chat, id: Number(chat.id) || Date.now() + Math.random() }));
      setChats(formatted);
      setActiveChatId(formatted[0].id);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("hanna-theme") as "light" | "dark" | "system" | null;
    const next = saved ?? "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showProfilePopup && !(e.target as HTMLElement).closest(".profile-popup-wrapper")) {
        setShowProfilePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfilePopup]);

  const showToast = (m: string) => setToast(m);

  const applyTheme = (next: "light" | "dark" | "system") => {
    const effective = next === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : next;
    document.documentElement.classList.toggle("dark", effective === "dark");
    document.documentElement.classList.toggle("light", effective === "light");
  };

  const handleThemeChange = (next: "light" | "dark" | "system") => {
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("hanna-theme", next);
  };

  const createChat = () => {
    const newChat: Chat = { id: Date.now(), title: "Untitled conversation", period: "Today", messages: [] };
    setChats(current => [newChat, ...current]);
    setActiveChatId(newChat.id);
    setCurrentPage("chat");
    setComposer("");
    showToast("New conversation ready");
    if (window.innerWidth < 860) setSidebarOpen(false);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const selectChat = (id: number) => {
    setActiveChatId(id);
    setCurrentPage("chat");
    if (window.innerWidth < 860) setSidebarOpen(false);
  };

  const toggleTool = (tool: ToolKey) => {
    setSelectedTools(current => current.includes(tool) ? current.filter(t => t !== tool) : [...current, tool]);
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(f => f.id !== id));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isVideo = file.type.startsWith("video/");
      const kind: UploadedFile["type"] = isImg ? "image" : isPdf ? "pdf" : isVideo ? "video" : "other";
      const objectUrl = URL.createObjectURL(file);
      const item: UploadedFile = { id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: file.name, type: kind, url: objectUrl, size: file.size };
      if (isImg || file.size < 3 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = e => { item.dataUrl = e.target?.result as string; setAttachments(prev => [...prev]); };
        reader.readAsDataURL(file);
      }
      newFiles.push(item);
    });
    setAttachments(prev => [...prev, ...newFiles]);
    showToast(`Attached ${newFiles.length} file(s)`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitMessage = async () => {
    const text = composer.trim();
    if ((!text && attachments.length === 0) || isThinking) return;
    const chatId = activeChatId;
    let contentWithAttachments = text;
    if (attachments.length > 0) {
      const attachSummary = attachments.map(a => `[Attachment: ${a.name} (${a.type.toUpperCase()})]`).join("\n");
      contentWithAttachments = text ? `${text}\n\n${attachSummary}` : attachSummary;
    }
    const userMessage: Message = {
      id: `${chatId}-${Date.now()}`, role: "user", content: contentWithAttachments,
      tokenCount: estimateTokens(contentWithAttachments),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const currentChat = chats.find(c => c.id === chatId) ?? activeChat;
    const chatWithUser = {
      ...currentChat,
      title: currentChat.messages.length === 0 ? (text || attachments[0]?.name || "Attachment").slice(0, 32) : currentChat.title,
      messages: [...currentChat.messages, userMessage],
    };
    setChats(current => current.map(c => c.id === chatId ? chatWithUser : c));
    void saveUserConversation({ ...chatWithUser, id: String(chatWithUser.id) }).catch(() => undefined);
    const sentAttachments = [...attachments];
    setComposer(""); setAttachments([]); setIsThinking(true);
    try {
      const token = await getFirebaseIdToken();
      const isStudyMode = selectedTools.includes("Study");
      const attachmentContext = sentAttachments.length ? `\n[Attached: ${sentAttachments.map(a => `${a.name} (${a.type})`).join(", ")}]` : "";
      const toolsCtx = selectedTools.length ? `[Tools: ${selectedTools.join(", ")}]${isStudyMode ? " [STUDY MODE]" : ""}` : "";
      const fullPrompt = `${toolsCtx}${attachmentContext}\n\n${contentWithAttachments}`;
      const response = await fetch("/api/trpc/hanna.ask?batch=1", {
        method: "POST", credentials: "include",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ 0: { json: { prompt: fullPrompt, model: model === "Custom" ? "custom" : model } } }),
      });
      const responseText = await response.text();
      let payload: Array<{ result?: { data?: { json?: { answer?: string; text?: string; providerError?: boolean } } }; error?: { json?: { message?: string } } }> | null = null;
      try { payload = JSON.parse(responseText); } catch { throw new Error("Hanna is warming up. Please try again."); }
      if (Array.isArray(payload) && payload[0]?.error) throw new Error(payload[0].error?.json?.message || "Hanna encountered an issue.");
      if (!response.ok || !payload) throw new Error("Hanna encountered a server response issue.");
      const data = payload[0]?.result?.data;
      const isJson = data && "json" in data;
      const responseData = isJson ? (data as any).json : undefined;
      const reply = responseData?.answer || responseData?.text;
      const isProviderError = Boolean(responseData?.providerError);
      if (!reply) throw new Error("Hanna returned an empty response.");
      if (isProviderError) {
        showToast("Running on Hanna Agent Core");
      }
      const assistantMessage: Message = {
        id: `${chatId}-assistant-${Date.now()}`, role: "assistant", content: reply,
        tokenCount: estimateTokens(reply), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const completedChat = { ...chatWithUser, messages: [...chatWithUser.messages, assistantMessage] };
      setChats(current => current.map(c => c.id === chatId ? completedChat : c));
      void saveUserConversation({ ...completedChat, id: String(completedChat.id) }).catch(() => undefined);
    } catch (reason) {
      const errorContent = reason instanceof Error ? reason.message : "Hanna is unavailable.";
      const errorMessage: Message = {
        id: `${chatId}-error-${Date.now()}`, role: "assistant", content: errorContent,
        tokenCount: estimateTokens(errorContent), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const failedChat = { ...chatWithUser, messages: [...chatWithUser.messages, errorMessage] };
      setChats(current => current.map(c => c.id === chatId ? failedChat : c));
      void saveUserConversation({ ...failedChat, id: String(failedChat.id) }).catch(() => undefined);
    } finally { setIsThinking(false); }
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitMessage(); }
  };

  const useSuggestion = (text: string) => {
    setCurrentPage("chat"); setComposer(text);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const navigate = (page: Page) => {
    setCurrentPage(page); setShowProfilePopup(false);
    if (window.innerWidth < 860) setSidebarOpen(false);
  };

  const suggestionsCategorized = [
    { category: "Shopify", icon: Store, items: [
      { label: "Find profitable products", prompt: "Find profitable trending products for my Shopify store" },
      { label: "Analyze my store", prompt: "Analyze my Shopify store performance and conversion bottlenecks" },
      { label: "Improve product SEO", prompt: "Improve product title and SEO description for my top items" },
      { label: "Create a product campaign", prompt: "Draft a high-converting product launch campaign" },
    ]},
    { category: "Marketing", icon: Megaphone, items: [
      { label: "Create a social campaign", prompt: "Create a multi-channel social campaign for my products" },
      { label: "Generate product content", prompt: "Generate engaging social captions and product benefit bullet points" },
      { label: "Build an ad concept", prompt: "Design high-ROAS Facebook & Google ad concept scripts" },
    ]},
    { category: "Automation", icon: Zap, items: [
      { label: "Automate a recurring workflow", prompt: "Set up an automated daily store inventory sync workflow" },
      { label: "Connect a service", prompt: "Connect my store to Slack notifications and marketing tools" },
      { label: "Create a multi-step workflow", prompt: "Draft an automated post-purchase email follow-up sequence" },
    ]},
    { category: "Developer", icon: Code2, items: [
      { label: "Analyze a GitHub repo", prompt: "Analyze my GitHub repository structure and open pull requests" },
      { label: "Debug an application", prompt: "Debug my store theme liquid template and React frontend" },
      { label: "Deploy a project", prompt: "Verify build configuration and deploy my application to Vercel" },
    ]},
  ];

  const sidebarNav = [
    { icon: Plus, label: "New task", action: createChat, page: "chat" as Page },
    { icon: Sparkles, label: "Upgrade Plan", page: "upgrade" as Page },
    { icon: Layers3, label: "Collections", page: "collections" as Page },
    { icon: PlugZap, label: "Connectors", page: "connectors" as Page },
    { icon: Store, label: "Integrations", page: "integrations" as Page },
    { icon: Bell, label: "Notifications", page: "notifications" as Page },
    { icon: Settings, label: "Customize", page: "settings" as Page },
  ];

  const renderChatPage = () => (
    <>
      <header className="workspace-header">
        <div className="header-leading">
          <button className="icon-button" onClick={() => setSidebarOpen(c => !c)} aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>
          <div className="workspace-breadcrumb">
            <span className="breadcrumb-quiet">Hanna</span>
            <ChevronRight size={13} />
            <span>{activeChat.title}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="model-picker">
            <button className="model-button" onClick={() => setModelMenuOpen(c => !c)} aria-expanded={modelMenuOpen}>
              <span className="model-pulse" />
              {model}
              <ChevronDown size={13} />
            </button>
            {modelMenuOpen && (
              <div className="model-menu">
                {[
                  { id: "Hanna Lite", label: "Hanna Lite (Gemini 2.5 Flash)" },
                  { id: "Hanna Pro", label: "Hanna Pro (Gemini 2.5 Flash)" },
                  { id: "Custom", label: "Custom Provider Key" },
                ].map(option => (
                  <button key={option.id} className={`model-option ${model === option.id ? "is-selected" : ""}`}
                    onClick={() => { setModel(option.id); setModelMenuOpen(false); }}>
                    <span>{option.label}</span>
                    {model === option.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="workspace-body custom-scroll">
        <div className={`conversation-stage ${hasMessages ? "has-messages" : "is-empty"}`}>
          {!hasMessages ? (
            <div className="welcome-layout">
              <section className="welcome-copy">
                <div className="eyebrow">Clean Command Interface</div>
                <h1>What needs to be done?</h1>
                <p>Use Hanna to automate store growth, research, coding, and creative work — all powered by Gemini multimodal intelligence.</p>
                <div className="command-suggestions-matrix" style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
                  {suggestionsCategorized.map(cat => (
                    <div key={cat.category} style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--gemini-accent)", marginBottom: "10px" }}>
                        <cat.icon size={15} /><span>{cat.category}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
                        {cat.items.map(item => (
                          <button key={item.label} type="button" onClick={() => useSuggestion(item.prompt)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "var(--text-primary)", textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }}>
                            <span>{item.label}</span>
                            <ArrowUp size={13} style={{ color: "var(--text-tertiary)", marginLeft: "6px" }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <aside className="welcome-art">
                <div className="welcome-art-frame" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", padding: "20px", borderRadius: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <span className="hanna-brand-icon" style={{ width: "32px", height: "32px", display: "inline-flex", borderRadius: "8px" }}>
                      <img src="/hanna-icon-192.png" alt="Hanna" />
                    </span>
                    <div>
                      <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)" }}>Hanna Commerce Operator</strong>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Gemini-powered multimodal intelligence</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {[
                      { icon: BookOpen, label: "Multimodal analysis", desc: "Images, PDFs, documents, and visual content" },
                      { icon: ImageIcon, label: "Image generation", desc: "Create product visuals and marketing assets" },
                      { icon: Code2, label: "Code analysis & debug", desc: "Review, debug, and explain any codebase" },
                      { icon: Globe2, label: "Deep research", desc: "Web search, market analysis, and sourced briefs" },
                    ].map(f => (
                      <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                        <f.icon size={16} style={{ color: "var(--gemini-accent)", marginTop: "2px" }} />
                        <div>
                          <strong style={{ display: "block", fontSize: "12px", color: "var(--text-primary)" }}>{f.label}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{f.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="welcome-art-caption" style={{ marginTop: "14px" }}>
                    <span>H / 002</span><span>Connected & ready</span>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="message-stack">
              <div className="conversation-heading">
                <div>
                  <div className="eyebrow">Conversation</div>
                  <h1>{activeChat.title}</h1>
                </div>
                <div className="conversation-actions">
                  <span className="conversation-usage">
                    {activeChat.messages.length} messages · {activeChat.messages.reduce((t, m) => t + (m.tokenCount ?? estimateTokens(m.content)), 0)} est. tokens
                  </span>
                </div>
              </div>
              {activeChat.messages.map(message => (
                <article className={`message-row ${message.role}`} key={message.id}>
                  <div className="message-avatar">{message.role === "assistant" ? <HannaMark small /> : "U"}</div>
                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{message.role === "assistant" ? "Hanna" : "You"}</strong>
                      <span>{message.time}</span>
                    </div>
                    <div className="message-content">
                      {message.content.split("\n").map((p, i) => <p key={`${message.id}-${i}`}>{p}</p>)}
                    </div>
                    {message.role === "assistant" && (
                      <div className="message-actions">
                        <button onClick={() => showToast("Response copied")}><Archive size={13} /> Copy</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {isThinking && (
                <article className="message-row assistant thinking-row">
                  <div className="message-avatar"><HannaMark small /></div>
                  <div className="message-body">
                    <div className="message-meta"><strong>Hanna</strong><span>thinking</span></div>
                    <div className="thinking-dots"><i /><i /><i /></div>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="composer-region">
        <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} multiple accept="image/*,application/pdf,video/*" />
        <div className="composer-shell">
          <div className="composer-topline">
            <span className="composer-context">
              <span className="status-dot" /> {selectedTools.length ? `${selectedTools.length} tools ready` : attachments.length ? `${attachments.length} attachment(s) ready` : "Ask Hanna anything"}
            </span>
            <span className="composer-hint"><kbd>Enter</kbd> to send</span>
          </div>
          {attachments.length > 0 && (
            <div className="composer-attachments-preview">
              {attachments.map(file => (
                <div key={file.id} className="attachment-chip">
                  {file.type === "image" ? <ImageIcon size={13} /> : file.type === "pdf" ? <FileText size={13} /> : <Paperclip size={13} />}
                  <span>{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(file.id)} aria-label="Remove attachment"><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <textarea ref={composerRef} value={composer} onChange={e => setComposer(e.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Message Hanna..." rows={1} aria-label="Message Hanna" />
          <div className="composer-footer">
            <div className="composer-tools">
              <button className="attach-button" onClick={() => fileInputRef.current?.click()} aria-label="Attach files"><Paperclip size={16} /></button>
              {toolConfigs.map(tool => (
                <ToolChip key={tool.label} {...tool} active={selectedTools.includes(tool.label)}
                  onClick={() => tool.label === "Image Input" ? fileInputRef.current?.click() : toggleTool(tool.label)} />
              ))}
            </div>
            <Button className="send-button" onClick={submitMessage} disabled={(!composer.trim() && attachments.length === 0) || isThinking} aria-label="Send message">
              <Send size={16} />
            </Button>
          </div>
        </div>
        <div className="composer-disclaimer">Hanna can make mistakes. Check important information.</div>
      </div>
    </>
  );

  const renderPage = () => {
    const handleBack = () => navigate("chat");
    let content: React.ReactNode;
    switch (currentPage) {
      case "settings": content = <SettingsPage theme={theme} onThemeChange={handleThemeChange} onBack={handleBack} />; break;
      case "connectors": content = <ConnectorsPage onBack={handleBack} />; break;
      case "integrations": content = <IntegrationsPage onBack={handleBack} />; break;
      case "collections": content = <CollectionsPage onBack={handleBack} />; break;
      case "notifications": content = <NotificationsPage onBack={handleBack} />; break;
      case "profile": content = <ProfilePage onLogout={() => setShowLogoutDialog(true)} onNavigateToSettings={() => navigate("settings")} onNavigateToUpgrade={() => navigate("upgrade")} onNavigateToUsage={() => navigate("usage")} onBack={handleBack} />; break;
      case "upgrade": content = <UpgradePage onBack={handleBack} />; break;
      case "usage": content = <UsagePage onNavigateToUpgrade={() => navigate("upgrade")} onBack={handleBack} />; break;
      default: return renderChatPage();
    }
    return <div className="workspace-body custom-scroll">{content}</div>;
  };

  return (
    <div className="hanna-app">
      <div className={`sidebar-scrim ${sidebarOpen ? "is-visible" : ""}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <aside className={`hanna-sidebar ${sidebarOpen ? "is-open" : "is-collapsed"}`} aria-label="Navigation">
        <div className="sidebar-top">
          <div className="brand-lockup">
            <HannaMark />
            <div><div className="brand-name">Hanna</div><div className="brand-caption">Commerce operator</div></div>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={17} /></button>
        </div>
        <div className="sidebar-content custom-scroll">
          <div className="sidebar-nav-group">
            {sidebarNav.map(item => {
              const isActive = item.page === currentPage;
              return (
                <button key={item.label} className={`sidebar-link ${isActive ? "is-current" : ""}`}
                  onClick={() => item.action ? item.action() : navigate(item.page)}>
                  <item.icon size={16} /><span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button className="sidebar-link" onClick={() => showToast("Search is ready")} style={{ marginTop: "8px" }}>
            <Search size={16} /><span>Search chats</span>
          </button>
          <div className="history-label">Recent chats</div>
          <div className="history-list">
            {(["Today", "Yesterday", "Previous 7 days"] as const).map(period => {
              const group = chats.filter(c => c.period === period);
              if (!group.length) return null;
              return (
                <div className="history-group" key={period}>
                  <div className="history-period">{period}</div>
                  {group.map(chat => (
                    <ChatItem key={chat.id} chat={chat} active={chat.id === activeChatId && currentPage === "chat"} onClick={() => selectChat(chat.id)} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="profile-popup-wrapper" style={{ position: "relative" }}>
            <button className="account-row" onClick={() => setShowProfilePopup(c => !c)} style={{ cursor: "pointer", width: "100%" }}>
              <div className="avatar">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="avatar-img" /> : (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="account-copy">
                <span className="account-name">{user?.displayName || user?.email || "You"}</span>
                <span className="account-plan">Personal workspace</span>
              </div>
              <Bell size={16} style={{ color: "var(--text-tertiary)", marginLeft: "auto" }} />
            </button>
            {showProfilePopup && (
              <div className="profile-popup">
                <div className="profile-popup-user">
                  <div className="profile-popup-avatar">
                    {user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div><strong>{user?.displayName || "User"}</strong><span>{user?.email || ""}</span></div>
                </div>
                <div className="profile-popup-credits">
                  <div className="credits-row"><CreditCard size={16} /><span>Credits</span><span className="credits-amount">2.5k left</span></div>
                  <div className="credits-bar"><div className="credits-bar-fill" /></div>
                  <div className="credits-actions">
                    <Button variant="outline" size="sm" onClick={() => { navigate("usage"); setShowProfilePopup(false); }}>Usage</Button>
                    <Button size="sm" className="upgrade-btn" onClick={() => { navigate("upgrade"); setShowProfilePopup(false); }}>Upgrade</Button>
                  </div>
                </div>
                <div className="profile-popup-actions">
                  <button className="profile-popup-action" onClick={() => { navigate("profile"); setShowProfilePopup(false); }}>
                    <Gift size={16} /><span>Invite</span><span className="profile-popup-badge">Earn 20k credits</span>
                  </button>
                  <button className="profile-popup-action">
                    <TrendingUp size={16} /><span>Affiliate</span><span className="profile-popup-badge">100% commission</span>
                  </button>
                  <button className="profile-popup-action">
                    <HelpCircle size={16} /><span>Help</span><ChevronRight size={14} className="profile-popup-arrow" />
                  </button>
                  <button className="profile-popup-action" onClick={() => { navigate("settings"); setShowProfilePopup(false); }}>
                    <Settings size={16} /><span>Appearance</span><ChevronRight size={14} className="profile-popup-arrow" />
                  </button>
                  <button className="profile-popup-action" onClick={() => { navigate("settings"); setShowProfilePopup(false); }}>
                    <Settings size={16} /><span>Settings</span><ChevronRight size={14} className="profile-popup-arrow" />
                  </button>
                </div>
                <div className="profile-popup-divider" />
                <button className="profile-popup-action logout" onClick={() => { setShowProfilePopup(false); setShowLogoutDialog(true); }}>
                  <LogOut size={16} /><span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="main-workspace">{renderPage()}</main>
      {showLogoutDialog && (
        <div className="modal-overlay" onClick={() => setShowLogoutDialog(false)}>
          <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700" }}>Log out of Hanna?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>Are you sure? Your conversations and settings remain saved.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
              <Button onClick={async () => { setShowLogoutDialog(false); await onLogout?.(); }} style={{ background: "#ea4335", color: "#ffffff" }}>Log out</Button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
