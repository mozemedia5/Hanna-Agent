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

function ResponseGraph({ data }: { data: Array<{ label: string; value: number }> }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="response-graph-card" style={{ background: "var(--surface-raised, rgba(255,255,255,0.03))", border: "1px solid var(--border, rgba(255,255,255,0.08))", borderRadius: "12px", padding: "16px", margin: "14px 0" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--gemini-accent, #1a73e8)", marginBottom: "12px" }}>
        Data Insights & Performance Graph
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((item, idx) => {
          const pct = Math.round((item.value / maxVal) * 100);
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
              <span style={{ width: "110px", color: "var(--text-secondary)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              <div style={{ flex: 1, height: "18px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #1a73e8 0%, #8ab4f8 100%)", borderRadius: "6px", transition: "width 0.4s ease" }} />
              </div>
              <span style={{ width: "45px", fontWeight: "600", color: "var(--text-primary)", textAlign: "right" }}>{item.value}</span>
            </div>
          );
        })}
      </div>
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

  // Extract potential image URLs or data graph cues
  const imageUrlMatch = content.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif|svg)/i);
  const chartDataCues: Array<{ label: string; value: number }> = [];

  // Parse lines with numbers/percentages to construct visual chart if applicable
  const lines = sanitizedContent.split("\n");
  for (const line of lines) {
    const tableRowMatch = line.match(/^\|?\s*([A-Za-z0-9\s_-]+)\s*\|?\s*[:$]?([\d,.]+)\%?\s*\|?/);
    if (tableRowMatch && tableRowMatch[1] && tableRowMatch[2]) {
      const val = parseFloat(tableRowMatch[2].replace(/,/g, ""));
      if (!isNaN(val) && val > 0 && tableRowMatch[1].trim().length < 30) {
        chartDataCues.push({ label: tableRowMatch[1].trim(), value: val });
      }
    }
  }

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

      {/* Render Interactive Graph Card if 3+ numerical metric lines are present */}
      {chartDataCues.length >= 2 && (
        <ResponseGraph data={chartDataCues.slice(0, 8)} />
      )}
    </div>
  );
}
