import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import MarkdownMessage from "@/components/MarkdownMessage";
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
  Settings,
  Sparkles,
  Square,
  Sun,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
];

const recentProjects: ProjectItem[] = [
  { name: "Hanna Development", type: "Software project", icon: Code2, color: "lavender", meta: "Updated 12 min ago" },
  { name: "Liverton Learning", type: "Business workspace", icon: BriefcaseBusiness, color: "mint", meta: "Updated yesterday" },
  { name: "Personal Knowledge", type: "Knowledge space", icon: Library, color: "peach", meta: "Updated 3 days ago" },
];

export default function Home() {
  const [active, setActive] = useState("Home");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("hanna-theme") === "dark");
  useEffect(() => { localStorage.setItem("hanna-theme", dark ? "dark" : "light"); }, [dark]);
  const [route, setRoute] = useState({ model: "gemini-3-flash-preview", capability: "Multimodal reasoning" });
  const ask = trpc.hanna.ask.useMutation();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }, []);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = prompt.trim();
    if (!value || isWorking) return;
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", text: value }]);
    setIsWorking(true);
    try {
      const result = await ask.mutateAsync({ prompt: value, context: active === "Home" ? "Home command center" : active });
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
          <button className="nav-button" onClick={() => setActive("Settings")}><Settings size={16} /> Settings</button>
          <div className="profile-row"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><small>Personal workspace</small></div><MoreHorizontal size={16} className="muted" /></div>
        </div>
      </aside>

      <main className="hanna-main">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Sparkles size={15} /></div><span>hanna</span></div>
          <div className="breadcrumbs"><span>{active === "Home" ? "Workspace" : "Hanna"}</span><span>/</span><strong>{active}</strong></div>
          <div className="top-actions"><button className="icon-btn" aria-label="Search"><Search size={17} /></button><button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="help-btn"><CircleHelp size={16} /> Help</button></div>
        </header>

        {active === "Home" ? <Dashboard greeting={greeting} chooseAction={chooseAction} activeWork={activeWork} recentProjects={recentProjects} setActive={setActive} /> : <Workspace title={active} messages={messages} isWorking={isWorking} route={route} />}

        {messages.length > 0 && active !== "Hanna" && <div className="floating-chat"><button onClick={() => setActive("Hanna")}><Sparkles size={15} /> Open Hanna conversation <ArrowUpRight size={15} /></button></div>}
        <div className="mobile-nav">{primaryNav.slice(0, 4).map(item => <button key={item.label} className={active === item.label ? "mobile-nav-active" : ""} onClick={() => setActive(item.label)}><item.icon size={18} /><span>{item.label}</span></button>)}</div>
      </main>

      {(active === "Home" || active === "Hanna") && <Composer prompt={prompt} setPrompt={setPrompt} submit={submit} isWorking={isWorking} />}
    </div>
  );
}

function NavButton({ item, active, setActive }: { item: NavItem; active: string; setActive: (value: string) => void }) {
  return <button className={active === item.label ? "nav-button nav-active" : "nav-button"} onClick={() => setActive(item.label)}><item.icon size={16} /><span>{item.label}</span>{item.label === "Tasks" && <span className="nav-count">4</span>}</button>;
}

function Dashboard({ greeting, chooseAction, activeWork, recentProjects, setActive }: { greeting: string; chooseAction: (label: string) => void; activeWork: WorkItem[]; recentProjects: ProjectItem[]; setActive: (value: string) => void }) {
  return <div className="page dashboard-page"><section className="hero"><div className="eyebrow"><span className="eyebrow-line" /> YOUR COMMAND CENTER</div><h1>{greeting}, Alex<span className="period">.</span></h1><p className="hero-subtitle">What should Hanna handle?</p><div className="hero-orbit"><div className="orbit-ring orbit-one" /><div className="orbit-ring orbit-two" /><div className="hero-spark"><Sparkles size={25} /></div></div></section>
    <section className="command-card"><div className="command-top"><div className="command-icon"><Sparkles size={18} /></div><div><strong>Ask Hanna anything</strong><span>Research, build, analyze, create or automate</span></div><div className="command-context">Personal workspace <ChevronDown size={14} /></div></div><div className="command-input-placeholder" onClick={() => chooseAction("Help me")}><span>Ask Hanna to research, build, analyze, create, automate or manage something...</span><div className="composer-actions"><button aria-label="Attach"><Paperclip size={17} /></button><button aria-label="Voice"><Activity size={17} /></button><button className="send-circle"><Send size={15} /></button></div></div><div className="command-footer"><span><kbd>⌘</kbd><kbd>↵</kbd> to send</span><span>Hanna will choose the right model automatically</span></div></section>
    <section className="quick-section"><div className="section-heading"><div><p className="section-kicker">START WITH A DIRECTION</p><h2>What do you want to do?</h2></div><button className="text-button">View all <ArrowUpRight size={14} /></button></div><div className="quick-grid">{quickActions.map(([label, Icon]) => <button key={label} className="quick-card" onClick={() => chooseAction(label)}><div className="quick-icon"><Icon size={18} /></div><span>{label}</span><ArrowUpRight size={14} className="quick-arrow" /></button>)}</div></section>
    <section className="content-grid"><div className="panel active-panel"><div className="panel-heading"><div><p className="section-kicker">IN MOTION</p><h2>Active work <span className="live-badge"><span /> LIVE</span></h2></div><button className="text-button">See all <ArrowUpRight size={14} /></button></div>{activeWork.map(work => <div className="work-item" key={work.title} role="button" tabIndex={0} onClick={() => chooseAction(`Continue ${work.title}`)}><div className={`work-icon ${work.tone}`}><Bot size={18} /></div><div className="work-info"><div className="work-title"><strong>{work.title}</strong><span className="work-status">Working</span></div><p>{work.project}</p><div className="progress-row"><div className="progress-track"><div style={{ width: `${work.progress}%` }} /></div><span>{work.progress}%</span></div><div className="work-meta"><span><Zap size={12} /> {work.stage}</span><span>{work.tools.join(" · ")}</span></div></div><button className="work-open">Open <ArrowUpRight size={14} /></button></div>)}</div>
      <div className="panel"><div className="panel-heading"><div><p className="section-kicker">YOUR CONTEXTS</p><h2>Recent projects</h2></div><button className="icon-btn"><Plus size={16} /></button></div>{recentProjects.map(project => <button className="project-item" key={project.name} onClick={() => setActive(project.name === "Personal Knowledge" ? "Knowledge" : "Projects")}><div className={`project-icon ${project.color}`}><project.icon size={17} /></div><div><strong>{project.name}</strong><p>{project.type}</p></div><span className="project-time">{project.meta}</span></button>)}<button className="add-project"><Plus size={15} /> Create a project</button></div></section>
    <section className="activity-strip"><div className="activity-title"><div className="activity-pulse"><Activity size={16} /></div><div><p className="section-kicker">RECENT ACTIVITY</p><strong>Hanna finished analyzing <span>Annual Business Report.pdf</span></strong></div></div><div className="activity-detail"><span><Check size={14} /> Completed</span><small>18 minutes ago</small></div><button className="icon-btn"><ArrowUpRight size={16} /></button></section>
  </div>
}

function Workspace({ title, messages, isWorking, route }: { title: string; messages: { role: "user" | "assistant"; text: string }[]; isWorking: boolean; route: { model: string; capability: string } }) {
  const [chatSearch, setChatSearch] = useState("");
  const [chatName, setChatName] = useState("New conversation");
  const [archived, setArchived] = useState(false);
  const [approved, setApproved] = useState(false);
  const description: Record<string, string> = { Hanna: "Your intelligent workspace for getting things done.", Projects: "Organize conversations, tasks, files and knowledge around meaningful work.", Tasks: "Long-running work, approvals and outcomes in one place.", Knowledge: "Give Hanna the context she needs to be more useful.", Files: "Your documents and generated assets, ready when you are.", "Apps & Integrations": "Connect the tools Hanna can use on your behalf.", "AI Models": "Choose how Hanna thinks, creates and routes work.", Marketing: "Turn ideas and knowledge into campaigns that move.", Commerce: "Understand and operate your commerce workspace.", Automations: "Build repeatable workflows with clear approvals.", Developer: "Repositories, environments and deployments.", Settings: "Shape how Hanna works for you." };
  if (title === "Settings") return <SettingsView />;
  if (title === "AI Models") return <ModelsView />;
  if (title === "Activity") return <ActivityView />;
  if (["Projects", "Tasks", "Knowledge", "Files"].includes(title)) return <CollectionView title={title} description={description[title]} />;
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> HANNA WORKSPACE</p><h1>{title}</h1><p>{description[title] || "A focused workspace for your next outcome."}</p></div><button className="outline-btn"><Plus size={15} /> New {title === "Hanna" ? "conversation" : "item"}</button></div>{title === "Hanna" ? <><div className="chat-history-strip"><div className="history-title"><Inbox size={15} /><strong>Conversations</strong></div><input aria-label="Search conversations" placeholder="Search conversations" value={chatSearch} onChange={e => setChatSearch(e.target.value)} /><button className="history-action" onClick={() => { setChatName("New conversation"); setArchived(false); }}> <Plus size={14} /> New</button><button className="history-action" onClick={() => setChatName(chatName === "New conversation" ? "Untitled workspace chat" : "New conversation")}>Rename</button><button className="history-action" onClick={() => setArchived(!archived)}>{archived ? "Restore" : "Archive"}</button></div><div className="history-results">{["Research brief · Today", "Liverton website · Yesterday", "Document analysis · Monday"].filter(item => item.toLowerCase().includes(chatSearch.toLowerCase())).map(item => <button key={item} onClick={() => setChatName(item)} className={chatName === item ? "history-item history-selected" : "history-item"}>{item}<MoreHorizontal size={13} /></button>)}{archived && <span className="archived-label">Archived: {chatName}</span>}</div><div className="chat-layout"><div className="chat-column">{messages.length === 0 ? <div className="empty-chat"><div className="empty-orb"><Sparkles size={27} /></div><h2>What should we work on?</h2><p>Ask Hanna to research, analyze, create, code, or manage something for you.</p><div className="suggestion-row"><button>Research a topic</button><button>Analyze a document</button><button>Plan a project</button></div></div> : <div className="messages">{messages.map((message, index) => <div className={message.role === "user" ? "message user-message" : "message assistant-message"} key={`${message.role}-${index}`}><div className="message-avatar">{message.role === "user" ? "AM" : <Sparkles size={14} />}</div><div className="message-body"><span className="message-label">{message.role === "user" ? "You" : "Hanna"}</span>{message.role === "assistant" ? <><MarkdownMessage content={message.text} /><div className="message-actions"><button onClick={() => navigator.clipboard?.writeText(message.text)}>Copy</button><button onClick={() => localStorage.setItem("hanna-saved-output", message.text)}>Save output</button></div></> : <p>{message.text}</p>}</div></div>)}</div>}{isWorking && <div className="working-indicator"><div className="message-avatar"><Sparkles size={14} /></div><span>Hanna is working</span><i /><i /><i /></div>}</div><aside className="agent-panel"><div className="agent-panel-header"><div><p className="section-kicker">OPERATIONS</p><h3>Hanna is ready</h3></div><span className="ready-dot" /></div><div className="route-card"><div className="route-header"><BrainCircuit size={15} /><span>Automatic routing</span><span className="route-state">Active</span></div><strong>{route.model}</strong><p>Selected for {route.capability.toLowerCase()}</p></div><p className="section-kicker activity-label">CURRENT ACTIVITY</p>{["Understanding request", "Searching Knowledge", "Selecting model", "Waiting for your request"].map((step, i) => <div className="agent-step" key={step}><span className={i === 3 ? "step-dot pending" : "step-dot"}>{i < 3 ? <Check size={11} /> : null}</span><span>{step}</span></div>)}<div className="tool-card"><Github size={15} /><span>GitHub</span><small>Connected</small></div><div className="tool-card"><Globe2 size={15} /><span>Web search</span><small>Available</small></div><div className="approval-card"><div><strong>Approval gate</strong><p>Consequential actions pause for your review.</p></div><button onClick={() => setApproved(!approved)}>{approved ? "Approved" : "Review"}</button></div></aside></div></> : <div className="workspace-empty"><div className="empty-icon"><LayoutGrid size={22} /></div><h2>Build your {title.toLowerCase()} workspace</h2><p>{description[title]}</p><button className="primary-btn"><Plus size={15} /> Get started</button></div>}</div>
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
  const connectedMap = new Map(connected.map(item => [item.provider, item]));
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
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> CONNECTIONS</p><h1>Provider keys</h1><p>Bring your own keys. Hanna uses them server-side and never sends them to the browser.</p></div><div className="settings-heading-actions"><div className="secure-badge"><Check size={14} /> Backend protected</div><button className="outline-btn" onClick={() => setModalOpen(true)}>Manage keys</button></div></div>{!user && <div className="login-note"><Inbox size={17} /><div><strong>Sign in to save provider keys</strong><p>Keys are tied to your account and encrypted at rest. You can still explore the catalog below.</p></div><button className="outline-btn" onClick={() => startLogin()}>Sign in</button></div>}{notice && <div className="success-note"><Check size={15} /> {notice}<button className="icon-btn" onClick={() => setNotice("")}><X size={14} /></button></div>}{modalOpen ? <div className="settings-modal-overlay" role="dialog" aria-modal="true" aria-label="API key settings"><div className="settings-modal"><div className="settings-modal-header"><div><span className="section-kicker">SECURE VAULT</span><h2>Manage API keys</h2></div><button className="icon-btn" onClick={() => setModalOpen(false)} aria-label="Close settings"><X size={16} /></button></div><p className="settings-modal-copy">Keys are encrypted on the backend and only a masked hint is shown after saving.</p><div className="provider-grid">{catalog.map(provider => { const current = connectedMap.get(provider.id); return <div className="provider-card" key={provider.id}><div className="provider-card-header"><div className="provider-avatar"><BrainCircuit size={16} /></div><div><strong>{provider.name}</strong><span>{provider.category}</span></div><span className={current ? "connected-status" : "disconnected-status"}>{current ? "Connected" : "Not connected"}</span></div>{provider.id === "custom" && <label className="key-label">Provider name<input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="My provider" /></label>}<label className="key-label">{provider.id === "custom" ? "Endpoint URL" : "API key"}{provider.id === "custom" && <input type="url" value={endpoints[provider.id] || ""} onChange={e => setEndpoints(prev => ({ ...prev, [provider.id]: e.target.value }))} placeholder="https://api.example.com/v1/chat/completions" />}<input type="password" value={keys[provider.id] || ""} onChange={e => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))} placeholder={current ? `Saved ${current.keyHint}` : provider.placeholder} autoComplete="new-password" /></label><div className="provider-actions"><button className="primary-small" disabled={!user || !keys[provider.id] || save.isPending} onClick={() => saveKey(provider)}>{save.isPending ? "Saving…" : "Save key"}</button>{current && <><button className="remove-small" onClick={() => removeKey(provider.id)}>Disconnect</button><button className="test-small" onClick={async () => { const result = await testConnection.mutateAsync({ provider: provider.id }); setNotice(result.message); }}>{testConnection.isPending ? "Testing…" : "Test"}</button></>}</div></div>; })}</div></div></div> : <div className="settings-placeholder"><div className="empty-icon"><KeyRound size={20} /></div><h2>Your API keys are protected</h2><p>Open the key vault to connect your own models and tools.</p><button className="primary-btn" onClick={() => setModalOpen(true)}>Open key vault</button></div>}</div>;
}

function ModelsView() {
  const models = [
    { name: "Gemini", model: "Gemini 3 Flash", detail: "Fast multimodal reasoning", status: "Connected", color: "blue" },
    { name: "OpenAI", model: "GPT-5 Mini", detail: "Structured analysis and writing", status: "Available", color: "green" },
    { name: "Claude", model: "Claude Sonnet 4.6", detail: "Coding and deep reasoning", status: "Available", color: "violet" },
    { name: "Future providers", model: "Bring your own model", detail: "The routing layer is extensible", status: "Coming soon", color: "gray" },
  ];
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> INTELLIGENCE LAYER</p><h1>AI Models</h1><p>Hanna chooses the right capability for each request.</p></div><button className="outline-btn"><Plus size={15} /> Connect provider</button></div><div className="model-grid">{models.map(model => <div className="model-card" key={model.name}><div className={`model-logo ${model.color}`}><BrainCircuit size={19} /></div><div className="model-card-copy"><div className="model-card-top"><strong>{model.name}</strong><span>{model.status}</span></div><h3>{model.model}</h3><p>{model.detail}</p></div><button className="icon-btn"><MoreHorizontal size={16} /></button></div>)}</div><div className="routing-note"><div className="command-icon"><Sparkles size={17} /></div><div><strong>Automatic model selection is on</strong><p>Hanna routes work by capability, context and task type. You can override this from the composer.</p></div><button className="text-button">Routing settings <ArrowUpRight size={14} /></button></div></div>;
}

function ActivityView() {
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR TIMELINE</p><h1>Activity</h1><p>A clear history of what Hanna has done across your workspace.</p></div><button className="outline-btn"><Search size={15} /> Filter</button></div><div className="activity-list">{[{icon: Check, title: "Finished analyzing Annual Business Report.pdf", detail: "Knowledge · 18 minutes ago", color: "green"}, {icon: Github, title: "Connected GitHub to Hanna Development", detail: "Apps & Integrations · Yesterday", color: "blue"}, {icon: FileText, title: "Created quarterly knowledge digest", detail: "Liverton Business · Yesterday", color: "violet"}].map(item => <div className="timeline-item" key={item.title}><div className={`timeline-icon ${item.color}`}><item.icon size={16} /></div><div><strong>{item.title}</strong><p>{item.detail}</p></div><ArrowUpRight size={15} className="muted" /></div>)}</div></div>;
}

function CollectionView({ title, description }: { title: string; description?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const cards = title === "Knowledge" ? ["Personal Knowledge", "Liverton Business", "Research"] : title === "Files" ? ["Annual Business Report.pdf", "Brand Guidelines.docx", "Campaign brief.pdf"] : title === "Tasks" ? ["Website authentication", "Quarterly knowledge digest", "Campaign launch"] : ["Hanna Development", "Liverton Learning", "New workspace"];
  const Icon = title === "Files" ? FileText : title === "Tasks" ? ListTodo : title === "Knowledge" ? Library : FolderKanban;
  return <div className="page workspace-page"><div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> HANNA WORKSPACE</p><h1>{title}</h1><p>{description}</p></div><button className="outline-btn"><Plus size={15} /> New {title === "Files" ? "upload" : title === "Knowledge" ? "space" : title.slice(0, -1).toLowerCase()}</button></div><div className="collection-grid">{cards.map((card, index) => <button type="button" className="collection-card" key={card} onClick={() => setSelected(card)}><div className={`collection-icon c-${index}`}><Icon size={18} /></div><div><strong>{card}</strong><p>{title === "Files" ? "Ready · 2.4 MB" : title === "Tasks" ? "Working · 67% complete" : title === "Knowledge" ? "12 sources · Updated today" : "Workspace · Updated recently"}</p></div><ArrowUpRight size={15} className="muted" /></button>)}</div>{selected && <div className="deferred-dialog" role="dialog" aria-modal="true"><div className="deferred-dialog-card"><button className="icon-btn dialog-close" onClick={() => setSelected(null)} aria-label="Close"><X size={16} /></button><div className="empty-icon"><Icon size={20} /></div><h2>{selected}</h2><p>Hanna has this workspace ready. Detailed editing and connected data will be available in the next build.</p><button className="primary-btn" onClick={() => setSelected(null)}>Got it</button></div></div>}</div>;
}

function Composer({ prompt, setPrompt, submit, isWorking }: { prompt: string; setPrompt: (value: string) => void; submit: (e?: FormEvent) => void; isWorking: boolean }) {
  const [attachment, setAttachment] = useState<File | null>(null);
  return <form className="composer-dock" onSubmit={submit}><div className="composer-inner"><div className="composer-input">{attachment && <div className="attachment-chip"><Paperclip size={12} /> {attachment.name}<button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment"><X size={12} /></button></div>}<textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Ask Hanna to research, build, analyze, create, automate or manage something..." rows={1} /><div className="composer-bottom"><div className="composer-left"><label className="attachment-button" aria-label="Attach a file"><Paperclip size={16} /><input type="file" hidden onChange={event => setAttachment(event.target.files?.[0] || null)} /></label><button type="button"><span className="model-dot" /> Auto <ChevronDown size={13} /></button><button type="button"><span className="context-dot" /> Personal <ChevronDown size={13} /></button></div><div className="composer-right"><span className="composer-hint">Enter to send</span><button className="send-button" type="submit" disabled={!prompt.trim() && !isWorking}>{isWorking ? <Square size={14} fill="currentColor" /> : <Send size={15} />}</button></div></div></div></div></form>
}
