import React, { useState } from "react";
import { Sparkles, Download, Copy, Check, Maximize2 } from "lucide-react";
import { ImagePreviewModal } from "./ImagePreviewModal";

export interface ChatGPTImageCardProps {
  src: string;
  alt?: string;
}

export function ChatGPTImageCard({ src, alt }: ChatGPTImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Parse expandedPrompt and seed from URL hash if provided (#expandedPrompt=...&seed=...)
  let expandedPrompt = "";
  let seedFromUrl: number | undefined = undefined;

  try {
    if (src.includes("#")) {
      const hash = src.split("#")[1];
      const params = new URLSearchParams(hash);
      if (params.get("expandedPrompt")) {
        expandedPrompt = decodeURIComponent(params.get("expandedPrompt") || "");
      }
      if (params.get("seed")) {
        seedFromUrl = Number(params.get("seed")) || undefined;
      }
    }
  } catch {
    // Ignore parse errors
  }

  const displayPrompt = expandedPrompt || alt || "High-fidelity synthesized visual asset";

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synthesized-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1600);
  };

  return (
    <>
      <div
        className="chatgpt-image-card my-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-md transition-all duration-200 hover:shadow-lg max-w-xl group"
        style={{
          borderRadius: "16px",
          border: "1px solid var(--border)",
          background: "var(--surface-raised)",
          boxShadow: "var(--shadow-small)",
        }}
      >
        {/* Header Toolbar */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-primary)]"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[var(--gemini-accent)]" />
            <span>AI Visual Synthesis</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Copy description"
            >
              {copiedPrompt ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copiedPrompt ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Save image asset"
            >
              <Download className="size-3" />
              <span>{downloading ? "Saving..." : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Open Preview & Action Studio"
            >
              <Maximize2 className="size-3" />
            </button>
          </div>
        </div>

        {/* Step 1: Placeholder Generation & Step 2: Progressive Stream/Fade */}
        <div
          className="relative w-full aspect-square min-h-[260px] bg-[var(--surface-hover)] cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4"
          onClick={() => setModalOpen(true)}
        >
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-[var(--surface-raised)] border border-[var(--border)] overflow-hidden">
              {/* Smooth shimmering skeleton loader background */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--surface-hover)] to-transparent animate-shimmer"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite ease-in-out",
                }}
              />

              {/* Shimmering Top Bar */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[var(--text-tertiary)] animate-pulse" />
                  <span className="text-xs font-medium text-[var(--text-tertiary)] animate-pulse">
                    Synthesizing visual asset...
                  </span>
                </div>
                <div className="size-2 rounded-full bg-[var(--gemini-accent)] animate-ping" />
              </div>

              {/* Step 1 Requirement: Render expanded prompt text in muted, italicized format */}
              <div className="relative z-10 my-auto text-center px-4">
                <p className="text-xs text-[var(--text-tertiary)] italic line-clamp-4 leading-relaxed font-sans">
                  "{displayPrompt}"
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono">
                  <span>Enforcing 8k high-fidelity tags</span>
                  <span>·</span>
                  <span>1024x1024 (1:1)</span>
                </div>
              </div>

              {/* Loading progress bar */}
              <div className="relative z-10 w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--gemini-accent)] animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center text-[var(--text-tertiary)] gap-2 text-xs">
              <Sparkles className="size-6 text-[var(--gemini-accent)]" />
              <span>Image visual preview</span>
            </div>
          ) : (
            <img
              src={src}
              alt={alt || "Synthesized Visual"}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover block transition-opacity duration-300 ease-in-out"
              style={{
                opacity: isLoaded ? 1 : 0,
              }}
              loading="lazy"
            />
          )}
        </div>

        {/* Footer / Caption */}
        <div className="px-3 py-2 text-[11px] text-[var(--text-tertiary)] border-t border-[var(--border)] bg-[var(--surface)] line-clamp-1 italic">
          {displayPrompt}
        </div>
      </div>

      {/* Action Studio / Preview Modal */}
      <ImagePreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        src={src}
        alt={alt}
        expandedPrompt={expandedPrompt}
        seed={seedFromUrl}
      />
    </>
  );
}
