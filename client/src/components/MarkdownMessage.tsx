import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import hljs from "highlight.js/lib/common";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Check, Copy, Download, Maximize2, Sparkles, X } from "lucide-react";

type MarkdownMessageProps = { content: string };

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const highlighted =
    language && hljs.getLanguage(language)
      ? hljs.highlight(code, { language }).value
      : hljs.highlightAuto(code).value;
  return (
    <div className="code-block-shell">
      <div className="code-block-toolbar">
        <span>{language || "code"}</span>
        <button type="button" onClick={copyCode} aria-label="Copy code">
          {copied ? (
            <>
              <Check size={13} /> Copied
            </>
          ) : (
            <>
              <Copy size={13} /> Copy
            </>
          )}
        </button>
      </div>
      <pre>
        <code
          className={language ? `language-${language}` : undefined}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

function ChatGPTImageCard({ src, alt }: { src: string; alt?: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hanna-generated-image-${Date.now()}.png`;
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

  const handleCopyPrompt = () => {
    if (alt) {
      navigator.clipboard.writeText(alt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1600);
    }
  };

  return (
    <div
      className="chatgpt-image-container"
      style={{
        margin: "16px 0",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface-raised)",
        maxWidth: "600px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "var(--text-primary)" }}>
          <Sparkles size={14} style={{ color: "var(--gemini-accent)" }} />
          <span>Hanna Image Generator</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {alt && (
            <button
              type="button"
              onClick={handleCopyPrompt}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "11px",
                cursor: "pointer",
              }}
              title="Copy prompt"
            >
              {copiedPrompt ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedPrompt ? "Copied" : "Prompt"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
            }}
            title="Download full resolution image"
          >
            <Download size={13} />
            <span>{downloading ? "Saving..." : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
            }}
            title="Expand full screen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setLightboxOpen(true)}>
        <img
          src={src}
          alt={alt || "Generated AI Visual"}
          style={{ width: "100%", height: "auto", display: "block", maxHeight: "500px", objectFit: "cover" }}
          loading="lazy"
        />
      </div>

      {alt && (
        <div style={{ padding: "8px 14px", fontSize: "11px", color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}>
          {alt}
        </div>
      )}

      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
            <img src={src} alt={alt || "Expanded image"} style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "12px" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function cleanResponseSymbols(text: string): string {
  if (!text) return "";
  return text
    // Strip random noise patterns like *@#$#% or #$#%* or similar unparsed symbol noise
    .replace(/[*#$%\\]{4,}/g, "")
    // Convert raw LaTeX block math delimiters \[ ... \] to standard $$ ... $$ for remark-math
    .replace(/\\\[\s*/g, "\n$$\n")
    .replace(/\s*\\\]/g, "\n$$\n")
    // Convert raw LaTeX inline math delimiters \( ... \) to standard $ ... $ for remark-math
    .replace(/\\\(\s*/g, " $")
    .replace(/\s*\\\)/g, "$ ")
    // Remove standalone horizontal rule dividers (e.g. --- or *** or ___) that cut through responses
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "");
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  const sanitizedContent = cleanResponseSymbols(content);

  // Extract potential image URLs
  const imageUrlMatch = content.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif|svg)/i);

  return (
    <div className="markdown-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-([\w-]+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");
            if (!match)
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            return <CodeBlock language={match[1] || "code"} code={code} />;
          },
          img({ src, alt }) {
            if (src) {
              return <ChatGPTImageCard src={src} alt={alt} />;
            }
            return null;
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>

      {/* Fallback image rendering if markdown img tag was unparsed */}
      {imageUrlMatch && !sanitizedContent.includes("![") && (
        <ChatGPTImageCard src={imageUrlMatch[0]} alt="Generated AI Visual" />
      )}
    </div>
  );
}
