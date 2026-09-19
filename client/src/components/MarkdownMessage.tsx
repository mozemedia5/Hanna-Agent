import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import hljs from "highlight.js/lib/common";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

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

function ResponseVisualCard({ src, alt, caption }: { src: string; alt?: string; caption?: string }) {
  return (
    <div className="response-image-container" style={{ margin: "14px 0", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border, rgba(255,255,255,0.1))", background: "var(--surface-raised, rgba(255,255,255,0.02))" }}>
      <img src={src} alt={alt || "AI Visual output"} style={{ width: "100%", height: "auto", display: "block", maxHeight: "420px", objectFit: "cover" }} />
      {caption && (
        <div style={{ padding: "8px 12px", fontSize: "11px", color: "var(--text-secondary)", background: "var(--surface, rgba(0,0,0,0.2))" }}>
          {caption}
        </div>
      )}
    </div>
  );
}

export function cleanResponseSymbols(text: string): string {
  if (!text) return "";
  return text
    // Remove standalone horizontal rule dividers (e.g. --- or *** or ___) that cut through responses
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "")
    // Remove raw LaTeX math delimiters like \[ \], \( \), \begin{...}, \end{...}
    .replace(/\\\[\s*/g, "")
    .replace(/\s*\\\]/g, "")
    .replace(/\\\(\s*/g, "")
    .replace(/\s*\\\)/g, "")
    .replace(/\\begin\{[a-zA-Z0-9*]+\}/g, "")
    .replace(/\\end\{[a-zA-Z0-9*]+\}/g, "")
    // Remove unparsed symbol garbage or noise patterns (e.g. *#$#&, #$#&, etc.) while preserving markdown headers (###)
    .replace(/(?<!^|\n)(?:[*#$&\\]{3,})/g, "")
    // Replace double backslashes used as linebreaks in raw math with normal linebreaks
    .replace(/\\\\/g, "\n");
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  const sanitizedContent = cleanResponseSymbols(content);

  // Extract potential image URLs
  const imageUrlMatch = content.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif|svg)/i);

  return (
    <div className="markdown-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>

      {/* Render AI Visual Image container if image URL is present in response */}
      {imageUrlMatch && (
        <ResponseVisualCard src={imageUrlMatch[0]} alt="Visual response content" />
      )}
    </div>
  );
}
