import React, { useState, useEffect, useRef } from "react";
import {
  FolderUp,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  FileText,
  Upload,
  Search,
  Trash2,
  ExternalLink,
  ArrowLeft,
  X,
  Check,
  Filter,
  Play,
  Volume2,
  FileCode,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type StoredFileItem = {
  id: string;
  type: "image" | "video" | "audio" | "pdf" | "doc" | "other";
  url: string;
  dataUrl?: string;
  size: string;
  uploadedAt: string;
  category: "Image" | "Video" | "Audio" | "Document" | "File";
};

type FilesPageProps = {
  onBack?: () => void;
};

// Helper to format file type label cleanly without revealing raw filenames
export function getFileTypeBadgeLabel(type: StoredFileItem["type"]): string {
  switch (type) {
    case "image":
      return "Image";
    case "video":
      return "Video Slot";
    case "audio":
      return "Audio Recording";
    case "pdf":
      return "PDF Document";
    case "doc":
      return "Document";
    default:
      return "File Asset";
  }
}

// LocalStorage persistence key for workspace files
export const WORKSPACE_FILES_KEY = "hanna_user_uploaded_files";

export function loadStoredFiles(): StoredFileItem[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORKSPACE_FILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse error
  }
  return [];
}

export function saveStoredFiles(files: StoredFileItem[]): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(WORKSPACE_FILES_KEY, JSON.stringify(files));
  } catch {
    // Ignore quota error
  }
}

export function addStoredFiles(newFiles: StoredFileItem[]): void {
  const existing = loadStoredFiles();
  const merged = [...newFiles, ...existing];
  saveStoredFiles(merged);
}

export default function FilesPage({ onBack }: FilesPageProps) {
  const [files, setFiles] = useState<StoredFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; type: "image" | "video" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(loadStoredFiles());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleMultipleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);
    setUploading(true);

    try {
      const now = new Date();
      const formattedTime = `Uploaded today at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      const newItems: StoredFileItem[] = await Promise.all(
        filesArray.map(async (file) => {
          const isImg = file.type.startsWith("image/");
          const isVid = file.type.startsWith("video/");
          const isAud = file.type.startsWith("audio/");
          const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
          const isDoc = file.type.includes("document") || file.name.endsWith(".doc") || file.name.endsWith(".docx") || file.name.endsWith(".txt");

          let kind: StoredFileItem["type"] = "other";
          let categoryLabel: StoredFileItem["category"] = "File";

          if (isImg) {
            kind = "image";
            categoryLabel = "Image";
          } else if (isVid) {
            kind = "video";
            categoryLabel = "Video";
          } else if (isAud) {
            kind = "audio";
            categoryLabel = "Audio";
          } else if (isPdf || isDoc) {
            kind = isPdf ? "pdf" : "doc";
            categoryLabel = "Document";
          }

          // Read as Base64 Data URL
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          // Upload server side to Cloudinary if available
          let finalUrl = dataUrl;
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ file: dataUrl, filename: file.name, folder: "hanna_user_uploads" }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.url) finalUrl = data.url;
            }
          } catch {
            // Fallback to dataUrl
          }

          const mb = (file.size / (1024 * 1024)).toFixed(1);
          const sizeStr = Number(mb) < 0.1 ? `${Math.round(file.size / 1024)} KB` : `${mb} MB`;

          return {
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: kind,
            url: finalUrl,
            dataUrl,
            size: sizeStr,
            uploadedAt: formattedTime,
            category: categoryLabel,
          };
        })
      );

      const updated = [...newItems, ...files];
      setFiles(updated);
      saveStoredFiles(updated);
      showToast(`Successfully uploaded ${newItems.length} file(s)`);
    } catch {
      showToast("Error processing file upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    saveStoredFiles(updated);
    showToast("File removed from workspace library");
  };

  const filteredFiles = files.filter((file) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "image" && file.type === "image") ||
      (selectedCategory === "video" && file.type === "video") ||
      (selectedCategory === "audio" && file.type === "audio") ||
      (selectedCategory === "doc" && (file.type === "pdf" || file.type === "doc")) ||
      (selectedCategory === "other" && file.type === "other");

    const badgeLabel = getFileTypeBadgeLabel(file.type).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || badgeLabel.includes(query) || file.category.toLowerCase().includes(query) || file.size.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1080px", margin: "0 auto" }}>
      {/* Hidden File Input allowing Multiple File Selection */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleMultipleUpload}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.md"
      />

      {/* Header Section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--gemini-accent)",
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
            <FolderUp size={24} style={{ color: "var(--gemini-accent)" }} /> Media & Files Library
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            View and manage all uploaded images, video slots, audio recordings, and documents in one place.
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: "var(--gemini-accent)",
            color: "#ffffff",
            borderRadius: "10px",
            padding: "8px 16px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Upload size={16} /> {uploading ? "Uploading Files..." : "Upload Files"}
        </Button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "all", label: `All Files (${files.length})` },
            { id: "image", label: `Images (${files.filter((f) => f.type === "image").length})` },
            { id: "video", label: `Videos (${files.filter((f) => f.type === "video").length})` },
            { id: "audio", label: `Audio (${files.filter((f) => f.type === "audio").length})` },
            { id: "doc", label: `Documents (${files.filter((f) => f.type === "pdf" || f.type === "doc").length})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: "600",
                border: `1px solid ${selectedCategory === cat.id ? "var(--gemini-accent)" : "var(--border)"}`,
                background: selectedCategory === cat.id ? "rgba(26, 115, 232, 0.15)" : "var(--surface)",
                color: selectedCategory === cat.id ? "var(--gemini-accent)" : "var(--text-secondary)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "220px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uploaded files..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "var(--text-primary)",
            }}
          />
          <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-tertiary)" }} />
        </div>
      </div>

      {/* Files Grid View */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {filteredFiles.map((file) => {
          const badgeLabel = getFileTypeBadgeLabel(file.type);

          return (
            <div
              key={file.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              {/* Card Preview Area */}
              <div
                style={{
                  height: file.type === "image" || file.type === "video" ? "160px" : "100px",
                  background: "var(--surface-raised)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {file.type === "image" && (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl({ url: file.dataUrl || file.url, type: "image" })}
                    style={{ background: "transparent", border: "none", padding: 0, width: "100%", height: "100%", cursor: "pointer" }}
                    title="Click to expand view"
                  >
                    <img src={file.dataUrl || file.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                )}

                {file.type === "video" && (
                  <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <video src={file.dataUrl || file.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => setLightboxUrl({ url: file.dataUrl || file.url, type: "video" })}
                      style={{
                        position: "absolute",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.65)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title="Play video"
                    >
                      <Play size={20} style={{ marginLeft: "2px" }} />
                    </button>
                  </div>
                )}

                {file.type === "audio" && (
                  <div style={{ padding: "12px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gemini-accent)", fontSize: "13px", fontWeight: "600" }}>
                      <Volume2 size={20} />
                      <span>{badgeLabel}</span>
                    </div>
                    <audio controls src={file.dataUrl || file.url} style={{ width: "100%", height: "36px" }} />
                  </div>
                )}

                {(file.type === "pdf" || file.type === "doc" || file.type === "other") && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <FileText size={32} style={{ color: file.type === "pdf" ? "#ea4335" : "var(--gemini-accent)" }} />
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{badgeLabel}</span>
                  </div>
                )}

                {/* Badge Indicator in Top Left Corner */}
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    background: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {badgeLabel}
                </div>
              </div>

              {/* Card Meta Footer */}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", background: "var(--surface)" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{badgeLabel}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                    {file.size} • {file.uploadedAt}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      title="Download / View asset"
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "6px",
                        color: "var(--text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Download size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id)}
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "6px",
                      color: "#ea4335",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    title="Delete file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFiles.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 20px",
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: "16px",
              color: "var(--text-secondary)",
            }}
          >
            <FolderUp size={36} style={{ color: "var(--text-tertiary)", marginBottom: "12px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
              No Files in Workspace
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-secondary)", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
              Upload images, videos, audio tracks, and documents. Select multiple files at once to add them to your central workspace.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{ background: "var(--gemini-accent)", color: "#ffffff", borderRadius: "10px", padding: "8px 16px" }}
            >
              Upload Multiple Files
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Images and Videos */}
      {lightboxUrl && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxUrl(null)}
          style={{ zIndex: 10000, background: "rgba(0, 0, 0, 0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#ffffff",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Close viewer"
            >
              <X size={18} />
            </button>

            {lightboxUrl.type === "image" ? (
              <img
                src={lightboxUrl.url}
                alt=""
                style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
              />
            ) : (
              <video
                controls
                autoPlay
                src={lightboxUrl.url}
                style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
              />
            )}
          </div>
        </div>
      )}

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
