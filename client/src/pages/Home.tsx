/*
 * Hanna — Main App Shell
 * Layout with sidebar, page routing, and profile popup.
 */
import { Button } from "@/components/ui/button";
import {
  Archive,
  ArrowLeft,
  ArrowUp,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  FolderKanban,
  FolderPlus,
  FolderUp,
  Globe2,
  GraduationCap,
  ImageIcon,
  Layers3,
  LogOut,
  Megaphone,
  Menu,
  Mic,
  MoreVertical,
  Paperclip,
  PlugZap,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  Store,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
  CreditCard,
  Gift,
  HelpCircle,
  TrendingUp,
  Bot,
} from "lucide-react";
import MarkdownMessage from "@/components/MarkdownMessage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import type { User } from "firebase/auth";
import {
  deleteUserConversation,
  listUserConversations,
  saveUserConversation,
  type ClientConversation,
} from "@/lib/firestore";

import SettingsPage from "./SettingsPage";
import IntegrationsPage from "./IntegrationsPage";
import NotificationsPage from "./NotificationsPage";
import ProfilePage from "./ProfilePage";
import UpgradePage from "./UpgradePage";
import UsagePage from "./UsagePage";
import ContributorsPage from "./ContributorsPage";
import ProjectsPage, { type Project } from "./ProjectsPage";
import ScheduleTaskPage from "./ScheduleTaskPage";
import FilesPage, { addStoredFiles, getFileTypeBadgeLabel, type StoredFileItem } from "./FilesPage";
import { useChatWorkflow } from "@/hooks/useChatWorkflow";
import { Users, Share2 } from "lucide-react";
import { renderBrandIcon } from "@/components/ProviderIcons";
import InstallAppBanner from "@/components/InstallAppBanner";

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
  | "schedule"
  | "files";

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
  attachments?: UploadedFile[];
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
  const [agenticMode, setAgenticMode] = useState(false);
  const [selectedTools, setSelectedTools] = useState<ToolKey[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [modelSubMenuOpen, setModelSubMenuOpen] = useState(false);
  const [model, setModel] = useState("Hanna Lite (default)");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [deepThinkMode, setDeepThinkMode] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [shareEmails, setShareEmails] = useState("");
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [apiStatusMsg, setApiStatusMsg] = useState<string>("");

  // Modals for Header Vertical Menu Options
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [showAddToProjectModal, setShowAddToProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState("Default Workspace");
  const [showFindModal, setShowFindModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScheduleTaskModal, setShowScheduleTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskRepeat, setTaskRepeat] = useState<"once" | "daily" | "weekly" | "monthly">("once");
  const [taskTools, setTaskTools] = useState<string[]>(["Web Search"]);

  // Lightbox Modal for full-resolution view of uploaded images
  const [lightboxImageUrl, setLightboxModalImageUrl] = useState<string | null>(null);

  // Workspace Live Credits & Top-Up Modal State
  const [userCredits, setUserCredits] = useState<number>(() => {
    const stored = localStorage.getItem("hanna_user_credits");
    return stored !== null ? Number(stored) : 500;
  });
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    localStorage.setItem("hanna_user_credits", String(userCredits));
  }, [userCredits]);

  // Confirmatory Delete Chat Modal
  const [deleteChatId, setDeleteChatId] = useState<number | null>(null);

  // SpeechSynthesis active message & audio player state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem("hanna_voice_choice") || "Hanna (Natural) - Female";
  });

  const [userBubbleColor, setUserBubbleColor] = useState<string>(() => {
    return localStorage.getItem("hanna_user_bubble_color") || "cream";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setUserBubbleColor(localStorage.getItem("hanna_user_bubble_color") || "cream");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) ?? chats[0], [activeChatId, chats]);
  const hasMessages = activeChat.messages.length > 0;

  const chatWorkflow = useChatWorkflow();

  // Dynamic ~5-word status messages when AI is working
  const thinkingAction = useMemo(() => {
    if (chatWorkflow.toolLogs.length > 0) {
      const last = chatWorkflow.toolLogs[chatWorkflow.toolLogs.length - 1];
      const conn = last.connector.toLowerCase();
      if (conn.includes("gmail")) return "Visiting Gmail and available tools...";
      if (conn.includes("heygen")) return "Connecting to HeyGen and tools...";
      if (conn.includes("shopify")) return "Analyzing Shopify store data now...";
      return `Executing ${last.connector} ${last.action}...`;
    }
    if (chatWorkflow.status === "executing_route_b") return "Searching web and workspace tools...";
    if (chatWorkflow.status === "pivoted_to_route_b") return "Searching web and workspace tools...";
    if (chatWorkflow.status === "streaming_route_a") return "Synthesizing response from tools...";
    if (selectedTools.includes("Web Search") || webSearchMode) return "Searching web for available context...";
    if (selectedTools.includes("Deep Research") || deepThinkMode) return "Performing deep research and analysis...";
    return "Analyzing query & workspace context...";
  }, [chatWorkflow.status, chatWorkflow.toolLogs, selectedTools, webSearchMode, deepThinkMode]);

  useEffect(() => {
    fetch("/api/health")
      .then(r => {
        if (!r.ok) throw new Error("API check failed");
        return r.json();
      })
      .then(data => {
        if (data.status === "AI_READY") {
          setApiHealthy(true);
        } else {
          setApiHealthy(false);
          setApiStatusMsg(`API Health: ${data.details || data.status}`);
        }
      })
      .catch(() => {
        setApiHealthy(false);
        setApiStatusMsg("Hanna API unavailable. Check the production deployment.");
      });
  }, []);

  // Load saved conversations on mount from localStorage and Firestore
  useEffect(() => {
    let localChats: Chat[] = [];
    try {
      const raw = localStorage.getItem("hanna_saved_chats");
      if (raw) localChats = JSON.parse(raw);
    } catch {
      // Ignore
    }

    void listUserConversations().then(stored => {
      const formatted = stored.map(chat => ({ ...chat, id: Number(chat.id) || Date.now() + Math.random() }));
      const mergedMap = new Map<number | string, Chat>();
      localChats.forEach(c => mergedMap.set(c.id, c));
      formatted.forEach(c => mergedMap.set(c.id, c));
      const combined = Array.from(mergedMap.values());
      if (combined.length > 0) {
        setChats(combined);
        setActiveChatId(combined[0].id);
      }
    }).catch(() => {
      if (localChats.length > 0) {
        setChats(localChats);
        setActiveChatId(localChats[0].id);
      }
    });
  }, []);

  // Persist conversations to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      try {
        localStorage.setItem("hanna_saved_chats", JSON.stringify(chats));
      } catch {
        // Ignore quota error
      }
    }
  }, [chats]);

  useEffect(() => {
    const saved = localStorage.getItem("hanna-theme") as "light" | "dark" | "system" | null;
    const next = saved ?? "dark";
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
      if (headerMenuOpen && !(e.target as HTMLElement).closest(".header-menu-container")) {
        setHeaderMenuOpen(false);
      }
      if (plusMenuOpen && !(e.target as HTMLElement).closest(".plus-menu-container")) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfilePopup, headerMenuOpen, plusMenuOpen]);

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

  const confirmDeleteChat = (id: number) => {
    setDeleteChatId(id);
  };

  const executeDeleteChat = (id: number) => {
    const remaining = chats.filter(c => c.id !== id);
    setChats(remaining);
    void deleteUserConversation(String(id)).catch(() => undefined);
    if (activeChatId === id) {
      if (remaining.length) {
        setActiveChatId(remaining[0].id);
      } else {
        createChat();
      }
    }
    setDeleteChatId(null);
    showToast("Chat deleted successfully");
  };

  const archiveChat = (id: number) => {
    showToast("Chat archived");
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

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFileList = (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    if (!files.length) return;

    const now = new Date();
    const uploadTimestamp = `Uploaded today at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    files.forEach(file => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isVid = file.type.startsWith("video/");
      const isAud = file.type.startsWith("audio/");
      const kind: UploadedFile["type"] = isImg ? "image" : isPdf ? "pdf" : isVid ? "video" : "other";
      const objectUrl = URL.createObjectURL(file);
      const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const mb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = Number(mb) < 0.1 ? `${Math.round(file.size / 1024)} KB` : `${mb} MB`;

      const item: UploadedFile = {
        id: fileId,
        name: file.name,
        type: kind,
        url: objectUrl,
        size: file.size,
      };

      setAttachments(prev => [...prev, item]);

      const reader = new FileReader();
      reader.onload = async e => {
        const base64Data = e.target?.result as string;
        item.dataUrl = base64Data;

        let finalUrl = objectUrl;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ file: base64Data, filename: file.name, folder: "hanna_user_uploads" }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              finalUrl = data.url;
              item.url = data.url;
              setAttachments(prev => prev.map(f => f.id === fileId ? { ...f, url: data.url } : f));
            }
          }
        } catch {
          // Keep local objectUrl fallback
        }

        let storeKind: StoredFileItem["type"] = "other";
        let storeCategory: StoredFileItem["category"] = "File";
        if (isImg) { storeKind = "image"; storeCategory = "Image"; }
        else if (isVid) { storeKind = "video"; storeCategory = "Video"; }
        else if (isAud) { storeKind = "audio"; storeCategory = "Audio"; }
        else if (isPdf) { storeKind = "pdf"; storeCategory = "Document"; }

        addStoredFiles([{
          id: fileId,
          type: storeKind,
          url: finalUrl,
          dataUrl: base64Data,
          size: sizeStr,
          uploadedAt: uploadTimestamp,
          category: storeCategory,
        }]);
      };
      reader.readAsDataURL(file);
    });

    showToast(`Uploaded ${files.length} file(s) to workspace`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFileList(event.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  // Auto-scroll chat window smoothly as new text generates or message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat.messages, chatWorkflow.streamingText, isThinking]);

  const submitMessage = async () => {
    if (userCredits <= 0) {
      showToast("Workspace credits depleted. Please top up your credits.");
      setShowTopUpModal(true);
      return;
    }

    const text = composer.trim();
    if ((!text && attachments.length === 0) || isThinking) return;
    const chatId = activeChatId;
    const sentAttachments = [...attachments];

    // Compute derived instant chat title
    const currentChat = chats.find(c => c.id === chatId) ?? activeChat;
    const snippet = (text || sentAttachments[0]?.name || "New Chat").trim().slice(0, 30);
    const capitalizedTitle = snippet.charAt(0).toUpperCase() + snippet.slice(1);
    const isNewChat = currentChat.title === "New conversation" || currentChat.title === "Untitled conversation" || currentChat.messages.length === 0;
    const updatedTitle = isNewChat ? capitalizedTitle : currentChat.title;

    const userMessage: Message = {
      id: `${chatId}-${Date.now()}`,
      role: "user",
      content: text,
      attachments: sentAttachments.length > 0 ? sentAttachments : undefined,
      tokenCount: estimateTokens(text || "Attachment"),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const attachSummary = sentAttachments.map(a => `[Attachment (metadata-only): ${a.name} (${a.type.toUpperCase()})]`).join("\n");
    const contentWithAttachments = text ? (attachSummary ? `${text}\n\n${attachSummary}` : text) : attachSummary;

    const chatWithUser = {
      ...currentChat,
      title: updatedTitle,
      messages: [...currentChat.messages, userMessage],
    };
    setChats(current => current.map(c => c.id === chatId ? chatWithUser : c));
    setComposer(""); setAttachments([]); setIsThinking(true);

    try {
      const isStudyMode = selectedTools.includes("Study");
      const attachmentContext = sentAttachments.length ? `\n[Attached (metadata-only): ${sentAttachments.map(a => `${a.name} (${a.type})`).join(", ")}]` : "";
      const toolsCtx = selectedTools.length ? `[Tools: ${selectedTools.join(", ")}]${isStudyMode ? " [STUDY MODE]" : ""}` : "";
      const projectCtx = activeProject
        ? `[ACTIVE PROJECT CONTEXT: "${activeProject.name}"]\nProject System Instructions: ${activeProject.instructions}\nProject Uploaded Files: ${activeProject.files.map(f => `${f.name} (${f.type})`).join(", ") || "None"}\n\n`
        : "";
      const fullPrompt = `${projectCtx}${toolsCtx}${attachmentContext}\n\n${contentWithAttachments}`;

      const historyContext = currentChat.messages
        .slice(-10)
        .map(m => `${m.role === "user" ? "User" : "Hanna"}: ${m.content}`)
        .join("\n\n");
      const combinedContext = historyContext
        ? `[Conversation History from Beginning]\n${historyContext}`
        : undefined;

      // Placeholder assistant message for streaming response
      const assistantMessageId = `${chatId}-assistant-${Date.now()}`;
      const placeholderAssistantMsg: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChats(current => current.map(c => c.id === chatId ? { ...c, messages: [...c.messages, placeholderAssistantMsg] } : c));

      const reply = await chatWorkflow.submitPrompt(fullPrompt, {
        context: combinedContext,
        model: model === "Custom" ? "custom" : model,
        agenticMode,
        studyMode,
      });

      const finalReplyContent = reply || chatWorkflow.streamingText || chatWorkflow.error;
      if (!finalReplyContent || !finalReplyContent.trim()) {
        throw new Error(chatWorkflow.error || "Hanna returned an empty response.");
      }

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: finalReplyContent,
        tokenCount: estimateTokens(finalReplyContent),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      let finalTitle = chatWithUser.title;
      if (
        (chatWithUser.title === "New conversation" || chatWithUser.title === "Untitled conversation" || chatWithUser.messages.length <= 2) &&
        reply.trim()
      ) {
        const titleSnippet = contentWithAttachments.slice(0, 30).trim() || reply.slice(0, 30).trim();
        if (titleSnippet) {
          finalTitle = titleSnippet.charAt(0).toUpperCase() + titleSnippet.slice(1);
        }
      }

      const completedChat = {
        ...chatWithUser,
        title: finalTitle,
        messages: [...chatWithUser.messages.filter(m => m.id !== assistantMessageId), assistantMessage],
      };
      setUserCredits(prev => Math.max(0, prev - 1));
      setChats(current => current.map(c => c.id === chatId ? completedChat : c));
      void saveUserConversation({ ...completedChat, id: String(completedChat.id) }).catch(() => undefined);
    } catch (reason) {
      const errorContent = reason instanceof Error ? reason.message : "Hanna API unavailable.";
      showToast(`Submission failed: ${errorContent}`);
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
    { icon: FolderUp, label: "Files", page: "files" as Page },
    { icon: Calendar, label: "Schedule Task", page: "schedule" as Page },
    { icon: FolderKanban, label: "Projects", page: "projects" as Page },
    { icon: Sparkles, label: "Upgrade Plan", page: "upgrade" as Page },
    { icon: Users, label: "Contributors", page: "contributors" as Page },
    { icon: PlugZap, label: "Plugins", page: "integrations" as Page },
    { icon: Bell, label: "Notifications", page: "notifications" as Page },
    { icon: Settings, label: "Settings", page: "settings" as Page },
  ];

  const renderChatPage = () => (
    <>
      <header className="workspace-header">
        <div className="header-leading" style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: "1 1 auto", marginRight: "12px" }}>
          {hasMessages ? (
            <button className="icon-button" onClick={createChat} aria-label="Back to new chat" style={{ flexShrink: 0 }}>
              <ArrowLeft size={18} />
            </button>
          ) : (
            <button className="icon-button" onClick={() => setSidebarOpen(c => !c)} aria-label="Toggle sidebar" style={{ flexShrink: 0 }}>
              <Menu size={18} />
            </button>
          )}

          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "240px",
              flexShrink: 1,
            }}
            title={activeChat.title}
          >
            {activeChat.title}
          </div>
        </div>

        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Credits pill button */}
          <button
            type="button"
            onClick={() => setShowTopUpModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              borderRadius: "9999px",
              background: "rgba(26, 115, 232, 0.12)",
              border: "1px solid rgba(26, 115, 232, 0.3)",
              color: "var(--gemini-accent)",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
            title="Click to Add Credits / Top Up Workspace"
          >
            <Zap size={13} />
            <span>{userCredits} Credits</span>
          </button>

          {/* New chat button in top header */}
          <button
            type="button"
            onClick={createChat}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Start a new conversation"
          >
            <Plus size={14} />
            <span>New</span>
          </button>

          {/* Header Upper Right Vertical Ellipsis Menu (...) */}
          <div className="header-menu-container" style={{ position: "relative" }}>
            <button
              type="button"
              className="icon-button"
              onClick={() => setHeaderMenuOpen(o => !o)}
              aria-label="Conversation options"
            >
              <MoreVertical size={18} />
            </button>

            {headerMenuOpen && (
              <div className="header-popover-menu">
                <button
                  type="button"
                  className="header-menu-item"
                  onClick={() => { setHeaderMenuOpen(false); setShowShareModal(true); }}
                >
                  <Share2 size={15} /> <span>Share chat</span>
                </button>

                <button
                  type="button"
                  className="header-menu-item"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setRenameTitle(activeChat.title);
                    setShowRenameModal(true);
                  }}
                >
                  <Edit3 size={15} /> <span>Rename chat</span>
                </button>

                <button
                  type="button"
                  className="header-menu-item"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setShowAddToProjectModal(true);
                  }}
                >
                  <FolderPlus size={15} /> <span>Add to project</span>
                </button>

                <button
                  type="button"
                  className="header-menu-item"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setShowFindModal(true);
                  }}
                >
                  <Search size={15} /> <span>Find in chat</span>
                </button>

                <button
                  type="button"
                  className="header-menu-item"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    navigate("schedule");
                  }}
                >
                  <Calendar size={15} /> <span>Schedule task</span>
                </button>

                <button
                  type="button"
                  className="header-menu-item"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    archiveChat(activeChat.id);
                  }}
                >
                  <Archive size={15} /> <span>Archive chat</span>
                </button>

                <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

                <button
                  type="button"
                  className="header-menu-item"
                  style={{ color: "#ea4335" }}
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    confirmDeleteChat(activeChat.id);
                  }}
                >
                  <Trash2 size={15} /> <span>Delete chat</span>
                </button>
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
                <p>Use Hanna to automate store growth, research, coding, and creative work — powered by first-party multimodal AI intelligence.</p>
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
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Multimodal commerce intelligence</span>
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
              {activeChat.messages.map((message, idx) => {
                const isLastAssistant = message.role === "assistant" && idx === activeChat.messages.length - 1;
                const isStreamingThisMsg = chatWorkflow.isProcessing && isLastAssistant;
                const displayContent = (isStreamingThisMsg && chatWorkflow.streamingText) ? chatWorkflow.streamingText : message.content;

                return (
                  <article className={`message-row ${message.role} ${message.role === "user" ? `user-accent-${userBubbleColor}` : ""}`} key={message.id}>
                    <div className="message-body">
                      <div className="message-meta" style={{ display: message.role === "assistant" ? "none" : "flex" }}>
                        <strong>You</strong>
                        <span>{message.time}</span>
                      </div>
                      {/* Attachment preview for user message - styled like input thumbnail badges with click-to-view */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments-preview" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", marginBottom: message.content ? "8px" : "0" }}>
                          {message.attachments.map(att => {
                            const badge = getFileTypeBadgeLabel(att.type);
                            return (
                              <div key={att.id} style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-raised)", display: "inline-flex", alignItems: "center" }}>
                                {att.type === "image" ? (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxModalImageUrl(att.dataUrl || att.url)}
                                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", position: "relative", display: "block" }}
                                    title="Click to view image"
                                  >
                                    <img
                                      src={att.dataUrl || att.url}
                                      alt="Uploaded asset"
                                      style={{ width: "64px", height: "56px", objectFit: "cover", display: "block", borderRadius: "10px", transition: "transform 0.15s ease" }}
                                    />
                                  </button>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", fontSize: "12px", color: "var(--text-primary)" }}>
                                    {att.type === "pdf" ? <FileText size={16} style={{ color: "#ea4335" }} /> : <Paperclip size={16} style={{ color: "var(--gemini-accent)" }} />}
                                    <span>{badge}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {displayContent || isStreamingThisMsg ? (
                        <div className="message-content">
                          {message.role === "assistant" ? (
                            <MarkdownMessage content={displayContent} isStreaming={isStreamingThisMsg} />
                          ) : (
                            displayContent.split("\n").map((p, i) => <p key={`${message.id}-${i}`}>{p}</p>)
                          )}
                        </div>
                      ) : null}

                      {message.role === "user" && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              showToast("Prompt copied");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-tertiary)",
                              cursor: "pointer",
                              padding: "2px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                            title="Copy prompt"
                            aria-label="Copy prompt"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      )}

                      {/* ChatGPT-style Source & Link Cards when web sources or links are present */}
                      {message.role === "assistant" && (message.content.includes("http://") || message.content.includes("https://") || message.content.includes("[Source")) && (
                        <div className="sources-card-grid" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "10px", padding: "6px 10px", fontSize: "11px", color: "var(--text-secondary)" }}>
                            <Globe2 size={13} style={{ color: "var(--gemini-accent)" }} />
                            <span>Sourced from Web & Knowledge Catalog</span>
                            <ExternalLink size={11} style={{ marginLeft: "4px", color: "var(--text-tertiary)" }} />
                          </div>
                        </div>
                      )}

                      {message.role === "assistant" && (
                        <div className="message-actions" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", opacity: 0.85, fontSize: "12px", color: "var(--text-secondary)" }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              showToast("Response copied");
                            }}
                            style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "2px 4px" }}
                            title="Copy response"
                            aria-label="Copy response"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => showToast("Response feedback recorded (Good)")}
                            style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "2px 4px" }}
                            title="Good response"
                            aria-label="Good response"
                          >
                            <ThumbsUp size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => showToast("Response feedback recorded (Bad)")}
                            style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "2px 4px" }}
                            title="Bad response"
                            aria-label="Bad response"
                          >
                            <ThumbsDown size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const lastUserMsg = activeChat.messages.filter(m => m.role === "user").pop();
                              if (lastUserMsg) {
                                chatWorkflow.submitPrompt(lastUserMsg.content);
                              } else {
                                showToast("Regenerating response...");
                              }
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "2px 4px" }}
                            title="Regenerate response"
                            aria-label="Regenerate response"
                          >
                            <RotateCcw size={13} />
                          </button>

                          <span style={{ fontSize: "11px", opacity: 0.7, padding: "0 2px" }}>1/1</span>

                          <span style={{ fontSize: "11px", opacity: 0.6, paddingLeft: "4px" }}>{message.time}</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {isThinking && !chatWorkflow.streamingText && (
                <article className="message-row assistant thinking-row">
                  <div className="message-body">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500", marginTop: "4px" }}>
                      <span className="rotating-ellipsis-icon" title="Hanna working...">
                        <MoreVertical size={16} />
                      </span>
                      <span>{thinkingAction}</span>
                    </div>
                  </div>
                </article>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      <div
        className="composer-region"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: "relative",
          border: isDraggingOver ? "2px dashed var(--gemini-accent)" : "none",
          borderRadius: "16px",
          transition: "all 0.15s ease",
        }}
      >
        {isDraggingOver && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(26, 115, 232, 0.12)", backdropFilter: "blur(4px)", zIndex: 1000, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gemini-accent)", fontWeight: "700", fontSize: "14px" }}>
            <FolderUp size={24} style={{ marginRight: "8px" }} /> Drop files here to upload to workspace
          </div>
        )}

        {/* Hidden inputs for File, Document, and Camera uploads supporting multiple file selection */}
        <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} multiple accept="image/*,audio/*,video/*" />
        <input type="file" ref={docInputRef} style={{ display: "none" }} onChange={handleFileUpload} multiple accept=".pdf,.csv,.doc,.docx,.txt,.json,.md" />
        <input type="file" ref={cameraInputRef} style={{ display: "none" }} onChange={handleFileUpload} multiple capture="environment" accept="image/*" />


        <div className="command-center-container">
          {attachments.length > 0 && (
            <div className="composer-attachments-preview" style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "8px 0" }}>
              {attachments.map(file => {
                const badge = getFileTypeBadgeLabel(file.type);
                return (
                  <div key={file.id} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    {file.type === "image" ? (
                      <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", width: "56px", height: "56px", background: "var(--surface-raised)" }}>
                        <img src={file.dataUrl || file.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => removeAttachment(file.id)} className="attachment-chip-remove" style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)", color: "#fff", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Remove image"><X size={11} /></button>
                      </div>
                    ) : (
                      <div className="attachment-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "10px", background: "var(--surface-raised)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-primary)" }}>
                        {file.type === "pdf" ? <FileText size={14} style={{ color: "#ea4335" }} /> : <Paperclip size={14} style={{ color: "var(--gemini-accent)" }} />}
                        <span className="attachment-chip-name">{badge}</span>
                        <button type="button" onClick={() => removeAttachment(file.id)} className="attachment-chip-remove" aria-label="Remove attachment"><X size={12} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="command-center-inner">
            {/* Left Action: Plus Menu Popover */}
            <div className="plus-menu-container" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className={`plus-circle-button ${plusMenuOpen ? "is-active" : ""}`}
                onClick={() => setPlusMenuOpen(o => !o)}
                aria-label="Add file or tool option"
              >
                <Plus size={18} />
              </button>

              {plusMenuOpen && (
                <div className="plus-popover-menu" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 100 }}>
                  <div className="plus-menu-group-title">Media & Documents</div>
                  <button
                    type="button"
                    className="plus-menu-item"
                    onClick={() => { setPlusMenuOpen(false); cameraInputRef.current?.click(); }}
                  >
                    <Camera size={16} /> <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    className="plus-menu-item"
                    onClick={() => { setPlusMenuOpen(false); fileInputRef.current?.click(); }}
                  >
                    <FolderUp size={16} /> <span>Upload Files</span>
                  </button>

                  <button
                    type="button"
                    className="plus-menu-item"
                    onClick={() => { setPlusMenuOpen(false); docInputRef.current?.click(); }}
                  >
                    <FileText size={16} /> <span>Upload Documents</span>
                  </button>

                  <button
                    type="button"
                    className="plus-menu-item"
                    onClick={() => { setPlusMenuOpen(false); navigate("integrations"); }}
                  >
                    <PlugZap size={16} /> <span>Plugins / Extensions</span>
                  </button>

                  <div className="plus-menu-divider" />
                  <div className="plus-menu-group-title">Intelligence Modes</div>

                  <button
                    type="button"
                    className={`plus-menu-item toggle-item ${agenticMode ? "is-enabled" : ""}`}
                    onClick={() => {
                      setAgenticMode(a => !a);
                      showToast(agenticMode ? "Agentic loop disabled" : "Agentic Loop Enabled");
                    }}
                  >
                    <Bot size={16} />
                    <span>Agent Invocation</span>
                    <span className="toggle-indicator">{agenticMode ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    type="button"
                    className={`plus-menu-item toggle-item ${webSearchMode ? "is-enabled" : ""}`}
                    onClick={() => {
                      setWebSearchMode(w => !w);
                      toggleTool("Web Search");
                    }}
                  >
                    <Globe2 size={16} />
                    <span>Web Search</span>
                    <span className="toggle-indicator">{webSearchMode ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    type="button"
                    className={`plus-menu-item toggle-item ${deepThinkMode ? "is-enabled" : ""}`}
                    onClick={() => {
                      setDeepThinkMode(d => !d);
                      toggleTool("Deep Research");
                    }}
                  >
                    <Brain size={16} />
                    <span>Deep Think</span>
                    <span className="toggle-indicator">{deepThinkMode ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    type="button"
                    className={`plus-menu-item toggle-item ${studyMode ? "is-enabled" : ""}`}
                    onClick={() => {
                      setStudyMode(s => !s);
                      toggleTool("Study");
                    }}
                  >
                    <GraduationCap size={16} />
                    <span>Study Mode</span>
                    <span className="toggle-indicator">{studyMode ? "ON" : "OFF"}</span>
                  </button>

                  <div className="plus-menu-divider" />

                  {/* Models item that triggers nested models sub-container */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="plus-menu-item"
                      onClick={() => setModelSubMenuOpen(prev => !prev)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={16} />
                        <span>Models ({model.split(" ")[0]})</span>
                      </div>
                      <ChevronRight size={14} />
                    </button>

                    {modelSubMenuOpen && (
                      <div className="models-sub-menu custom-scroll">
                        <div className="plus-menu-group-title" style={{ padding: "4px 8px" }}>Hanna AI Models</div>
                        {[
                          { id: "Hanna Lite (default)", label: "Hanna Lite (default)", desc: "Fast & lightweight intelligence" },
                          { id: "Hanna Pro", label: "Hanna Pro", desc: "Deep reasoning & multimodal research" },
                          { id: "Hanna Groq GPT-OSS 120B", label: "Hanna Groq GPT-OSS 120B", desc: "Advanced logic & code generation" },
                          { id: "Hanna Groq Llama 3.3 70B", label: "Hanna Groq Llama 3.3 70B", desc: "High reasoning, technical text & coding" },
                          { id: "Hanna Groq Qwen 3.8 27B", label: "Hanna Groq Qwen 3.8 27B", desc: "Multilingual coding & analytical text" },
                          { id: "Hanna Groq DeepSeek V3.1", label: "Hanna Groq DeepSeek V3.1", desc: "Math, STEM & heavy code synthesizing" },
                          { id: "Hanna Groq Llama 3.1 8B", label: "Hanna Groq Llama 3.1 8B", desc: "Lightning-fast coding & structured text" },
                          { id: "Hanna Vision & Research", label: "Hanna Vision & Research", desc: "Advanced visual & document intelligence" },
                          { id: "Hanna Enterprise", label: "Hanna Enterprise", desc: "Maximum capacity & high precision" },
                        ].map(mOption => (
                          <button
                            key={mOption.id}
                            type="button"
                            className={`plus-menu-item ${model === mOption.id ? "is-enabled" : ""}`}
                            onClick={() => {
                              setModel(mOption.id);
                              setModelSubMenuOpen(false);
                              setPlusMenuOpen(false);
                              showToast(`Model switched to ${mOption.label}`);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              background: model === mOption.id ? "var(--wash)" : "transparent",
                              cursor: "pointer",
                              border: "none",
                              width: "100%",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                              <strong style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{mOption.label}</strong>
                              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{mOption.desc}</span>
                            </div>
                            {model === mOption.id && <Check size={14} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Project Banner/Chip if selected */}
            {activeProject && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", marginBottom: "6px", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <FolderKanban size={14} style={{ color: "var(--gemini-accent)" }} />
                <span>Active Project Context: <strong>{activeProject.name}</strong></span>
                <button onClick={() => setActiveProject(null)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", marginLeft: "auto", padding: 0 }} title="Clear project context">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Textarea Area */}
            <textarea
              ref={composerRef}
              value={composer}
              onChange={e => {
                setComposer(e.target.value);
                // Auto-adjust height up to max 6 lines (~144px)
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
              }}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask Hanna anything..."
              rows={1}
              className="command-textarea custom-scroll"
              aria-label="Message Hanna"
            />

            {/* Right Action: Submit / Stop Button */}
            <div className="command-right-actions">
              {isThinking ? (
                <button
                  type="button"
                  className="command-submit-button state-generating"
                  onClick={() => {
                    setIsThinking(false);
                    showToast("Generation stopped");
                  }}
                  title="Stop generating"
                  aria-label="Stop response"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  className={`command-submit-button ${
                    composer.trim() || attachments.length > 0
                      ? "state-active"
                      : "state-idle"
                  }`}
                  onClick={submitMessage}
                  disabled={!composer.trim() && attachments.length === 0}
                  aria-label="Send message"
                >
                  <ArrowUp size={16} strokeWidth={2.4} />
                </button>
              )}
            </div>
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
      case "integrations": content = <IntegrationsPage onBack={handleBack} />; break;
      case "notifications": content = <NotificationsPage onBack={handleBack} />; break;
      case "profile": content = <ProfilePage onLogout={() => setShowLogoutDialog(true)} onNavigateToSettings={() => navigate("settings")} onNavigateToUpgrade={() => navigate("upgrade")} onNavigateToUsage={() => navigate("usage")} onBack={handleBack} />; break;
      case "upgrade": content = <UpgradePage onBack={handleBack} />; break;
      case "usage": content = <UsagePage onNavigateToUpgrade={() => navigate("upgrade")} onBack={handleBack} />; break;
      case "contributors": content = <ContributorsPage onBack={handleBack} />; break;
      case "files": content = <FilesPage onBack={handleBack} />; break;
      case "projects":
        content = (
          <ProjectsPage
            onBack={handleBack}
            onOpenProjectChat={(project, chatTitle) => {
              setActiveProject(project);
              if (chatTitle) {
                const newChat: Chat = { id: Date.now(), title: chatTitle, period: "Today", messages: [] };
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChat.id);
              }
              setCurrentPage("chat");
              showToast(`Active project context set to "${project.name}"`);
            }}
          />
        );
        break;
      case "schedule": content = <ScheduleTaskPage onBack={handleBack} onNavigateToIntegrations={() => navigate("integrations")} />; break;
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
          <div className="history-label">Recent chats {searchQuery ? `(matching "${searchQuery}")` : ""}</div>
          <div className="history-list">
            {(["Today", "Yesterday", "Previous 7 days"] as const).map(period => {
              const group = chats
                .filter(c => c.period === period)
                .filter(c => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    c.title.toLowerCase().includes(q) ||
                    c.messages.some(m => m.content.toLowerCase().includes(q))
                  );
                });
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
            <button className="account-row" onClick={() => navigate("settings")} style={{ cursor: "pointer", width: "100%" }}>
              <div className="avatar">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="avatar-img" /> : (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="account-copy">
                <span className="account-name">{user?.displayName || user?.email || "You"}</span>
                <span className="account-plan">Settings & Profile</span>
              </div>
              <Settings size={16} style={{ color: "var(--text-tertiary)", marginLeft: "auto" }} />
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

      {/* Confirmatory Chat Deletion Modal Dialog */}
      {deleteChatId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteChatId(null)}>
          <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(234,67,53,0.12)", color: "#ea4335", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700" }}>Delete Conversation?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Are you sure you want to delete this chat? This action cannot be undone and important message history will be permanently deleted.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Button variant="outline" onClick={() => setDeleteChatId(null)}>Cancel</Button>
              <Button onClick={() => executeDeleteChat(deleteChatId)} style={{ background: "#ea4335", color: "#ffffff", fontWeight: "600" }}>Delete Chat</Button>
            </div>
          </div>
        </div>
      )}
      {/* Rename Chat Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Rename Conversation</h3>
              <button onClick={() => setShowRenameModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
            </div>
            <input
              type="text"
              value={renameTitle}
              onChange={e => setRenameTitle(e.target.value)}
              placeholder="Enter new conversation name..."
              style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px", marginBottom: "16px" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setShowRenameModal(false)}>Cancel</Button>
              <Button onClick={() => {
                if (renameTitle.trim()) {
                  setChats(curr => curr.map(c => c.id === activeChatId ? { ...c, title: renameTitle.trim() } : c));
                  showToast("Chat renamed");
                }
                setShowRenameModal(false);
              }} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Project Modal */}
      {showAddToProjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddToProjectModal(false)}>
          <div className="modal-content" style={{ maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Add to Project</h3>
              <button onClick={() => setShowAddToProjectModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--text-secondary)" }}>
              Select a project workspace to organize <strong>"{activeChat.title}"</strong>.
            </p>
            <div style={{ display: "grid", gap: "8px", marginBottom: "18px" }}>
              {["Shopify Store Launch", "E-Commerce Marketing", "Default Workspace"].map(proj => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => setSelectedProject(proj)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: selectedProject === proj ? "var(--wash)" : "var(--surface)", border: `1px solid ${selectedProject === proj ? "var(--gemini-accent)" : "var(--border)"}`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-primary)", textAlign: "left" }}
                >
                  <span>{proj}</span>
                  {selectedProject === proj && <Check size={14} style={{ color: "var(--gemini-accent)" }} />}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setShowAddToProjectModal(false)}>Cancel</Button>
              <Button onClick={() => {
                setShowAddToProjectModal(false);
                showToast(`Added to "${selectedProject}"`);
              }} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Add</Button>
            </div>
          </div>
        </div>
      )}

      {/* Find in Chat Modal */}
      {showFindModal && (
        <div className="modal-overlay" onClick={() => setShowFindModal(false)}>
          <div className="modal-content" style={{ maxWidth: "440px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Find in Chat</h3>
              <button onClick={() => setShowFindModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
            </div>
            <div style={{ position: "relative", marginBottom: "14px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                style={{ width: "100%", padding: "10px 12px 10px 34px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                autoFocus
              />
              <Search size={15} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-tertiary)" }} />
            </div>
            {searchQuery && (
              <div style={{ maxHeight: "200px", overflowY: "auto", display: "grid", gap: "6px" }}>
                {activeChat.messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                  <div key={m.id} style={{ padding: "8px 10px", background: "var(--surface-raised)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary)" }}>
                    <strong>{m.role === "assistant" ? "Hanna" : "You"}:</strong> {m.content.slice(0, 80)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Task Modal */}
      {showScheduleTaskModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleTaskModal(false)}>
          <div className="modal-content" style={{ maxWidth: "460px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={16} style={{ color: "var(--gemini-accent)" }} /> Schedule Task
              </h3>
              <button onClick={() => setShowScheduleTaskModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Specify the prompt, execution time, tools to use, and repetition frequency for automated execution.
            </p>
            <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Task Prompt / Action Instructions
                </label>
                <textarea
                  value={taskPrompt}
                  onChange={e => setTaskPrompt(e.target.value)}
                  placeholder="Provide the exact instructions for Hanna to execute..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Execution Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={taskDate}
                    onChange={e => setTaskDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Repeat Schedule
                  </label>
                  <select
                    value={taskRepeat}
                    onChange={e => setTaskRepeat(e.target.value as any)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px" }}
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Tools to Use
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["Web Search", "Deep Think", "Shopify Connector", "Slack Connector", "Google Workspace"].map(tool => {
                    const isSelected = taskTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => {
                          setTaskTools(prev =>
                            isSelected ? prev.filter(t => t !== tool) : [...prev, tool]
                          );
                        }}
                        style={{
                          fontSize: "12px",
                          padding: "5px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${isSelected ? "var(--gemini-accent)" : "var(--border)"}`,
                          background: isSelected ? "rgba(26, 115, 232, 0.15)" : "var(--surface)",
                          color: isSelected ? "var(--gemini-accent)" : "var(--text-secondary)",
                          cursor: "pointer",
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {isSelected ? "✓ " : "+ "}{tool}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setShowScheduleTaskModal(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!taskTitle.trim() || !taskPrompt.trim()) {
                  showToast("Please enter a task title and prompt instructions.");
                  return;
                }
                fetch("/api/trpc/hanna.scheduleTask?batch=1", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    "0": {
                      title: taskTitle.trim(),
                      prompt: taskPrompt.trim(),
                      executionTime: taskDate || new Date().toISOString(),
                      repeat: taskRepeat,
                      tools: taskTools,
                    }
                  }),
                }).catch(() => undefined);
                setShowScheduleTaskModal(false);
                setTaskPrompt("");
                showToast(`Task "${taskTitle.trim()}" scheduled successfully!`);
              }} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Schedule Task</Button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" style={{ maxWidth: "440px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Share2 size={16} style={{ color: "var(--gemini-accent)" }} /> Share Conversation
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Share <strong>"{activeChat.title}"</strong> using a direct workspace link or invite team contributors.
            </p>

            {/* Responsive Small Action Buttons: Copy Link and Native Share */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Conversation link copied!");
                }}
                style={{ flex: "1 1 120px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", borderRadius: "8px", padding: "6px 12px", fontWeight: "500", minWidth: "100px" }}
              >
                <Copy size={13} /> Copy Link
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({
                      title: activeChat.title,
                      text: `Hanna Conversation: ${activeChat.title}`,
                      url: window.location.href,
                    }).catch(() => undefined);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Conversation link copied!");
                  }
                }}
                style={{ flex: "1 1 120px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "var(--gemini-accent)", color: "#ffffff", fontSize: "12px", borderRadius: "8px", padding: "6px 12px", fontWeight: "500", minWidth: "100px" }}
              >
                <Share2 size={13} /> Share
              </Button>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                Share directly with Workspace Contributors
              </label>
              <textarea
                value={shareEmails}
                onChange={e => setShareEmails(e.target.value)}
                placeholder="colleague1@company.com, colleague2@company.com"
                rows={2}
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="outline" size="sm" onClick={() => setShowShareModal(false)}>Close</Button>
              <Button size="sm" onClick={() => {
                setShowShareModal(false);
                setShareEmails("");
                showToast("Chat access shared with contributors!");
              }} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>Grant Access</Button>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox Modal for Full Resolution Image Viewing */}
      {lightboxImageUrl && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxModalImageUrl(null)}
          style={{ zIndex: 10000, background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxModalImageUrl(null)}
              style={{ position: "absolute", top: "-40px", right: "0", background: "rgba(255, 255, 255, 0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Close image viewer"
            >
              <X size={18} />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Uploaded full view"
              style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>
        </div>
      )}

      {/* Workspace Top-Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="modal-content" style={{ maxWidth: "480px", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={20} style={{ color: "var(--gemini-accent)" }} /> Workspace Credit Top-Up
              </h3>
              <button onClick={() => setShowTopUpModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
              Current Balance: <strong style={{ color: "var(--gemini-accent)" }}>{userCredits} Credits</strong>. Top up your workspace to run multimodal AI prompts and store operator tasks.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                { amount: 100, price: "$1.99 USD", label: "Starter Pack" },
                { amount: 500, price: "$5.99 USD", label: "Popular Pack" },
                { amount: 1000, price: "$9.99 USD", label: "Pro Operator" },
                { amount: 2500, price: "$19.99 USD", label: "Enterprise Boost" },
              ].map(pack => (
                <button
                  key={pack.amount}
                  type="button"
                  onClick={() => {
                    setUserCredits(prev => prev + pack.amount);
                    setShowTopUpModal(false);
                    showToast(`+${pack.amount} Credits added to your workspace!`);
                  }}
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--gemini-accent)", display: "block" }}>
                    {pack.label}
                  </span>
                  <strong style={{ fontSize: "18px", color: "var(--text-primary)", display: "block", margin: "4px 0 2px" }}>
                    +{pack.amount} Credits
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{pack.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}

      {/* Floating Install App Banner */}
      <InstallAppBanner />
    </div>
  );
}
