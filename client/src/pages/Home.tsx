import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import MarkdownMessage from "@/components/MarkdownMessage";
import type { IntegrationCategory } from "@shared/integrations";
import {
  Activity,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Compass,
  FileText,
  FolderKanban,
  Gauge,
  Github,
  KeyRound,
  Globe2,
  Inbox,
  LayoutGrid,
  Library,
  ListTodo,
  Menu,
  Moon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  ShoppingBag,
  MessageSquare,
  Settings,
  Sparkles,
  Square,
  Sun,
  Workflow,
  X,
  Zap,
  Video,
  Mic,
  Share2,
  Store,
  Layers,
  Terminal,
  Cpu,
  Plug,
} from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useState } from "react";

type NavItem = { label: string; icon: typeof Activity; section?: string };

const primaryNav: NavItem[] = [
  { label: "Home", icon: Compass },
  { label: "Hanna", icon: Sparkles },
  { label: "Projects", icon: FolderKanban },
  { label: "Tasks", icon: ListTodo },
  { label: "Knowledge", icon: Library },
  { label: "Files", icon: FileText },
];
const secondaryNav: NavItem[] = [
  { label: "Apps & Integrations", icon: LayoutGrid },
  { label: "AI Models", icon: BrainCircuit },
  { label: "Marketing", icon: Zap },
  { label: "Commerce", icon: BriefcaseBusiness },
  { label: "Automations", icon: Workflow },
  { label: "Developer", icon: Code2 },
];

const quickActions = [
  ["Research", Search], ["Analyze", Gauge], ["Build", Code2], ["Create", Sparkles], ["Write", FileText], ["Automate", Workflow],
] as const;

type WorkItem = { title: string; project: string; progress: number; stage: string; tools: string[]; tone: string };
type ProjectItem = { name: string; type: string; icon: typeof Code2; color: string; meta: string };

const activeWork: WorkItem[] = [
  { title: "Website authentication", project: "Liverton Learning", progress: 67, stage: "Testing authentication", tools: ["GitHub", "Gemini", "Vercel"], tone: "blue" },
  { title: "Quarterly knowledge digest", project: "Liverton Business", progress: 31, stage: "Reading 4 documents", tools: ["Knowledge", "Gemini"], tone: "violet" },
  { title: "Avatar promotional video", project: "Brand Launch", progress: 85, stage: "Rendering HeyGen video", tools: ["HeyGen", "Synthesia", "Shopify"], tone: "mint" },
];

const recentProjects: ProjectItem[] = [
  { name: "Hanna Development", type: "Software project", icon: Code2, color: "lavender", meta: "Updated 12 min ago" },
  { name: "Liverton Learning", type: "Business workspace", icon: BriefcaseBusiness, color: "mint", meta: "Updated yesterday" },
  { name: "Personal Knowledge", type: "Knowledge space", icon: Library, color: "peach", meta: "Updated 3 days ago" },
];

type ProviderSummary = { provider: string };
type WorkspaceProviderSettings = { defaultProvider?: string };
export function getProviderKeyError(user: unknown, settings?: WorkspaceProviderSettings, providers?: ProviderSummary[]) {
  if (!user || !settings || settings.defaultProvider === "automatic" || !providers) return null;
  const selected = settings.defaultProvider;
  if (!selected || providers.some(provider => provider.provider === selected)) return null;
  return `Connect your ${selected} API key in Settings to send this request.`;
}

export function getProviderFailureError(text: string) {
  return text.includes("Check its API key in Settings") ? text : null;
}

export default function Home() {
  const { user } = useAuth();
  const [active, setActive] = useState("Home");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("hanna-theme") !== "light");
  useEffect(() => { localStorage.setItem("hanna-theme", dark ? "dark" : "light"); }, [dark]);
  const [route, setRoute] = useState({ model: "gemini-3-flash-preview", capability: "Multimodal reasoning" });
  const [composerError, setComposerError] = useState<string | null>(null);
  const ask = trpc.hanna.ask.useMutation();
  const { data: providers } = trpc.providers.list.useQuery(undefined, { enabled: !!user });
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: !!user });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }, []);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = prompt.trim();
    if (!value || isWorking) return;
    setComposerError(null);
    const keyError = getProviderKeyError(user, settings, providers);
    if (keyError) {
      setComposerError(keyError);
      return;
    }
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", text: value }]);
    setIsWorking(true);
    try {
      const result = await ask.mutateAsync({ prompt: value, context: active === "Home" ? "Home command center" : active });
      const providerError = getProviderFailureError(result.text);
      if (providerError) setComposerError(providerError);
      setRoute({ model: result.model, capability: result.capability });
      setMessages(prev => [...prev, { role: "assistant", text: result.text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I’m unable to reach the model right now. Your request is saved locally—please try again in a moment." }]);
    } finally {
      setIsWorking(false);
    }
  }

  function chooseAction(label: string) {
    setActive("Hanna");
    setPrompt(`${label} `);
  }

  return (
    <div className={dark ? "hanna-app dark" : "hanna-app"}>
      <aside className="hanna-sidebar">
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={2.4} /></div>
          <span className="brand-name">hanna</span>
          <button className="icon-btn sidebar-collapse" aria-label="Collapse sidebar"><Menu size={17} /></button>
        </div>
        <div className="status-pill"><span className="online-dot" /> Hanna is online <ChevronDown size={13} /></div>
        <button className="new-task" onClick={() => { setActive("Hanna"); setMessages([]); }}><Plus size={16} /> New request <span>⌘ K</span></button>
        <nav className="nav-groups">
          <p className="nav-label">Workspace</p>
          {primaryNav.map(item => <NavButton key={item.label} item={item} active={active} setActive={setActive} />)}
          <p className="nav-label secondary-label">Capabilities</p>
          {secondaryNav.map(item => <NavButton key={item.label} item={item} active={active} setActive={setActive} />)}
        </nav>
        <div className="sidebar-bottom">
          <button className={active === "Activity" ? "nav-button nav-active" : "nav-button"} onClick={() => setActive("Activity")}><Activity size={16} /> Activity <span className="nav-count">3</span></button>
          <button className={active === "Settings" ? "nav-button nav-active" : "nav-button"} onClick={() => setActive("Settings")}><Settings size={16} /> Settings</button>
          <div className="profile-row"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><small>Personal workspace</small></div><MoreHorizontal size={16} className="muted" /></div>
        </div>
      </aside>

      <main className="hanna-main">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Sparkles size={15} /></div><span>hanna</span></div>
          <div className="breadcrumbs"><span>{active === "Home" ? "Workspace" : "Hanna"}</span><span>/</span><strong>{active}</strong></div>
          <div className="top-actions"><button className="icon-btn" aria-label="Search"><Search size={17} /></button><button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="help-btn"><CircleHelp size={16} /> Help</button></div>
        </header>

        {active === "Home" ? <Dashboard greeting={greeting} chooseAction={chooseAction} activeWork={activeWork} recentProjects={recentProjects} setActive={setActive} /> : <Workspace title={active} messages={messages} isWorking={isWorking} route={route} composerError={composerError} />}

        {messages.length > 0 && active !== "Hanna" && <div className="floating-chat"><button onClick={() => setActive("Hanna")}><Sparkles size={15} /> Open Hanna conversation <ArrowUpRight size={15} /></button></div>}
        <div className="mobile-nav">{primaryNav.slice(0, 4).map(item => <button key={item.label} className={active === item.label ? "mobile-nav-active" : ""} onClick={() => setActive(item.label)}><item.icon size={18} /><span>{item.label}</span></button>)}</div>
      </main>

      {(active === "Home" || active === "Hanna") && <Composer prompt={prompt} setPrompt={setPrompt} submit={submit} isWorking={isWorking} composerError={composerError} clearComposerError={() => setComposerError(null)} setActive={setActive} />}
    </div>
  );
}

function NavButton({ item, active, setActive }: { item: NavItem; active: string; setActive: (value: string) => void }) {
  return <button className={active === item.label ? "nav-button nav-active" : "nav-button"} onClick={() => setActive(item.label)}><item.icon size={16} /><span>{item.label}</span>{item.label === "Tasks" && <span className="nav-count">4</span>}</button>;
}

function Dashboard({ greeting, chooseAction, activeWork, recentProjects, setActive }: { greeting: string; chooseAction: (label: string) => void; activeWork: WorkItem[]; recentProjects: ProjectItem[]; setActive: (value: string) => void }) {
  return <div className="page dashboard-page"><section className="hero"><div className="eyebrow"><span className="eyebrow-line" /> YOUR COMMAND CENTER</div><h1>{greeting}, Alex<span className="period">.</span></h1><p className="hero-subtitle">What should Hanna handle?</p><div className="hero-orbit"><div className="orbit-ring orbit-one" /><div className="orbit-ring orbit-two" /><div className="hero-spark"><Sparkles size={25} /></div></div></section>
    <section className="command-card"><div className="command-top"><div className="command-icon"><Sparkles size={18} /></div><div><strong>Ask Hanna anything</strong><span>Research, build, analyze, create, automate or connect tools</span></div><div className="command-context">Personal workspace <ChevronDown size={14} /></div></div><div className="command-input-placeholder" onClick={() => chooseAction("Help me")}><span>Ask Hanna to research, build, analyze, create video, automate dropshipping or sync apps...</span><div className="composer-actions"><button aria-label="Attach"><Paperclip size={17} /></button><button aria-label="Voice"><Activity size={17} /></button><button className="send-circle"><Send size={15} /></button></div></div><div className="command-footer"><span><kbd>⌘</kbd><kbd>↵</kbd> to send</span><span>Hanna routes work across connected AI models & MCP adapters</span></div></section>
    <section className="quick-section"><div className="section-heading"><div><p className="section-kicker">START WITH A DIRECTION</p><h2>What do you want to do?</h2></div><button className="text-button">View all <ArrowUpRight size={14} /></button></div><div className="quick-grid">{quickActions.map(([label, Icon]) => <button key={label} className="quick-card" onClick={() => chooseAction(label)}><div className="quick-icon"><Icon size={18} /></div><span>{label}</span><ArrowUpRight size={14} className="quick-arrow" /></button>)}</div></section>
    <section className="content-grid"><div className="panel active-panel"><div className="panel-heading"><div><p className="section-kicker">IN MOTION</p><h2>Active work <span className="live-badge"><span /> LIVE</span></h2></div><button className="text-button">See all <ArrowUpRight size={14} /></button></div>{activeWork.map(work => <div className="work-item" key={work.title} role="button" tabIndex={0} onClick={() => chooseAction(`Continue ${work.title}`)}><div className={`work-icon ${work.tone}`}><Bot size={18} /></div><div className="work-info"><div className="work-title"><strong>{work.title}</strong><span className="work-status">Working</span></div><p>{work.project}</p><div className="progress-row"><div className="progress-track"><div style={{ width: `${work.progress}%` }} /></div><span>{work.progress}%</span></div><div className="work-meta"><span><Zap size={12} /> {work.stage}</span><span>{work.tools.join(" · ")}</span></div></div><button className="work-open">Open <ArrowUpRight size={14} /></button></div>)}</div>
      <div className="panel"><div className="panel-heading"><div><p className="section-kicker">YOUR CONTEXTS</p><h2>Recent projects</h2></div><button className="icon-btn"><Plus size={16} /></button></div>{recentProjects.map(project => <button className="project-item" key={project.name} onClick={() => setActive(project.name === "Personal Knowledge" ? "Knowledge" : "Projects")}><div className={`project-icon ${project.color}`}><project.icon size={17} /></div><div><strong>{project.name}</strong><p>{project.type}</p></div><span className="project-time">{project.meta}</span></button>)}<button className="add-project"><Plus size={15} /> Create a project</button></div></section>
    <section className="activity-strip"><div className="activity-title"><div className="activity-pulse"><Activity size={16} /></div><div><p className="section-kicker">RECENT ACTIVITY</p><strong>Hanna finished rendering <span>HeyGen Promo Video.mp4</span> and synced catalog with <span>Shopify</span></strong></div></div><div className="activity-detail"><span><Check size={14} /> Completed</span><small>5 minutes ago</small></div><button className="icon-btn"><ArrowUpRight size={16} /></button></section>
  </div>
}

function Workspace({ title, messages, isWorking, route, composerError }: { title: string; messages: { role: "user" | "assistant"; text: string }[]; isWorking: boolean; route: { model: string; capability: string }; composerError: string | null }) {
  const [chatSearch, setChatSearch] = useState("");
  const [chatName, setChatName] = useState("New conversation");
  const [archived, setArchived] = useState(false);
  const [approved, setApproved] = useState(false);
  const description: Record<string, string> = { Hanna: "Your intelligent workspace for getting things done.", Projects: "Organize conversations, tasks, files and knowledge around meaningful work.", Tasks: "Long-running work, approvals and outcomes in one place.", Knowledge: "Give Hanna the context she needs to be more useful.", Files: "Your documents and generated assets, ready when you are.", "Apps & Integrations": "Connect Shopify, CJ Dropshipping, HeyGen, TikTok, GitHub, MCP servers & social channels.", "AI Models": "Choose how Hanna thinks, creates and routes work across AI providers.", Marketing: "Turn ideas, avatar videos, and knowledge into campaigns that move.", Commerce: "Operate Shopify, CJ Dropshipping, AutoDS, Zendrop & Take.app storefronts.", Automations: "Build repeatable workflows with humanized approvals.", Developer: "Repositories, MCP servers, Jules, v0, and deployments.", Settings: "Shape how Hanna works for you." };
  if (title === "Settings") return <SettingsView />;
  if (title === "AI Models") return <ModelsView />;
  if (title === "Apps & Integrations") return <IntegrationsView />;
  if (title === "Activity") return <ActivityView />;
  if (["Projects", "Tasks", "Knowledge", "Files"].includes(title)) return <CollectionView title={title} description={description[title]} />;
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> HANNA WORKSPACE</p><h1>{title}</h1><p>{description[title] || "A focused workspace for your next outcome."}</p></div><button className="outline-btn"><Plus size={15} /> New {title === "Hanna" ? "conversation" : "item"}</button></div>{title === "Hanna" ? <><div className="chat-history-strip"><div className="history-title"><Inbox size={15} /><strong>Conversations</strong></div><input aria-label="Search conversations" placeholder="Search conversations" value={chatSearch} onChange={e => setChatSearch(e.target.value)} /><button className="history-action" onClick={() => { setChatName("New conversation"); setArchived(false); }}> <Plus size={14} /> New</button><button className="history-action" onClick={() => setChatName(chatName === "New conversation" ? "Untitled workspace chat" : "New conversation")}>Rename</button><button className="history-action" onClick={() => setArchived(!archived)}>{archived ? "Restore" : "Archive"}</button></div><div className="history-results">{["Research brief · Today", "Liverton website · Yesterday", "CJ Dropshipping & Shopify Sync · Tuesday", "HeyGen Avatar Video Campaign · Monday"].filter(item => item.toLowerCase().includes(chatSearch.toLowerCase())).map(item => <button key={item} onClick={() => setChatName(item)} className={chatName === item ? "history-item history-selected" : "history-item"}>{item}<MoreHorizontal size={13} /></button>)}{archived && <span className="archived-label">Archived: {chatName}</span>}</div><div className="chat-layout"><div className="chat-column">{messages.length === 0 ? <div className="empty-chat"><div className="empty-orb"><Sparkles size={27} /></div><h2>What should we work on?</h2><p>Ask Hanna to research, analyze, create video, code, manage dropshipping or connect an MCP app.</p><div className="suggestion-row"><button>Research a topic</button><button>Create HeyGen video</button><button>Sync CJ Dropshipping catalog</button></div></div> : <div className="messages">{messages.map((message, index) => <div className={message.role === "user" ? "message user-message" : "message assistant-message"} key={`${message.role}-${index}`}><div className="message-avatar">{message.role === "user" ? "AM" : <Sparkles size={14} />}</div><div className="message-body"><span className="message-label">{message.role === "user" ? "You" : "Hanna"}</span>{message.role === "assistant" ? <><MarkdownMessage content={message.text} /><div className="message-actions"><button onClick={() => navigator.clipboard?.writeText(message.text)}>Copy</button><button onClick={() => localStorage.setItem("hanna-saved-output", message.text)}>Save output</button></div></> : <p>{message.text}</p>}</div></div>)}</div>}{isWorking && <div className="working-indicator"><div className="message-avatar"><Sparkles size={14} /></div><span>Hanna is working</span><i /><i /><i /></div>}</div><aside className="agent-panel"><div className="agent-panel-header"><div><p className="section-kicker">OPERATIONS</p><h3>Hanna is ready</h3></div><span className="ready-dot" /></div><div className={composerError ? "route-card route-error" : "route-card"}><div className="route-header"><BrainCircuit size={15} /><span>{composerError ? "Routing error" : "Automatic routing"}</span><span className="route-state">{composerError ? "Warning" : "Active"}</span></div><strong>{composerError ? "Missing credential" : route.model}</strong><p>{composerError ? "Check provider settings" : `Selected for ${route.capability.toLowerCase()}`}</p></div><p className="section-kicker activity-label">CURRENT ACTIVITY</p>{["Understanding request", "Searching Knowledge", "Selecting model", "Waiting for your request"].map((step, i) => <div className="agent-step" key={step}><span className={i === 3 ? "step-dot pending" : "step-dot"}>{i < 3 ? <Check size={11} /> : null}</span><span>{step}</span></div>)}<div className="tool-card"><Github size={15} /><span>GitHub</span><small>Connected</small></div><div className="tool-card"><ShoppingBag size={15} /><span>Shopify & CJ Dropshipping</span><small>Connected</small></div><div className="tool-card"><Plug size={15} /><span>Custom MCP Adapter</span><small>Active</small></div><div className="approval-card"><div><strong>Approval gate</strong><p>Consequential actions pause for your human review.</p></div><button onClick={() => setApproved(!approved)}>{approved ? "Approved" : "Review"}</button></div></aside></div></> : <div className="workspace-empty"><div className="empty-icon"><LayoutGrid size={22} /></div><h2>Build your {title.toLowerCase()} workspace</h2><p>{description[title]}</p><button className="primary-btn"><Plus size={15} /> Get started</button></div>}</div>
}

function SettingsView() {
  const { user } = useAuth();
  const { data: catalog = [] } = trpc.providers.catalog.useQuery();
  const { data: connected = [] } = trpc.providers.list.useQuery(undefined, { enabled: !!user });
  const save = trpc.providers.save.useMutation();
  const remove = trpc.providers.remove.useMutation();
  const testConnection = trpc.providers.testConnection.useMutation();
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState("My custom provider");
  const [endpoints, setEndpoints] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const connectedMap = new Map(connected.map(item => [item.provider, item]));

  const filteredCatalog = useMemo(() => {
    if (activeCategory === "all") return catalog;
    return catalog.filter(p => p.category.toLowerCase().includes(activeCategory.toLowerCase()));
  }, [catalog, activeCategory]);

  async function saveKey(provider: (typeof catalog)[number]) {
    const apiKey = keys[provider.id]?.trim();
    if (!apiKey) return;
    await save.mutateAsync({ provider: provider.id, displayName: provider.id === "custom" ? customName : provider.name, apiKey, endpoint: endpoints[provider.id] || undefined });
    setKeys(prev => ({ ...prev, [provider.id]: "" }));
    setNotice(`${provider.name} key saved securely on the backend.`);
  }

  async function removeKey(provider: string) {
    await remove.mutateAsync({ provider });
    setNotice("Provider disconnected.");
  }

  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> CONNECTIONS & AI VAULT</p><h1>Provider API Keys</h1><p>Bring your own keys for AI models, video generators (HeyGen, Synthesia), voice, and developer agents. Stored securely on the backend.</p></div><div className="settings-heading-actions"><div className="secure-badge"><Check size={14} /> Backend GCM Encrypted</div><button className="outline-btn" onClick={() => setModalOpen(true)}>Manage keys</button></div></div>{!user && <div className="login-note"><Inbox size={17} /><div><strong>Sign in to save provider keys</strong><p>Keys are encrypted at rest with server-side secrets and never exposed to browser bundles.</p></div><button className="outline-btn" onClick={() => setNotice("Firebase Auth is ready. Add environment secrets to enable sign-in.")}>Configure auth</button></div>}{notice && <div className="success-note"><Check size={15} /> {notice}<button className="icon-btn" onClick={() => setNotice("")}><X size={14} /></button></div>}{modalOpen ? <div className="settings-modal-overlay" role="dialog" aria-modal="true" aria-label="API key settings"><div className="settings-modal"><div className="settings-modal-header"><div><span className="section-kicker">SECURE KEY VAULT</span><h2>Manage API Keys</h2></div><button className="icon-btn" onClick={() => setModalOpen(false)} aria-label="Close settings"><X size={16} /></button></div><div className="category-filter-strip"><button className={activeCategory === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory("all")}>All ({catalog.length})</button><button className={activeCategory === "model" ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory("model")}>AI Models</button><button className={activeCategory === "content" ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory("content")}>Content & Video</button><button className={activeCategory === "developer" ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory("developer")}>Code & Design</button></div><p className="settings-modal-copy">Keys are encrypted with AES-256-GCM. Raw keys are never returned by API calls.</p><div className="provider-grid">{filteredCatalog.map(provider => { const current = connectedMap.get(provider.id); return <div className="provider-card" key={provider.id}><div className="provider-card-header"><div className="provider-avatar">{provider.category.includes("Content") ? <Video size={16} /> : provider.category.includes("Developer") || provider.category.includes("Design") ? <Terminal size={16} /> : <BrainCircuit size={16} />}</div><div><strong>{provider.name}</strong><span>{provider.category}</span></div><span className={current ? "connected-status" : "disconnected-status"}>{current ? "Connected" : "Not connected"}</span></div>{provider.id === "custom" && <label className="key-label">Provider name<input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="My custom provider" /></label>}<label className="key-label">{provider.id === "custom" ? "Endpoint URL" : "API key"}{provider.id === "custom" && <input type="url" value={endpoints[provider.id] || ""} onChange={e => setEndpoints(prev => ({ ...prev, [provider.id]: e.target.value }))} placeholder="https://api.example.com/v1/chat/completions" />}<input type="password" value={keys[provider.id] || ""} onChange={e => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))} placeholder={current ? `Saved ${current.keyHint}` : provider.placeholder} autoComplete="new-password" /></label><div className="provider-actions"><button className="primary-small" disabled={!user || !keys[provider.id] || save.isPending} onClick={() => saveKey(provider)}>{save.isPending ? "Saving…" : "Save key"}</button>{current && <><button className="remove-small" onClick={() => removeKey(provider.id)}>Disconnect</button><button className="test-small" onClick={async () => { const result = await testConnection.mutateAsync({ provider: provider.id }); setNotice(result.message); }}>{testConnection.isPending ? "Testing…" : "Test"}</button></>}</div></div>; })}</div></div></div> : <div className="settings-placeholder"><div className="empty-icon"><KeyRound size={20} /></div><h2>Your API keys are protected</h2><p>Open the key vault to connect Gemini, OpenAI, HeyGen, Synthesia, ElevenLabs, Jules or custom models.</p><button className="primary-btn" onClick={() => setModalOpen(true)}>Open key vault</button></div>}</div>;
}

function IntegrationsView() {
  const { user } = useAuth();
  const { data: catalog = [] } = trpc.integrations.catalog.useQuery();
  const { data: connected = [], refetch } = trpc.integrations.listCredentials.useQuery(undefined, { enabled: !!user });
  const save = trpc.integrations.saveCredential.useMutation({ onSuccess: () => refetch() });
  const preview = trpc.integrations.previewAction.useMutation();
  const approve = trpc.integrations.approveAction.useMutation();
  const execute = trpc.integrations.executeApproved.useMutation();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIntegrationId, setActiveIntegrationId] = useState<string>("shopify");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [approvalId, setApprovalId] = useState("");

  const connectedMap = new Map(connected.map(item => [item.connector, item]));

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  const activeIntegration = useMemo(() => {
    return catalog.find(item => item.id === activeIntegrationId) || catalog[0];
  }, [catalog, activeIntegrationId]);

  const saveConnection = async () => {
    if (!activeIntegration) return;
    await save.mutateAsync({ connector: activeIntegration.id, values });
    setValues({});
    setNotice(`${activeIntegration.name} credentials saved securely.`);
  };

  const previewAction = async () => {
    if (!activeIntegration) return;
    const actionName = activeIntegration.id === "shopify" ? "list_products" : activeIntegration.id === "slack" ? "list_channels" : "sync_inventory";
    const result = await preview.mutateAsync({ connector: activeIntegration.id, action: actionName, parameters: values });
    setApprovalId(result.id);
    setNotice(`Approval required for ${result.action.replaceAll("_", " ")}.`);
  };

  const approveAndExecute = async () => {
    await approve.mutateAsync({ approvalId });
    const result = await execute.mutateAsync({ approvalId });
    setNotice(`${result.summary} ${result.verification.detail}`);
    setApprovalId("");
  };

  const getCategoryIcon = (cat: IntegrationCategory) => {
    switch (cat) {
      case "commerce": return <Store size={16} />;
      case "content_creation": return <Video size={16} />;
      case "communication": return <MessageSquare size={16} />;
      case "social": return <Share2 size={16} />;
      case "developer": return <Code2 size={16} />;
      case "workspace": return <BriefcaseBusiness size={16} />;
      case "custom_mcp": return <Plug size={16} />;
      default: return <LayoutGrid size={16} />;
    }
  };

  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> CONNECTED WORKFLOWS & MCP</p><h1>Apps & Integrations</h1><p>Connect Shopify, CJ Dropshipping, AutoDS, Take.app, HeyGen, TikTok, Pinterest, GitHub & Custom MCP servers.</p></div><div className="secure-badge"><Check size={14} /> Server-side encrypted</div></div>{!user && <div className="login-note"><Inbox size={17} /><div><strong>Sign in to enable live integrations</strong><p>Credentials and tokens are stored encrypted and bounded to your account.</p></div></div>}{notice && <div className="success-note"><Check size={15} /> {notice}<button className="icon-btn" onClick={() => setNotice("")}><X size={14} /></button></div>}<div className="integration-filter-bar"><div className="category-filter-strip"><button className={selectedCategory === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedCategory("all")}>All ({catalog.length})</button><button className={selectedCategory === "commerce" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedCategory("commerce")}><Store size={13} /> E-Commerce & Dropshipping</button><button className={selectedCategory === "content_creation" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedCategory("content_creation")}><Video size={13} /> Content Creation</button><button className={selectedCategory === "social" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedCategory("social")}><Share2 size={13} /> Social & Bio</button><button className={selectedCategory === "developer" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedCategory("developer")}><Code2 size={13} /> Developer</button><button className={selectedCategory === "custom_mcp" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedCategory("custom_mcp")}><Plug size={13} /> Custom MCP</button></div><div className="search-box"><Search size={15} /><input placeholder="Search apps, tools, or MCP..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div><div className="model-grid">{filteredCatalog.map(item => { const isConn = connectedMap.has(item.id); return <div className={`model-card ${activeIntegrationId === item.id ? "selected-integration-card" : ""}`} key={item.id} onClick={() => setActiveIntegrationId(item.id)}><div className="model-logo blue">{getCategoryIcon(item.category)}</div><div className="model-card-copy"><div className="model-card-top"><strong>{item.name}</strong><span className={isConn ? "status-connected" : "status-available"}>{isConn ? "Connected" : item.supportsMcp ? "MCP Adapter" : "Available"}</span></div><h3>{item.category.replaceAll("_", " ")}</h3><p>{item.description}</p></div><button className="icon-btn" aria-label={`Configure ${item.name}`}><ArrowUpRight size={16} /></button></div>; })}</div>{activeIntegration && <div className="settings-modal" style={{ maxWidth: 720, marginTop: 28 }}><div className="settings-modal-header"><div><span className="section-kicker">{activeIntegration.category.toUpperCase()} INTEGRATION</span><h2>Configure {activeIntegration.name}</h2></div><span className="connected-status">{connectedMap.has(activeIntegration.id) ? "Connected" : "Not connected"}</span></div><p className="settings-modal-copy">{activeIntegration.description}</p><div className="provider-grid">{activeIntegration.credentialFields.map(field => <label className="key-label" key={field}>{field.replaceAll(/([A-Z])/g, " $1")}<input type={field.toLowerCase().includes("token") || field.toLowerCase().includes("key") || field.toLowerCase().includes("secret") ? "password" : "text"} value={values[field] ?? ""} onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))} placeholder={`Enter ${field}`} autoComplete="new-password" /></label>)}<div className="provider-actions"><button className="primary-small" disabled={!user || save.isPending} onClick={saveConnection}>{save.isPending ? "Saving…" : "Save connection"}</button><button className="test-small" disabled={!user || preview.isPending} onClick={previewAction}>{preview.isPending ? "Preparing…" : "Preview action"}</button>{approvalId && <button className="primary-small" disabled={approve.isPending || execute.isPending} onClick={approveAndExecute}>{approve.isPending || execute.isPending ? "Executing…" : "Approve & execute"}</button>}</div></div></div>}</div>;
}

function ModelsView() {
  const models = [
    { name: "Gemini", model: "Gemini 3 Flash", detail: "Fast multimodal reasoning", status: "Connected", color: "blue" },
    { name: "OpenAI", model: "GPT-5 Mini", detail: "Structured analysis and writing", status: "Available", color: "green" },
    { name: "Claude", model: "Claude Sonnet 4.6", detail: "Coding and deep reasoning", status: "Available", color: "violet" },
    { name: "HeyGen / Synthesia", model: "AI Video & Voice Generation", detail: "Studio avatars & video translation", status: "Available", color: "mint" },
    { name: "Custom MCP Models", model: "Model Context Protocol", detail: "Bring your own tool adapters and local LLMs", status: "Active", color: "peach" },
  ];
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> INTELLIGENCE LAYER</p><h1>AI Models & Generators</h1><p>Hanna routes requests dynamically across AI models, video creators, and custom MCP tools.</p></div><button className="outline-btn"><Plus size={15} /> Connect provider</button></div><div className="model-grid">{models.map(model => <div className="model-card" key={model.name}><div className={`model-logo ${model.color}`}><BrainCircuit size={19} /></div><div className="model-card-copy"><div className="model-card-top"><strong>{model.name}</strong><span>{model.status}</span></div><h3>{model.model}</h3><p>{model.detail}</p></div><button className="icon-btn"><MoreHorizontal size={16} /></button></div>)}</div><div className="routing-note"><div className="command-icon"><Sparkles size={17} /></div><div><strong>Automatic capability selection active</strong><p>Hanna routes work by capability, context and tool requirements. You can override routing from the composer.</p></div><button className="text-button">Routing settings <ArrowUpRight size={14} /></button></div></div>;
}

function ActivityView() {
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR TIMELINE</p><h1>Activity</h1><p>A humanized timeline of what Hanna has accomplished across your workspace.</p></div><button className="outline-btn"><Search size={15} /> Filter</button></div><div className="activity-list">{[{icon: Video, title: "Generated HeyGen Avatar Video for Brand Launch", detail: "Content Creation · 5 minutes ago", color: "mint"}, {icon: ShoppingBag, title: "Synced 42 products from CJ Dropshipping to Shopify store", detail: "Commerce · 18 minutes ago", color: "blue"}, {icon: Check, title: "Finished analyzing Annual Business Report.pdf", detail: "Knowledge · 1 hour ago", color: "green"}, {icon: Github, title: "Connected GitHub to Hanna Development", detail: "Apps & Integrations · Yesterday", color: "violet"}].map(item => <div className="timeline-item" key={item.title}><div className={`timeline-icon ${item.color}`}><item.icon size={16} /></div><div><strong>{item.title}</strong><p>{item.detail}</p></div><ArrowUpRight size={15} className="muted" /></div>)}</div></div>;
}

function CollectionView({ title, description }: { title: string; description?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const cards = title === "Knowledge" ? ["Personal Knowledge", "Liverton Business", "Dropshipping Market Research"] : title === "Files" ? ["Annual Business Report.pdf", "HeyGen Promo Script.docx", "Shopify Store Banner.png"] : title === "Tasks" ? ["Website authentication", "Quarterly knowledge digest", "AutoDS order sync"] : ["Hanna Development", "Liverton Learning", "Commerce & Dropshipping Store"];
  const Icon = title === "Files" ? FileText : title === "Tasks" ? ListTodo : title === "Knowledge" ? Library : FolderKanban;
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> HANNA WORKSPACE</p><h1>{title}</h1><p>{description}</p></div><button className="outline-btn"><Plus size={15} /> New {title === "Files" ? "upload" : title === "Knowledge" ? "space" : title.slice(0, -1).toLowerCase()}</button></div><div className="collection-grid">{cards.map((card, index) => <button type="button" className="collection-card" key={card} onClick={() => setSelected(card)}><div className={`collection-icon c-${index}`}><Icon size={18} /></div><div><strong>{card}</strong><p>{title === "Files" ? "Ready · 2.4 MB" : title === "Tasks" ? "Working · 67% complete" : title === "Knowledge" ? "12 sources · Updated today" : "Workspace · Updated recently"}</p></div><ArrowUpRight size={15} className="muted" /></button>)}</div>{selected && <div className="deferred-dialog" role="dialog" aria-modal="true"><div className="deferred-dialog-card"><button className="icon-btn dialog-close" onClick={() => setSelected(null)} aria-label="Close"><X size={16} /></button><div className="empty-icon"><Icon size={20} /></div><h2>{selected}</h2><p>Hanna has this workspace ready. Detailed editing and connected data will be available in the next build.</p><button className="primary-btn" onClick={() => setSelected(null)}>Got it</button></div></div>}</div>;
}

export function Composer({ prompt, setPrompt, submit, isWorking, composerError, clearComposerError, setActive }: { prompt: string; setPrompt: (value: string) => void; submit: (e?: FormEvent) => void; isWorking: boolean; composerError: string | null; clearComposerError: () => void; setActive: (value: string) => void }) {
  const [attachment, setAttachment] = useState<File | null>(null);
  return <form className="composer-dock" onSubmit={submit}><div className="composer-inner"><div className="composer-input">{attachment && <div className="attachment-chip"><Paperclip size={12} /> {attachment.name}<button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment"><X size={12} /></button></div>}<textarea value={prompt} onChange={e => { setPrompt(e.target.value); if (composerError) clearComposerError(); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Ask Hanna to research, build, create video, automate dropshipping, or connect an app..." rows={1} /><div className="composer-bottom"><div className="composer-left"><label className="attachment-button" aria-label="Attach a file"><Paperclip size={16} /><input type="file" hidden onChange={event => setAttachment(event.target.files?.[0] || null)} /></label><button type="button"><span className="model-dot" /> Auto <ChevronDown size={13} /></button><button type="button"><span className="context-dot" /> Personal <ChevronDown size={13} /></button></div><div className="composer-right">{composerError && <div className="composer-error-bubble"><Zap size={12} /> {composerError} <button type="button" onClick={() => setActive("Settings")}>Settings</button></div>}<span className="composer-hint">Enter to send</span><button aria-label="Send message" className={composerError ? "send-button send-warning" : "send-button"} type="submit" disabled={(!prompt.trim() && !isWorking) || !!composerError}>{isWorking ? <Square size={14} fill="currentColor" /> : <Send size={15} />}</button></div></div></div></div></form>
}
