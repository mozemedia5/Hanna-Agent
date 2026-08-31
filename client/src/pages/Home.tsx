/*
 * Hanna / Quiet Command Center
 * This page owns the product surface: asymmetric chat rail, restrained monochrome
 * surfaces, ink actions, honest tool affordances, and a contextual right panel.
 */
import { Button } from "@/components/ui/button";
import {
  Archive,
  ArrowUp,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  KeyRound,
  PlugZap,
  Server,
  ShieldCheck,
  Webhook,
  Code2,
  Copy,
  FileText,
  Globe2,
  ImageIcon,
  Layers3,
  Lightbulb,
  Menu,
  Mic,
  MoreHorizontal,
  Moon,
  Mail,
  Paperclip,
  PanelRight,
  Plus,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import type { User } from "firebase/auth";
import { calculateConversationAnalytics, getUserProfile, listUserConversations, saveUserConversation, saveUserProfile, type ClientConversation } from "@/lib/firestore";
import { renderBrandIcon } from "@/components/ProviderIcons";

type ToolKey =
  | "Web Search"
  | "Image Input"
  | "Voice"
  | "Study"
  | "Deep Research"
  | "Image Gen";

type Panel = "artifacts" | "settings" | "analytics" | null;
type SettingsSection = "overview" | "api-keys" | "connectors" | "mcps" | "workspace" | "profile";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  tokenCount?: number;
};
const estimateTokens = (content: string) => Math.max(1, Math.ceil(content.length / 4));

type Chat = {
  id: number;
  title: string;
  period: string;
  messages: Message[];
};

const toolConfigs: Array<{ label: ToolKey; icon: typeof Globe2; hint: string }> = [
  { label: "Web Search", icon: Globe2, hint: "Search the web" },
  { label: "Image Input", icon: ImageIcon, hint: "Add an image" },
  { label: "Voice", icon: Mic, hint: "Talk to Hanna" },
  { label: "Study", icon: BookOpen, hint: "Learn step by step" },
  { label: "Deep Research", icon: Search, hint: "Build a sourced brief" },
  { label: "Image Gen", icon: Sparkles, hint: "Create a visual" },
];

const seedChats: Chat[] = [{ id: 0, title: "New conversation", period: "Today", messages: [] }];

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

function ToolChip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: ToolKey;
  icon: typeof Globe2;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`tool-chip ${active ? "is-active" : ""}`} onClick={onClick} aria-pressed={active}>
      <Icon size={14} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

export default function Home({ user, onLogout }: { user?: User | null; onLogout?: () => Promise<void> }) {
  const [chats, setChats] = useState<Chat[]>(seedChats);
  const [activeChatId, setActiveChatId] = useState(0);
  const [composer, setComposer] = useState("");
  const [selectedTools, setSelectedTools] = useState<ToolKey[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [model, setModel] = useState("Hanna Lite");
  const [customModel, setCustomModel] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState("");
  const [connectedApps, setConnectedApps] = useState<string[]>(["Google Drive"]);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [_storedConversations, setStoredConversations] = useState<ClientConversation[]>([]);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) ?? chats[0], [activeChatId, chats]);
  const hasMessages = activeChat.messages.length > 0;
  useEffect(() => {
    void listUserConversations().then((stored) => {
      setStoredConversations(stored);
      if (!stored.length) return;
      const formatted = stored.map((chat) => ({ ...chat, id: Number(chat.id) || Date.now() + Math.random() }));
      setChats(formatted);
      setActiveChatId(formatted[0].id);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("hanna-theme") as "light" | "dark" | null;
    const nextTheme = savedTheme ?? "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.classList.toggle("light", nextTheme === "light");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => setToast(message);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.classList.toggle("light", nextTheme === "light");
    window.localStorage.setItem("hanna-theme", nextTheme);
  };

  const createChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "Untitled conversation",
      period: "Today",
      messages: [],
    };
    setChats((current) => [newChat, ...current]);
    setActiveChatId(newChat.id);
    setPanel(null);
    setComposer("");
    showToast("New conversation ready");
    if (window.innerWidth < 860) setSidebarOpen(false);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const selectChat = (id: number) => {
    setActiveChatId(id);
    setPanel(null);
    if (window.innerWidth < 860) setSidebarOpen(false);
  };

  const submitMessage = async () => {
    const text = composer.trim();
    if (!text || isThinking) return;
    const chatId = activeChatId;
    const userMessage: Message = { id: `${chatId}-${Date.now()}`, role: "user", content: text, tokenCount: estimateTokens(text), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const currentChat = chats.find((chat) => chat.id === chatId) ?? activeChat;
    const chatWithUser = { ...currentChat, title: currentChat.messages.length === 0 ? text.slice(0, 32) : currentChat.title, messages: [...currentChat.messages, userMessage] };
    setChats((current) => current.map((chat) => chat.id === chatId ? chatWithUser : chat));
    void saveUserConversation({ ...chatWithUser, id: String(chatWithUser.id) }).catch(() => undefined);
    setComposer(""); setIsThinking(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch("/api/trpc/hanna.ask?batch=1", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 0: { json: { prompt: text, model: model === "Custom" ? customModel.trim() : model } } })
      });

      const responseText = await response.text();
      let payload: Array<{ result?: { data?: { json?: { answer?: string; text?: string }; answer?: string; text?: string } }; error?: { json?: { message?: string }; message?: string } }> | null = null;
      try {
        payload = JSON.parse(responseText);
      } catch {
        throw new Error("Hanna is warming up or encountered a response issue. Please try again.");
      }

      if (Array.isArray(payload) && payload[0]?.error) {
        const errObj = payload[0].error;
        const msg = errObj?.json?.message || errObj?.message || "Hanna encountered an issue handling this request.";
        throw new Error(msg);
      }

      if (!response.ok || !payload) {
        throw new Error("Hanna is warming up or encountered a server response issue. Please try again.");
      }

      const data = payload[0]?.result?.data;
      const reply = data && "json" in data ? (data.json?.answer || data.json?.text) : data?.answer || data?.text;
      if (!reply) throw new Error("Hanna returned an empty response.");
      const assistantMessage = { id: `${chatId}-assistant-${Date.now()}`, role: "assistant" as const, content: reply, tokenCount: estimateTokens(reply), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const completedChat = { ...chatWithUser, messages: [...chatWithUser.messages, assistantMessage] };
      setChats((current) => current.map((chat) => chat.id === chatId ? completedChat : chat));
      void saveUserConversation({ ...completedChat, id: String(completedChat.id) }).catch(() => undefined);
    } catch (reason) {
      let errorContent = reason instanceof Error ? reason.message : "Hanna is unavailable right now. Please try again.";
      if (errorContent.includes("Unexpected token") || errorContent.includes("is not valid JSON")) {
        errorContent = "Hanna encountered a temporary server response issue. Please check your settings and try again.";
      }
      const errorMessage = { id: `${chatId}-error-${Date.now()}`, role: "assistant" as const, content: errorContent, tokenCount: estimateTokens(errorContent), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const failedChat = { ...chatWithUser, messages: [...chatWithUser.messages, errorMessage] };
      setChats((current) => current.map((chat) => chat.id === chatId ? failedChat : chat));
      void saveUserConversation({ ...failedChat, id: String(failedChat.id) }).catch(() => undefined);
    } finally { setIsThinking(false); }
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const useSuggestion = (text: string) => {
    setComposer(text);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const toggleTool = (tool: ToolKey) => {
    setSelectedTools((current) => (current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]));
  };

  const togglePanel = (nextPanel: Exclude<Panel, null>) => {
    setPanel((current) => (current === nextPanel ? null : nextPanel));
    if (window.innerWidth < 860) setSidebarOpen(false);
  };

  const openProfile = () => {
    setPanel("settings");
    setSettingsSection("profile");
    if (window.innerWidth < 860) setSidebarOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modelMenuOpen && !target.closest(".model-picker")) {
        setModelMenuOpen(false);
      }
    };
    const handleOpenProfile = () => openProfile();
    window.addEventListener("hanna:open-profile", handleOpenProfile);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("hanna:open-profile", handleOpenProfile);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modelMenuOpen]);

  const copyArtifact = async () => {
    await navigator.clipboard?.writeText(artifactCode);
    showToast("Artifact copied to clipboard");
  };

  const toggleApp = (name: string) => {
    setConnectedApps((current) => (current.includes(name) ? current.filter((app) => app !== name) : [...current, name]));
    showToast(connectedApps.includes(name) ? `${name} disconnected` : `${name} connected`);
  };

  return (
    <div className="hanna-app">
      <div className={`sidebar-scrim ${sidebarOpen ? "is-visible" : ""}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <aside className={`hanna-sidebar ${sidebarOpen ? "is-open" : "is-collapsed"}`} aria-label="Chat history">
        <div className="sidebar-top">
          <div className="brand-lockup">
            <HannaMark />
            <div>
              <div className="brand-name">Hanna</div>
              <div className="brand-caption">AI workspace</div>
            </div>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={17} />
          </button>
        </div>

        <div className="sidebar-content custom-scroll">
          <Button className="new-chat-button" onClick={createChat}>
            <Plus size={16} />
            <span>New chat</span>
            <kbd>⌘ K</kbd>
          </Button>

          <div className="sidebar-section quick-links">
            <button className="sidebar-link is-current" onClick={() => { setPanel(null); if (window.innerWidth < 860) setSidebarOpen(false); }}>
              <Layers3 size={16} />
              <span>All conversations</span>
              <span className="sidebar-count">{chats.length}</span>
            </button>
            <button className="sidebar-link" onClick={() => togglePanel("analytics")}>
              <BarChart3 size={16} />
              <span>Activity & usage</span>
            </button>
            <button className="sidebar-link" onClick={() => showToast("Search is ready for your conversations") }>
              <Search size={16} />
              <span>Search chats</span>
            </button>
          </div>

          <div className="history-label">Recent chats</div>
          <div className="history-list">
            {(["Today", "Yesterday", "Previous 7 days"] as const).map((period) => {
              const group = chats.filter((chat) => chat.period === period);
              if (!group.length) return null;
              return (
                <div className="history-group" key={period}>
                  <div className="history-period">{period}</div>
                  {group.map((chat) => (
                    <ChatItem key={chat.id} chat={chat} active={chat.id === activeChatId} onClick={() => selectChat(chat.id)} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={() => togglePanel("settings")}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button className="sidebar-link" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === "light" ? "Dark theme" : "Light theme"}</span>
          </button>
          <div className="account-row" onClick={openProfile} style={{ cursor: "pointer" }} title="Click to edit profile">
            <div className="avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="" className="avatar-img" /> : (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="account-copy">
              <span className="account-name">{user?.displayName || user?.email || "You"}</span>
              <span className="account-plan">Click to edit profile</span>
            </div>
            <button className="icon-button" onClick={(e) => { e.stopPropagation(); onLogout?.(); }} aria-label="Sign out"><MoreHorizontal size={16} className="muted-icon" /></button>
          </div>
        </div>
      </aside>

      <main className="main-workspace">
        <header className="workspace-header">
          <div className="header-leading">
            <button className="icon-button" onClick={() => setSidebarOpen((current) => !current)} aria-label="Toggle sidebar">
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
              <button className="model-button" onClick={() => setModelMenuOpen((current) => !current)} aria-expanded={modelMenuOpen}>
                <span className="model-pulse" />
                {model === "Custom" && customModel ? customModel : model}
                <ChevronDown size={13} />
              </button>
              {modelMenuOpen && (
                <div className="model-menu">
                  {["Hanna Lite", "Hanna Pro", "Custom"].map((option) => (
                    <button
                      key={option}
                      className={`model-option ${model === option ? "is-selected" : ""}`}
                      onClick={() => {
                        setModel(option);
                        setModelMenuOpen(false);
                      }}
                    >
                      <span>{option}{option === "Hanna Pro" && <small className="model-plan-label">Paid plan</small>}</span>
                      {model === option && <Check size={14} />}
                    </button>
                  ))}
                  {model === "Custom" && <div className="custom-model-field"><input value={customModel} onChange={(event) => setCustomModel(event.target.value)} placeholder="gemini-3.7-flash" aria-label="Custom model name" /></div>}
                </div>
              )}
            </div>
            <button className="header-settings-button" onClick={() => togglePanel("settings")} aria-label="Open settings">
              <Settings size={16} />
            </button>
            <button className="header-avatar-button" onClick={openProfile} aria-label="Edit profile" title="Edit profile">
              <div className="header-avatar">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="avatar-img" /> : (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        <div className="workspace-body custom-scroll">
          <div className={`conversation-stage ${hasMessages ? "has-messages" : "is-empty"}`}>
            {!hasMessages ? (
              <div className="welcome-layout">
                <section className="welcome-copy">
                  <div className="eyebrow"><span className="eyebrow-line" /> A clear place to begin</div>
                  <h1>What are we<br /><em>working through?</em></h1>
                  <p>Bring a question, a rough idea, or a piece of work. Hanna helps you make the next move with less noise.</p>
                  <div className="suggestion-grid">
                    {[
                      { icon: Lightbulb, text: "Shape a product idea into a clear brief" },
                      { icon: Code2, text: "Debug a small piece of Python" },
                      { icon: FileText, text: "Turn notes into an action plan" },
                      { icon: ImageIcon, text: "Create a visual direction for a launch" },
                    ].map(({ icon: Icon, text }) => (
                      <button key={text} className="suggestion-card" onClick={() => useSuggestion(text)}>
                        <Icon size={17} strokeWidth={1.7} />
                        <span>{text}</span>
                        <ArrowUp size={14} className="suggestion-arrow" />
                      </button>
                    ))}
                  </div>
                </section>
                <aside className="welcome-art" aria-label="Hanna visual study">
                  <div className="welcome-art-frame">
                    <img src="/manus-storage/hanna-ink-field_8c79b00b.png" alt="Abstract graphite curve on a paper field" />
                    <div className="welcome-art-caption"><span>H / 001</span><span>Quietly in motion</span></div>
                  </div>
                  <div className="welcome-note"><span className="note-marker" /> Designed for considered work.</div>
                </aside>
              </div>
            ) : (
              <div className="message-stack">
                <div className="conversation-heading">
                  <div>
                    <div className="eyebrow"><span className="eyebrow-line" /> Conversation</div>
                    <h1>{activeChat.title}</h1>
                  </div>
                  <div className="conversation-actions"><span className="conversation-usage">{activeChat.messages.length} messages · {activeChat.messages.reduce((total, message) => total + (message.tokenCount ?? estimateTokens(message.content)), 0)} est. tokens</span><button className="subtle-action" onClick={() => togglePanel("analytics")}><BarChart3 size={15} />Usage</button><button className="subtle-action" onClick={() => togglePanel("artifacts")}><PanelRight size={15} />Artifacts</button></div>
                </div>
                {activeChat.messages.map((message) => (
                  <article className={`message-row ${message.role}`} key={message.id}>
                    <div className="message-avatar">{message.role === "assistant" ? <HannaMark small /> : "U"}</div>
                    <div className="message-body">
                      <div className="message-meta"><strong>{message.role === "assistant" ? "Hanna" : "You"}</strong><span>{message.time}</span></div>
                      <div className="message-content">{message.content.split("\n").map((paragraph, index) => <p key={`${message.id}-${index}`}>{paragraph}</p>)}</div>
                      {message.role === "assistant" && (
                        <div className="message-actions">
                          <button onClick={() => showToast("Response copied") }><Copy size={13} /> Copy</button>
                          <button onClick={() => showToast("Response saved to your workspace") }><Archive size={13} /> Save</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {isThinking && (
                  <article className="message-row assistant thinking-row">
                    <div className="message-avatar"><HannaMark small /></div>
                    <div className="message-body"><div className="message-meta"><strong>Hanna</strong><span>thinking</span></div><div className="thinking-dots"><i /><i /><i /></div></div>
                  </article>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="composer-region">
          <div className="composer-shell">
            <div className="composer-topline">
              <span className="composer-context"><span className="status-dot" /> {selectedTools.length ? `${selectedTools.length} tools ready` : "Ask Hanna anything"}</span>
              <span className="composer-hint"><kbd>Enter</kbd> to send <span className="hint-divider" /> <kbd>Shift</kbd> <span className="hint-plus">+</span> <kbd>Enter</kbd> for a new line</span>
            </div>
            <textarea
              ref={composerRef}
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message Hanna..."
              rows={1}
              aria-label="Message Hanna"
            />
            <div className="composer-footer">
              <div className="composer-tools">
                <button className="attach-button" onClick={() => showToast("File attachments are ready for connection")} aria-label="Attach a file"><Paperclip size={16} /></button>
                {toolConfigs.map((tool) => <ToolChip key={tool.label} {...tool} active={selectedTools.includes(tool.label)} onClick={() => toggleTool(tool.label)} />)}
              </div>
              <Button className="send-button" onClick={submitMessage} disabled={!composer.trim() || isThinking} aria-label="Send message">
                <Send size={16} />
              </Button>
            </div>
          </div>
          <div className="composer-disclaimer">Hanna can make mistakes. Check important information.</div>
        </div>
      </main>

      {!panel && (
        <aside className="context-dock" aria-label="Workspace context">
          <div className="dock-topline"><span className="eyebrow"><span className="eyebrow-line" /> Context</span><button className="icon-button" onClick={() => togglePanel("settings")} aria-label="Open workspace settings"><Settings size={16} /></button></div>
          <div className="dock-identity"><HannaMark /><div><span className="dock-code">HANNA / 02</span><strong>Keep the signal.</strong></div></div>
          <div className="dock-rule" />
          <div className="dock-section-label">Working set</div>
          <div className="dock-visual"><img src="/manus-storage/hanna-research-study_3af4f707.png" alt="Layered paper study with measurement marks" /><span>01 / live surface</span></div>
          <div className="dock-card"><div className="dock-card-heading"><span>Tools in reach</span><span className="dock-card-count">{selectedTools.length.toString().padStart(2, "0")}</span></div><div className="dock-tool-list">{toolConfigs.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} className={selectedTools.includes(label) ? "is-on" : ""} onClick={() => toggleTool(label)}><Icon size={13} /><span>{label}</span><span className="dock-tool-state" /></button>)}</div></div>
          <button className="dock-artifact-link" onClick={() => togglePanel("artifacts")}><span><PanelRight size={14} /> Open artifact space</span><ArrowUp size={14} /></button>
          <div className="dock-footer"><span className="status-dot" /> All systems quiet <span className="dock-footer-code">local</span></div>
        </aside>
      )}

      {panel && (
        <aside className="context-panel" aria-label={panel === "artifacts" ? "Artifacts" : "Settings"}>
          <div className="context-header">
            <div className="context-title"><span className="context-kicker">Workspace</span><h2>{panel === "artifacts" ? "Artifacts" : panel === "analytics" ? "Activity" : "Settings"}</h2></div>
            <button className="icon-button" onClick={() => setPanel(null)} aria-label="Close panel"><X size={17} /></button>
          </div>
          {panel === "artifacts" ? <ArtifactsPanel onCopy={copyArtifact} /> : panel === "analytics" ? <AnalyticsPanel /> : <SettingsHub activeSection={settingsSection} onSectionChange={setSettingsSection} theme={theme} onThemeToggle={toggleTheme} connectedApps={connectedApps} onToggleApp={toggleApp} onToast={showToast} />}
        </aside>
      )}

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

const artifactCode = `import React from "react";

export default function FocusCard() {
  return (
    <section className="focus-card">
      <span className="eyebrow">Today / 01</span>
      <h1>Make room for the next good idea.</h1>
      <p>A quiet place to turn questions into considered work.</p>
      <button>Open workspace</button>
    </section>
  );
}`;

function ArtifactsPanel({ onCopy }: { onCopy: () => void }) {
  return (
    <div className="context-scroll custom-scroll">
      <div className="artifact-file-row"><div className="file-kind"><Code2 size={15} /> JSX</div><span>focus-card.jsx</span><button onClick={onCopy} aria-label="Copy artifact"><Copy size={15} /></button></div>
      <div className="artifact-preview">
        <div className="artifact-preview-media"><img src="/manus-storage/hanna-artifact-grid_d66bb62d.png" alt="Abstract technical grid" /><span className="preview-tag">Preview</span></div>
        <div className="preview-copy"><span className="eyebrow"><span className="eyebrow-line" /> UI direction</span><h3>Focused work, less ceremony.</h3><p>A compact artifact preview lives beside your conversation so ideas can become something you can keep.</p><button onClick={() => window.alert("Preview opened")}>Open preview <ArrowUp size={14} /></button></div>
      </div>
      <div className="code-card"><div className="code-card-heading"><span>Generated code</span><span className="code-language">React / JSX</span></div><pre><code>{artifactCode}</code></pre></div>
      <div className="artifact-actions"><Button variant="outline" onClick={onCopy}><Copy size={15} /> Copy code</Button><Button onClick={() => window.alert("Download prepared")}>Download</Button></div>
    </div>
  );
}

function AnalyticsPanel() {
  const [data, setData] = useState<ReturnType<typeof calculateConversationAnalytics> | null>(null);
  useEffect(() => { void listUserConversations().then((conversations) => setData(calculateConversationAnalytics(conversations))).catch(() => setData(calculateConversationAnalytics([]))); }, []);
  const maxTokens = Math.max(1, ...(data?.daily.map((day) => day.tokens) ?? [1]));
  const formatNumber = (value: number) => new Intl.NumberFormat().format(value);
  return <div className="context-scroll custom-scroll analytics-panel">
    <div className="analytics-intro"><span className="eyebrow"><span className="eyebrow-line" /> Last 14 days</span><p>Your Hanna workspace at a glance. Token counts are estimated from saved message content.</p></div>
    <div className="analytics-stat-grid">
      <div className="analytics-stat"><span>Conversations</span><strong>{formatNumber(data?.totalConversations ?? 0)}</strong></div>
      <div className="analytics-stat"><span>Messages</span><strong>{formatNumber(data?.totalMessages ?? 0)}</strong></div>
      <div className="analytics-stat"><span>Est. tokens</span><strong>{formatNumber(data?.estimatedTokens ?? 0)}</strong></div>
      <div className="analytics-stat"><span>Active days</span><strong>{formatNumber(data?.activeDays ?? 0)}</strong></div>
    </div>
    <section className="analytics-section"><div className="analytics-section-heading"><h3>Daily activity</h3><span>{formatNumber(data?.userMessages ?? 0)} prompts</span></div><div className="analytics-chart" aria-label="Daily message and token activity">{(data?.daily ?? []).map((day) => <div className="analytics-bar-column" key={day.date} title={`${day.date}: ${day.messages} messages, ${day.tokens} tokens`}><div className="analytics-bar" style={{ height: `${Math.max(day.tokens ? 8 : 2, (day.tokens / maxTokens) * 100)}%` }} /><span>{day.date.slice(5)}</span></div>)}</div></section>
    <section className="analytics-section"><div className="analytics-section-heading"><h3>Most active conversations</h3><span>{formatNumber(data?.assistantMessages ?? 0)} replies</span></div>{data?.topConversations?.length ? <div className="analytics-conversation-list">{data.topConversations.map((conversation) => <div className="analytics-conversation" key={conversation.id}><div><strong>{conversation.title}</strong><span>{conversation.messages} messages</span></div><b>{formatNumber(conversation.tokens)} tokens</b></div>)}</div> : <div className="analytics-empty">Start a conversation to see usage insights here.</div>}</section>
    <p className="analytics-note">Usage is based on the content currently saved in Firestore. It is intended for workspace planning, not billing reconciliation.</p>
  </div>;
}

function SettingsHub({
  activeSection,
  onSectionChange,
  theme,
  onThemeToggle,
  connectedApps,
  onToggleApp,
  onToast,
}: {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  connectedApps: string[];
  onToggleApp: (name: string) => void;
  onToast: (message: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const apps = [
    { name: "Shopify", description: "Manage products, catalog, and orders" },
    { name: "Google Gemini", description: "Gemini models for multimodal AI and reasoning" },
    { name: "Google Workspace", description: "Docs, Sheets, Drive, and Calendar" },
    { name: "Gmail", description: "Read, send, and manage email messages" },
    { name: "Slack", description: "Team notifications and channel messages" },
    { name: "WhatsApp Business", description: "Automated order updates and broadcasts" },
    { name: "HeyGen", description: "AI avatar video generation and translation" },
    { name: "InVideo", description: "AI script-to-video editing and rendering" },
    { name: "Creatify", description: "AI marketing video and visual generator" },
    { name: "Zendrop", description: "US dropshipping fulfillment and branding" },
    { name: "AutoDS", description: "Dropshipping product imports and price updates" },
    { name: "CJ Dropshipping", description: "Product sourcing and order fulfillment" },
    { name: "OpenAI", description: "GPT-4o, DALL-E, and Whisper API access" },
    { name: "Anthropic / Claude", description: "Claude Sonnet, Opus, and Haiku models" },
    { name: "Jules AI", description: "Autonomous AI software engineering agent" },
    { name: "Stitch AI", description: "AI UI/UX design generation and component stitching" },
    { name: "GitHub", description: "Repositories, issues, and pull requests" },
    { name: "v0 by Vercel", description: "Generative UI system for React & Tailwind" },
    { name: "Vercel", description: "Deploy and manage frontend applications" },
    { name: "Google Trends", description: "Keyword research, market analysis, and trends" },
    { name: "Instagram", description: "Publish posts, reels, and view insights" },
    { name: "Meta Ads Manager", description: "Facebook and Instagram ad campaigns" },
    { name: "Google Ads", description: "Search and Display ad campaign management" },
    { name: "TikTok", description: "Short-form video publishing and analytics" },
    { name: "YouTube", description: "Upload videos and manage channel content" },
    { name: "Pinterest", description: "Publish visual pins and manage boards" },
  ];

  const credentials = [
    { name: "OpenAI", model: "GPT-4o / o-series", status: "Not connected" },
    { name: "Anthropic / Claude", model: "Claude family", status: "Not connected" },
    { name: "Google Gemini", model: "Gemini family", status: "Not connected" },
    { name: "Groq / Llama", model: "Llama 3.3 70B", status: "Not connected" },
    { name: "Custom provider", model: "OpenAI-compatible endpoint", status: "Extensible" },
  ];

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter((app) => app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q));
  }, [apps, searchQuery]);

  const filteredCredentials = useMemo(() => {
    if (!searchQuery.trim()) return credentials;
    const q = searchQuery.toLowerCase();
    return credentials.filter((cred) => cred.name.toLowerCase().includes(q) || cred.model.toLowerCase().includes(q));
  }, [credentials, searchQuery]);

  const settingsNav: Array<{ id: SettingsSection; label: string; icon: typeof SlidersHorizontal }> = [
    { id: "overview", label: "Overview", icon: SlidersHorizontal },
    { id: "api-keys", label: "API keys", icon: KeyRound },
    { id: "connectors", label: "Connectors", icon: PlugZap },
    { id: "mcps", label: "MCP servers", icon: Server },
    { id: "workspace", label: "Workspace", icon: ShieldCheck },
    { id: "profile", label: "Profile", icon: CircleHelp },
  ];
  const [profile, setProfile] = useState({ displayName: "", photoURL: "", bio: "", jobTitle: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  useEffect(() => { void getUserProfile().then(setProfile).catch(() => undefined); }, []);
  const updateProfileField = (field: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [field]: value }));
  const saveProfile = () => { setProfileSaving(true); void saveUserProfile(profile).then(() => onToast("Profile saved to your workspace")).finally(() => setProfileSaving(false)); };

  return (
    <div className="context-scroll custom-scroll settings-scroll">
      <div className="settings-search-bar">
        <Search size={14} className="settings-search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search connectors, API keys, MCPs..."
          aria-label="Search settings"
        />
        {searchQuery && (
          <button className="settings-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="settings-nav" role="tablist" aria-label="Settings sections">
        {settingsNav.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeSection === id ? "is-active" : ""} onClick={() => onSectionChange(id)} role="tab" aria-selected={activeSection === id}>
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {(activeSection === "overview" || activeSection === "workspace") && !searchQuery && (
        <section className="settings-section settings-overview-card">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> Control center</span><h3>Everything in one place</h3></div>
            <Webhook size={17} />
          </div>
          <p className="settings-intro">Manage how Hanna connects to your models, apps, and tools. Secrets stay masked in the interface and are handled by your connected runtime.</p>
          <div className="settings-category-list">
            {[
              { id: "api-keys" as const, icon: KeyRound, label: "Provider API keys", detail: "OpenAI, Anthropic, Gemini, Groq, custom" },
              { id: "connectors" as const, icon: PlugZap, label: "Apps & connectors", detail: "Google Drive, Slack, Shopify, GitHub" },
              { id: "mcps" as const, icon: Server, label: "MCP servers", detail: "Tools, endpoints, and permission scopes" }
            ].map(({ id, icon: Icon, label, detail }) => (
              <button key={id} className="settings-category" onClick={() => onSectionChange(id)}>
                <span className="settings-category-icon"><Icon size={15} /></span>
                <span><strong>{label}</strong><small>{detail}</small></span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {activeSection === "profile" && !searchQuery && (
        <section className="settings-section profile-settings-section">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> Your profile</span><h3>Make Hanna feel like yours</h3></div>
            <CircleHelp size={17} />
          </div>
          <p className="settings-intro">This profile is private to your workspace and helps Hanna understand how to speak to you.</p>
          <div className="profile-form">
            <label>Display name<input value={profile.displayName} onChange={(event) => updateProfileField("displayName", event.target.value)} placeholder="Your name" /></label>
            <label>Job title<input value={profile.jobTitle} onChange={(event) => updateProfileField("jobTitle", event.target.value)} placeholder="What do you do?" /></label>
            <label>Avatar URL<input value={profile.photoURL} onChange={(event) => updateProfileField("photoURL", event.target.value)} placeholder="https://…" type="url" /></label>
            <label>About you<textarea value={profile.bio} onChange={(event) => updateProfileField("bio", event.target.value)} placeholder="A little context Hanna should keep in mind" maxLength={500} rows={4} /></label>
            <button className="profile-save-button" onClick={saveProfile} disabled={profileSaving || !profile.displayName.trim()}>{profileSaving ? "Saving…" : "Save profile"}</button>
          </div>
        </section>
      )}

      {(activeSection === "overview" || activeSection === "api-keys" || searchQuery) && (
        <section className="settings-section">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> Provider access</span><h3>API keys</h3></div>
            <KeyRound size={17} />
          </div>
          <p className="settings-intro">Use your own provider keys for model routing. Hanna only shows connection status here; raw credentials never appear in the UI.</p>
          <div className="credential-list">
            {filteredCredentials.map(({ name, model, status }) => (
              <div className="credential-row" key={name}>
                <div className="credential-icon">{renderBrandIcon(name, 18)}</div>
                <div className="integration-copy"><strong>{name}</strong><span>{model} · {status}</span></div>
                <button className="integration-toggle" onClick={() => onToast(`${name} API key setup is available in the secure Settings flow`)}>Add key</button>
              </div>
            ))}
            {filteredCredentials.length === 0 && <div className="analytics-empty">No API keys matching "{searchQuery}"</div>}
          </div>
        </section>
      )}

      {(activeSection === "overview" || activeSection === "workspace") && !searchQuery && (
        <section className="settings-section">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> Appearance</span><h3>Make it yours</h3></div>
            <SlidersHorizontal size={17} />
          </div>
          <div className="theme-setting">
            <div><strong>Theme</strong><span>{theme === "light" ? "Paper white and graphite" : "Charcoal and soft white"}</span></div>
            <button className="theme-switch" onClick={onThemeToggle} aria-label="Toggle theme"><span className={theme === "dark" ? "is-dark" : ""} /></button>
          </div>
          <div className="theme-options">
            <button className={theme === "light" ? "is-selected" : ""} onClick={() => theme === "dark" && onThemeToggle()}><Sun size={15} /> Light</button>
            <button className={theme === "dark" ? "is-selected" : ""} onClick={() => theme === "light" && onThemeToggle()}><Moon size={15} /> Dark</button>
          </div>
        </section>
      )}

      {(activeSection === "overview" || activeSection === "connectors" || searchQuery) && (
        <section className="settings-section">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> Apps & integrations</span><h3>Bring your work with you</h3></div>
            <PanelRight size={17} />
          </div>
          <p className="settings-intro">Connect the places where your work already lives. Hanna will keep each connection visible and under your control.</p>
          <div className="integration-list">
            {filteredApps.map(({ name, description }) => {
              const isConnected = connectedApps.includes(name);
              return (
                <div className="integration-row" key={name}>
                  <div className="integration-icon">{renderBrandIcon(name, 18)}</div>
                  <div className="integration-copy"><strong>{name}</strong><span>{description}</span></div>
                  <button className={`integration-toggle ${isConnected ? "is-connected" : ""}`} onClick={() => onToggleApp(name)}>
                    {isConnected ? <><Check size={13} /> Ready</> : "Connect"}
                  </button>
                </div>
              );
            })}
            {filteredApps.length === 0 && <div className="analytics-empty">No connectors matching "{searchQuery}"</div>}
          </div>
        </section>
      )}

      {(activeSection === "overview" || activeSection === "mcps" || searchQuery) && (
        <section className="settings-section">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> Tool protocol</span><h3>MCP servers</h3></div>
            <Server size={17} />
          </div>
          <p className="settings-intro">Connect Model Context Protocol servers to give Hanna scoped tools. Each server remains visible with its endpoint and permission state.</p>
          <div className="mcp-card">
            <div className="mcp-card-top">
              <div className="integration-icon"><Server size={15} /></div>
              <div className="integration-copy"><strong>Custom MCP server</strong><span>Discover tools from a trusted endpoint</span></div>
              <span className="mcp-status">Ready to connect</span>
            </div>
            <div className="mcp-endpoint">
              <Webhook size={13} />
              <span>https://your-server.example/mcp</span>
              <button onClick={() => onToast("MCP endpoint setup is available in Settings")}>Configure</button>
            </div>
          </div>
        </section>
      )}

      {(activeSection === "overview" || activeSection === "workspace") && !searchQuery && (
        <section className="settings-section compact-section">
          <div className="settings-section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> What's new</span><h3>Hanna, in focus</h3></div>
            <CircleHelp size={17} />
          </div>
          <div className="release-note">
            <div className="release-number">02</div>
            <div>
              <strong>Artifacts live beside the conversation.</strong>
              <p>Keep a generated direction, code snippet, or research surface close without leaving the thread.</p>
              <button onClick={() => onToast("You are already looking at the latest Hanna workspace")}>Read release notes <ChevronRight size={14} /></button>
            </div>
          </div>
        </section>
      )}

      <div className="settings-footer">Hanna <span>•</span> Personal workspace <span>•</span> v0.2</div>
    </div>
  );
}

/**
 * Compatibility API retained for the repository’s existing composer tests and
 * any frontend callers that still import the old error helpers.
 */
export function getProviderKeyError(
  _model: { id: number },
  settings: { defaultProvider?: string },
  connectedProviders: Array<{ provider?: string }>,
): string | null {
  const provider = settings.defaultProvider;
  if (!provider || provider === "automatic") return null;
  const hasProvider = connectedProviders.some((item) => item.provider === provider);
  return hasProvider ? null : `Connect your ${provider} API key in Settings to send this request.`;
}

export function getProviderFailureError(message: string): string | null {
  return message.includes("connected provider") && message.includes("Check its API key in Settings") ? message : null;
}

export function Composer({
  prompt,
  setPrompt,
  submit,
  isWorking,
  composerError,
  clearComposerError,
  setActive,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  submit: () => void;
  isWorking: boolean;
  composerError?: string | null;
  clearComposerError: () => void;
  setActive: (value: string) => void;
}) {
  return (
    <div className="composer-shell" data-compatibility-composer="true">
      {composerError && <div role="alert" className="composer-error">{composerError}</div>}
      <textarea
        aria-label="Message Hanna"
        value={prompt}
        onChange={(event) => {
          clearComposerError();
          setPrompt(event.target.value);
        }}
      />
      <div className="composer-footer">
        <button type="button" onClick={() => setActive("Settings")}>Settings</button>
        <button type="button" aria-label="Send" disabled={isWorking || !prompt.trim() || Boolean(composerError)} onClick={submit}><Send size={16} /></button>
      </div>
    </div>
  );
}
