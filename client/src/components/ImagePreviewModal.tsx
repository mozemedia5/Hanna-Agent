import React, { useState } from "react";
import { Download, RefreshCw, Edit3, Copy, Check, X, Sparkles, Send } from "lucide-react";

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  expandedPrompt?: string;
  seed?: number;
  onRegenerate?: (newSeed: number) => void;
  onEditImage?: (editInstruction: string) => void;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  src,
  alt = "Synthesized Image",
  expandedPrompt,
  seed,
  onRegenerate,
  onEditImage,
}: ImagePreviewModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [currentSeed, setCurrentSeed] = useState(seed ?? Math.floor(Math.random() * 100000));
  const [currentSrc, setCurrentSrc] = useState(src);

  if (!isOpen) return null;

  const displayPrompt = expandedPrompt || alt || "High-fidelity synthesized visual asset";

  const handleCopyPromptAndSeed = async () => {
    const metadataText = `Prompt: ${displayPrompt}\nSeed: ${currentSeed}`;
    try {
      await navigator.clipboard.writeText(metadataText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      setCopiedPrompt(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(currentSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synthesized-image-${currentSeed}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentSrc, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = () => {
    const nextSeed = Math.floor(Math.random() * 100000);
    setCurrentSeed(nextSeed);

    // Update URL seed query parameter if present
    const updatedUrl = currentSrc.includes("seed=")
      ? currentSrc.replace(/seed=\d+/, `seed=${nextSeed}`)
      : `${currentSrc}&seed=${nextSeed}`;

    setCurrentSrc(updatedUrl);
    if (onRegenerate) {
      onRegenerate(nextSeed);
    }
  };

  const handleApplyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;

    const modifiedPrompt = `${displayPrompt}, ${editPrompt.trim()}`;
    const nextSeed = Math.floor(Math.random() * 100000);
    setCurrentSeed(nextSeed);

    const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(modifiedPrompt)}?width=1024&height=1024&nologo=true&seed=${nextSeed}`;
    setCurrentSrc(newUrl);

    if (onEditImage) {
      onEditImage(editPrompt);
    }
    setEditPrompt("");
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-4xl w-full max-h-[90vh] bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--gemini-accent)]" />
            <span>Image Preview & Action Studio</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Close overlay"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Main Image View */}
        <div className="relative w-full flex-1 min-h-[300px] max-h-[60vh] flex items-center justify-center p-4 bg-black/40 overflow-hidden">
          <img
            src={currentSrc}
            alt={alt}
            className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-lg transition-opacity duration-300"
          />
        </div>

        {/* Prompt description banner */}
        <div className="w-full px-5 py-3 bg-[var(--surface)] border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <p className="line-clamp-2 italic text-[var(--text-tertiary)]">
            "{displayPrompt}"
          </p>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] font-mono">
            <span>Seed: {currentSeed}</span>
            <span>·</span>
            <span>1024x1024 (1:1)</span>
          </div>
        </div>

        {/* In-painting / Text Modification Block */}
        {isEditing && (
          <form
            onSubmit={handleApplyEdit}
            className="w-full px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-hover)] flex items-center gap-2"
          >
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Describe modification (e.g. 'add sunset sky, neon lighting')..."
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]"
              autoFocus
            />
            <button
              type="submit"
              disabled={!editPrompt.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--ink)] text-[var(--bg)] rounded-full text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Send className="size-3.5" />
              <span>Apply Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Floating/Fixed Contextual Action Suggestion Bar */}
        <div className="w-full px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-raised)] flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleRegenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] transition-all shadow-xs"
          >
            <RefreshCw className="size-3.5 text-[var(--gemini-accent)]" />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] transition-all shadow-xs"
          >
            <Edit3 className="size-3.5 text-[var(--gemini-accent)]" />
            <span>Edit Image</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] transition-all shadow-xs"
          >
            <Download className="size-3.5 text-[var(--gemini-accent)]" />
            <span>{downloading ? "Saving..." : "Download"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPromptAndSeed}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] transition-all shadow-xs"
          >
            {copiedPrompt ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-[var(--gemini-accent)]" />
                <span>Copy Seed/Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
