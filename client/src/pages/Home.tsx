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

type ToolKey =
  | "Web Search"
  | "Image Input"
  | "Voice"
  | "Study"
  | "Deep Research"
  | "Image Gen";

type Panel = "artifacts" | "settings" | null;
type SettingsSection = "overview" | "api-keys" | "connectors" | "mcps" | "workspace";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
};

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

const seedChats: Chat[] = [
  {
    id: 0,
    title: "Website redesign ideas",
    period: "Today",
    messages: [
      {
        id: "0-1",
        role: "user",
        content: "I want a calmer AI workspace that still feels capable. What should the redesign prioritize?",
        time: "10:42",
      },
      {
        id: "0-2",
        role: "assistant",
        content:
          "Start with a quiet command center: a persistent chat rail, a readable conversation column, and a contextual panel for artifacts or settings. Keep actions close, but let the work remain the visual anchor.\n\nFor Hanna, I would make the system feel authored through hairline dividers, an ink-black action color, and a strong typographic rhythm instead of gradients or decorative noise.",
        time: "10:43",
      },
    ],
  },
  {
    id: 1,
    title: "Python debugging help",
    period: "Today",
    messages: [
      { id: "1-1", role: "user", content: "Why is my list comprehension returning an empty list?", time: "09:18" },
      {
        id: "1-2",
        role: "assistant",
        content: "Let’s trace the filter first. An empty result usually means the predicate never evaluates to true, or the source iterable has already been consumed.",
        time: "09:19",
      },
    ],
  },
  {
    id: 2,
    title: "Deep research on quantum",
    period: "Yesterday",
    messages: [
      { id: "2-1", role: "user", content: "Explain quantum error correction without assuming a physics degree.", time: "16:04" },
      {
        id: "2-2",
        role: "assistant",
        content: "Think of it as protecting a fragile message by spreading its information across a carefully designed pattern, so a small amount of noise can be detected and corrected.",
        time: "16:06",
      },
    ],
  },
  {
    id: 3,
    title: "Image generation prompt",
    period: "Yesterday",
    messages: [{ id: "3-1", role: "user", content: "Make a restrained, editorial prompt for a monochrome city study.", time: "13:27" }],
  },
  {
    id: 4,
    title: "Study plan for ML",
    period: "Previous 7 days",
    messages: [{ id: "4-1", role: "user", content: "Help me build a six-week plan for machine learning fundamentals.", time: "Mon" }],
  },
  {
    id: 5,
    title: "Voice memo transcript",
    period: "Previous 7 days",
    messages: [{ id: "5-1", role: "user", content: "Turn this meeting memo into a short decision log.", time: "Sun" }],
  },
];

const assistantReplies = [
  "I’ve shaped that into a clear next step. The useful move is to keep the surface quiet and let the structure do the work.",
  "Here’s a practical way to approach it: define the outcome first, then choose the smallest tool that helps you reach it.",
  "That sounds like a good place to focus. I’d keep the hierarchy explicit so the important detail is easy to find later.",
];

function HannaMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`hanna-mark ${small ? "hanna-mark-small" : ""}`} aria-hidden="true">
      <img src="/manus-storage/hanna-mark_7f8ef04a.png" alt="" />
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

export default function Home() {
  const [chats, setChats] = useState<Chat[]>(seedChats);
  const [activeChatId, setActiveChatId] = useState(0);
  const [composer, setComposer] = useState("");
  const [selectedTools, setSelectedTools] = useState<ToolKey[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [model, setModel] = useState("Hanna Pro");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState("");
  const [connectedApps, setConnectedApps] = useState<string[]>(["Google Drive"]);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) ?? chats[0], [activeChatId, chats]);
  const hasMessages = activeChat.messages.length > 0;

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
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const selectChat = (id: number) => {
    setActiveChatId(id);
    setPanel(null);
    if (window.innerWidth < 860) setSidebarOpen(false);
  };

  const submitMessage = () => {
    const text = composer.trim();
    if (!text || isThinking) return;
    const chatId = activeChatId;
    const userMessage: Message = {
      id: `${chatId}-${Date.now()}`,
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? { ...chat, title: chat.messages.length === 0 ? text.slice(0, 32) : chat.title, messages: [...chat.messages, userMessage] }
          : chat,
      ),
    );
    setComposer("");
    setIsThinking(true);
    window.setTimeout(() => {
      const reply = assistantReplies[Math.floor(Math.random() * assistantReplies.length)];
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: `${chatId}-assistant-${Date.now()}`,
                    role: "assistant",
                    content: reply,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ],
              }
            : chat,
        ),
      );
      setIsThinking(false);
    }, 720);
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
  };

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
            <button className="sidebar-link is-current" onClick={() => setPanel(null)}>
              <Layers3 size={16} />
              <span>All conversations</span>
              <span className="sidebar-count">{chats.length}</span>
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
          <div className="account-row">
            <div className="avatar">U</div>
            <div className="account-copy">
              <span className="account-name">You</span>
              <span className="account-plan">Personal workspace</span>
            </div>
            <MoreHorizontal size={16} className="muted-icon" />
          </div>
        </div>
      </aside>

      <main className="main-workspace">
        <header className="workspace-header">
          <div className="header-leading">
            <button className="icon-button" onClick={() => setSidebarOpen((current) => !current)} aria-label="Toggle sidebar">
              <Menu size={19} />
            </button>
            <div className="workspace-breadcrumb">
              <span className="breadcrumb-quiet">Hanna</span>
              <ChevronRight size={14} />
              <span>{activeChat.title}</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="model-picker">
              <button className="model-button" onClick={() => setModelMenuOpen((current) => !current)} aria-expanded={modelMenuOpen}>
                <span className="model-pulse" />
                {model}
                <ChevronDown size={14} />
              </button>
              {modelMenuOpen && (
                <div className="model-menu">
                  {["Hanna Pro", "Hanna Fast", "Hanna Focus"].map((option) => (
                    <button
                      key={option}
                      className={`model-option ${model === option ? "is-selected" : ""}`}
                      onClick={() => {
                        setModel(option);
                        setModelMenuOpen(false);
                      }}
                    >
                      <span>{option}</span>
                      {model === option && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="header-settings-button" onClick={() => togglePanel("settings")} aria-label="Open settings">
              <Settings size={17} />
            </button>
            <div className="header-avatar">U</div>
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
                  <button className="subtle-action" onClick={() => togglePanel("artifacts")}>
                    <PanelRight size={15} />
                    Artifacts
                  </button>
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
            <div className="context-title"><span className="context-kicker">Workspace</span><h2>{panel === "artifacts" ? "Artifacts" : "Settings"}</h2></div>
            <button className="icon-button" onClick={() => setPanel(null)} aria-label="Close panel"><X size={17} /></button>
          </div>
          {panel === "artifacts" ? <ArtifactsPanel onCopy={copyArtifact} /> : <SettingsHub activeSection={settingsSection} onSectionChange={setSettingsSection} theme={theme} onThemeToggle={toggleTheme} connectedApps={connectedApps} onToggleApp={toggleApp} onToast={showToast} />}
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
  const apps = [
    { name: "Google Drive", description: "Bring documents into a conversation", icon: FileText },
    { name: "Notion", description: "Search pages and save working notes", icon: BookOpen },
    { name: "Slack", description: "Find context across your team", icon: Zap },
  ];
  const settingsNav: Array<{ id: SettingsSection; label: string; icon: typeof SlidersHorizontal }> = [
    { id: "overview", label: "Overview", icon: SlidersHorizontal },
    { id: "api-keys", label: "API keys", icon: KeyRound },
    { id: "connectors", label: "Connectors", icon: PlugZap },
    { id: "mcps", label: "MCP servers", icon: Server },
    { id: "workspace", label: "Workspace", icon: ShieldCheck },
  ];
  return (
    <div className="context-scroll custom-scroll settings-scroll">
      <div className="settings-nav" role="tablist" aria-label="Settings sections">
        {settingsNav.map(({ id, label, icon: Icon }) => <button key={id} className={activeSection === id ? "is-active" : ""} onClick={() => onSectionChange(id)} role="tab" aria-selected={activeSection === id}><Icon size={13} /><span>{label}</span></button>)}
      </div>
      {(activeSection === "overview" || activeSection === "workspace") && <section className="settings-section settings-overview-card">
        <div className="settings-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Control center</span><h3>Everything in one place</h3></div><Webhook size={17} /></div>
        <p className="settings-intro">Manage how Hanna connects to your models, apps, and tools. Secrets stay masked in the interface and are handled by your connected runtime.</p>
        <div className="settings-category-list">
          {[{ id: "api-keys" as const, icon: KeyRound, label: "Provider API keys", detail: "OpenAI, Anthropic, Gemini, Groq, custom" }, { id: "connectors" as const, icon: PlugZap, label: "Apps & connectors", detail: "Google Drive, Slack, Shopify, GitHub" }, { id: "mcps" as const, icon: Server, label: "MCP servers", detail: "Tools, endpoints, and permission scopes" }].map(({ id, icon: Icon, label, detail }) => <button key={id} className="settings-category" onClick={() => onSectionChange(id)}><span className="settings-category-icon"><Icon size={15} /></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight size={14} /></button>)}
        </div>
      </section>}
      {(activeSection === "overview" || activeSection === "api-keys") && <section className="settings-section">
        <div className="settings-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Provider access</span><h3>API keys</h3></div><KeyRound size={17} /></div>
        <p className="settings-intro">Use your own provider keys for model routing. Hanna only shows connection status here; raw credentials never appear in the UI.</p>
        <div className="credential-list">{[{ name: "OpenAI", model: "GPT-4o / o-series", status: "Not connected" }, { name: "Anthropic", model: "Claude family", status: "Not connected" }, { name: "Google Gemini", model: "Gemini family", status: "Not connected" }, { name: "Custom provider", model: "OpenAI-compatible endpoint", status: "Extensible" }].map(({ name, model, status }) => <div className="credential-row" key={name}><div className="credential-icon"><KeyRound size={13} /></div><div className="integration-copy"><strong>{name}</strong><span>{model} · {status}</span></div><button className="integration-toggle" onClick={() => onToast(`${name} API key setup is available in the secure Settings flow`)}>Add key</button></div>)}</div>
      </section>}
      {(activeSection === "overview" || activeSection === "workspace") && <section className="settings-section">
        <div className="settings-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Appearance</span><h3>Make it yours</h3></div><SlidersHorizontal size={17} /></div>
        <div className="theme-setting"><div><strong>Theme</strong><span>{theme === "light" ? "Paper white and graphite" : "Charcoal and soft white"}</span></div><button className="theme-switch" onClick={onThemeToggle} aria-label="Toggle theme"><span className={theme === "dark" ? "is-dark" : ""} /></button></div>
        <div className="theme-options"><button className={theme === "light" ? "is-selected" : ""} onClick={() => theme === "dark" && onThemeToggle()}><Sun size={15} /> Light</button><button className={theme === "dark" ? "is-selected" : ""} onClick={() => theme === "light" && onThemeToggle()}><Moon size={15} /> Dark</button></div>
      </section>}
      {(activeSection === "overview" || activeSection === "connectors") && <section className="settings-section">
        <div className="settings-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Apps & integrations</span><h3>Bring your work with you</h3></div><PanelRight size={17} /></div>
        <p className="settings-intro">Connect the places where your work already lives. Hanna will keep each connection visible and under your control.</p>
        <div className="integration-list">{apps.map(({ name, description, icon: Icon }) => { const isConnected = connectedApps.includes(name); return <div className="integration-row" key={name}><div className="integration-icon"><Icon size={16} /></div><div className="integration-copy"><strong>{name}</strong><span>{description}</span></div><button className={`integration-toggle ${isConnected ? "is-connected" : ""}`} onClick={() => onToggleApp(name)}>{isConnected ? <><Check size={13} /> Ready</> : "Connect"}</button></div>; })}</div>
      </section>}
      {(activeSection === "overview" || activeSection === "mcps") && <section className="settings-section">
        <div className="settings-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Tool protocol</span><h3>MCP servers</h3></div><Server size={17} /></div>
        <p className="settings-intro">Connect Model Context Protocol servers to give Hanna scoped tools. Each server remains visible with its endpoint and permission state.</p>
        <div className="mcp-card"><div className="mcp-card-top"><div className="integration-icon"><Server size={15} /></div><div className="integration-copy"><strong>Custom MCP server</strong><span>Discover tools from a trusted endpoint</span></div><span className="mcp-status">Ready to connect</span></div><div className="mcp-endpoint"><Webhook size={13} /><span>https://your-server.example/mcp</span><button onClick={() => onToast("MCP endpoint setup is available in Settings")}>Configure</button></div></div>
      </section>}
      {(activeSection === "overview" || activeSection === "workspace") && <section className="settings-section compact-section">
        <div className="settings-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> What's new</span><h3>Hanna, in focus</h3></div><CircleHelp size={17} /></div>
        <div className="release-note"><div className="release-number">02</div><div><strong>Artifacts live beside the conversation.</strong><p>Keep a generated direction, code snippet, or research surface close without leaving the thread.</p><button onClick={() => onToast("You are already looking at the latest Hanna workspace")}>Read release notes <ChevronRight size={14} /></button></div></div>
      </section>}
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
