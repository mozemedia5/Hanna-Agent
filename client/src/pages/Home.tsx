/*
 * Hanna — Main App Shell (restored functional build)
 * Auth-gated workspace, model picker, chat, schedule, plugins.
 * Suggested prompt chips removed by design.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import MarkdownMessage from "@/components/MarkdownMessage";
import SettingsPage from "./SettingsPage";
import IntegrationsPage from "./IntegrationsPage";
import ScheduleTaskPage from "./ScheduleTaskPage";
import UpgradePage from "./UpgradePage";
import UsagePage from "./UsagePage";
import ProjectsPage from "./ProjectsPage";
import ContributorsPage from "./ContributorsPage";
import NotificationsPage from "./NotificationsPage";
import ProfilePage from "./ProfilePage";
import { Link } from "wouter";
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  FolderKanban,
  LogOut,
  Menu,
  Plus,
  PlugZap,
  Send,
  Settings,
  Sparkles,
  Users,
  X,
  FileText,
  ShieldCheck,
} from "lucide-react";

type Page =
  | "chat"
  | "settings"
  | "integrations"
  | "notifications"
  | "profile"
  | "upgrade"
  | "usage"
  | "contributors"
  | "projects"
  | "schedule";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
};

type Chat = { id: number; title: string; messages: Message[] };

const HANNA_MODELS = [
  { id: "Hanna Lite", label: "Hanna Lite", desc: "Fast everyday chat (Gemini)" },
  { id: "Hanna Pro", label: "Hanna Pro", desc: "Deeper reasoning (Gemini)" },
  { id: "Hanna Fast", label: "Hanna Fast", desc: "Ultra-low latency responses" },
  { id: "Hanna Instant", label: "Hanna Instant", desc: "Snappy short answers" },
  { id: "Hanna Advanced", label: "Hanna Advanced", desc: "Complex multi-step tasks" },
  { id: "Hanna Presentation", label: "Hanna Presentation", desc: "Slide decks & structured outlines" },
  { id: "Hanna Image", label: "Hanna Image", desc: "Image prompts & visual briefs" },
  { id: "Hanna Video", label: "Hanna Video", desc: "Video scripts & storyboards" },
] as const;

export default function Home({
  user,
  onLogout,
}: {
  user?: User | null;
  onLogout?: () => Promise<void>;
}) {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const [chats, setChats] = useState<Chat[]>([
    { id: 0, title: "New conversation", messages: [] },
  ]);
  const [activeChatId, setActiveChatId] = useState(0);
  const [composer, setComposer] = useState("");
  const [model, setModel] = useState("Hanna Lite");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = useMemo(
    () => chats.find(c => c.id === activeChatId) ?? chats[0],
    [activeChatId, chats]
  );
  const hasMessages = activeChat.messages.length > 0;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const saved = localStorage.getItem("hanna-theme") as "light" | "dark" | "system" | null;
    const next = saved ?? "dark";
    setTheme(next);
    const effective =
      next === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : next;
    document.documentElement.classList.toggle("dark", effective === "dark");
    document.documentElement.classList.toggle("light", effective === "light");
  }, []);

  const showToast = (m: string) => setToast(m);

  const createChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "Untitled conversation",
      messages: [],
    };
    setChats(c => [newChat, ...c]);
    setActiveChatId(newChat.id);
    setCurrentPage("chat");
    setComposer("");
    showToast("New conversation ready");
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const submitMessage = async () => {
    const text = composer.trim();
    if (!text || isThinking) return;
    const chatId = activeChatId;
    const current = chats.find(c => c.id === chatId) ?? activeChat;
    const title =
      current.messages.length === 0
        ? text.slice(0, 36)
        : current.title;

    const userMessage: Message = {
      id: `${chatId}-u-${Date.now()}`,
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChats(cs =>
      cs.map(c =>
        c.id === chatId
          ? { ...c, title, messages: [...c.messages, userMessage] }
          : c
      )
    );
    setComposer("");
    setIsThinking(true);

    try {
      const token = await getFirebaseIdToken();
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/trpc/hanna.ask?batch=1", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          "0": {
            json: {
              prompt: text,
              model,
              agenticMode: false,
            },
          },
        }),
      });

      let reply =
        "I could not complete that request. Please try again or switch model.";
      if (res.ok) {
        const json = await res.json();
        const data =
          json?.[0]?.result?.data?.json ??
          json?.[0]?.result?.data ??
          json?.result?.data ??
          json;
        reply = data?.text || data?.message || reply;
      } else if (res.status === 401) {
        reply = "Please sign in again to use Hanna AI.";
      } else if (res.status === 429) {
        reply =
          "Daily credit limit reached. Upgrade your plan or try again tomorrow.";
      }

      const assistantMessage: Message = {
        id: `${chatId}-a-${Date.now()}`,
        role: "assistant",
        content: reply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChats(cs =>
        cs.map(c =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } catch {
      const assistantMessage: Message = {
        id: `${chatId}-a-${Date.now()}`,
        role: "assistant",
        content: "Network error talking to Hanna. Please retry.",
      };
      setChats(cs =>
        cs.map(c =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  const nav = [
    { icon: Plus, label: "New task", action: createChat, page: "chat" as Page },
    { icon: Calendar, label: "Schedule Task", page: "schedule" as Page },
    { icon: FolderKanban, label: "Projects", page: "projects" as Page },
    { icon: Sparkles, label: "Upgrade Plan", page: "upgrade" as Page },
    { icon: Users, label: "Contributors", page: "contributors" as Page },
    { icon: PlugZap, label: "Plugins", page: "integrations" as Page },
    { icon: Bell, label: "Notifications", page: "notifications" as Page },
    { icon: Settings, label: "Settings", page: "settings" as Page },
  ];

  const renderPage = () => {
    if (currentPage === "settings")
      return (
        <SettingsPage
          theme={theme}
          onThemeChange={t => {
            setTheme(t);
            localStorage.setItem("hanna-theme", t);
          }}
          onBack={() => setCurrentPage("chat")}
        />
      );
    if (currentPage === "integrations")
      return <IntegrationsPage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "schedule")
      return <ScheduleTaskPage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "upgrade")
      return <UpgradePage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "usage")
      return <UsagePage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "projects")
      return <ProjectsPage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "contributors")
      return <ContributorsPage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "notifications")
      return <NotificationsPage onBack={() => setCurrentPage("chat")} />;
    if (currentPage === "profile")
      return (
        <ProfilePage
          onLogout={() => {
            void onLogout?.();
          }}
          onNavigateToSettings={() => setCurrentPage("settings")}
          onNavigateToUpgrade={() => setCurrentPage("upgrade")}
          onNavigateToUsage={() => setCurrentPage("usage")}
          onBack={() => setCurrentPage("chat")}
        />
      );

    return (
      <div className="workspace-body custom-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            className="icon-button"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setModelMenuOpen(o => !o)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <Sparkles size={14} />
              <span>{model}</span>
              <ChevronDown size={14} />
            </button>
            {modelMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  zIndex: 40,
                  minWidth: 280,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
                }}
              >
                {HANNA_MODELS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModel(m.id);
                      setModelMenuOpen(false);
                      showToast(`Model switched to ${m.label}`);
                    }}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderRadius: 8,
                      background:
                        model === m.id ? "var(--wash)" : "transparent",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    <span>
                      <strong style={{ display: "block", fontSize: 13 }}>
                        {m.label}
                      </strong>
                      <small style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                        {m.desc}
                      </small>
                    </span>
                    {model === m.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflow: "auto", padding: "24px 16px" }}>
          {!hasMessages ? (
            <div style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Clean Command Interface
              </div>
              <h1 style={{ fontSize: 28, marginBottom: 8 }}>What needs to be done?</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Use Hanna to automate store growth, research, coding, and creative work.
                No suggested chips — just type your task.
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gap: 16 }}>
              {activeChat.messages.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "12px 14px",
                      borderRadius: 14,
                      background:
                        m.role === "user"
                          ? "var(--surface-raised)"
                          : "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownMessage content={m.content} />
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
                        {m.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
                  Hanna is thinking…
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "12px 16px 20px",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              maxWidth: 820,
              margin: "0 auto",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "10px 12px",
              background: "var(--surface-raised)",
            }}
          >
            <textarea
              ref={composerRef}
              value={composer}
              onChange={e => setComposer(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitMessage();
                }
              }}
              placeholder="Message Hanna…"
              rows={2}
              style={{
                flex: 1,
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: 14,
                lineHeight: 1.45,
              }}
            />
            <button
              type="button"
              onClick={() => void submitMessage()}
              disabled={isThinking || !composer.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "none",
                background: "var(--text-primary)",
                color: "var(--surface)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                opacity: isThinking || !composer.trim() ? 0.5 : 1,
              }}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg, #0b0f14)",
        color: "var(--text-primary, #e8eef7)",
      }}
    >
      <aside
        style={{
          width: sidebarOpen ? 260 : 0,
          overflow: "hidden",
          transition: "width 0.2s ease",
          borderRight: sidebarOpen ? "1px solid var(--border)" : "none",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/hanna-icon-192.png" alt="Hanna" width={28} height={28} style={{ borderRadius: 8 }} />
          <strong>Hanna</strong>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer" }}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>
        <nav style={{ padding: "0 10px", display: "grid", gap: 4 }}>
          {nav.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.action) item.action();
                else setCurrentPage(item.page);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background:
                  currentPage === item.page && !item.action
                    ? "var(--wash)"
                    : "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
            {user?.email || "Signed in"}
          </div>
          <button
            type="button"
            onClick={() => onLogout?.()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 12px",
              color: "inherit",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Legal Links Footer */}
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-around", fontSize: "11px" }}>
          <Link href="/privacypolicy" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <span style={{ color: "var(--border)" }}>•</span>
          <Link href="/terms" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
            Terms of Service
          </Link>
        </div>

        <div style={{ padding: "8px 12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6 }}>Recent</div>
          {chats.slice(0, 8).map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveChatId(c.id);
                setCurrentPage("chat");
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                background: activeChatId === c.id ? "var(--wash)" : "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.title}
            </button>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {renderPage()}
      </main>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
          }}
        >
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
