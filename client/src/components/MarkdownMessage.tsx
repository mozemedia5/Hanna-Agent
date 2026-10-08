import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import hljs from "highlight.js/lib/common";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Check, Copy, Download, Maximize2, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, Presentation, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type MarkdownMessageProps = {
  content: string;
  isStreaming?: boolean;
};

function GoogleSlidesDeckCard({ title, topic }: { title: string; topic?: string }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const cleanTitle = title || "Executive Presentation Deck";
  const slideTopic = topic || cleanTitle;

  const slides = [
    {
      num: 1,
      title: cleanTitle,
      subtitle: "Strategic Brief & Executive Overview",
      imagePrompt: `professional executive presentation title slide for ${slideTopic}, high resolution visual design, sleek modern aesthetic, 8k render`,
      bullets: [
        "Comprehensive market opportunity and strategic goals",
        "AI-driven workflow orchestration and automation roadmap",
        "Prepared by Hanna AI Agent Workspace",
      ],
      notes: "Speaker Notes: Introduce session goals and outline strategic pillars.",
    },
    {
      num: 2,
      title: "Market Analysis & Business Opportunities",
      subtitle: "Industry Trends & Demand Validation",
      imagePrompt: `modern data visual graphs and high impact market chart for ${slideTopic}, clean corporate graphic, vibrant aesthetic`,
      bullets: [
        "Rapid shift toward automated e-commerce & customer workflows",
        "High-intent audience segments and conversion levers",
        "Competitive positioning and value proposition",
      ],
      notes: "Speaker Notes: Highlight customer growth metrics and market drivers.",
    },
    {
      num: 3,
      title: "Execution Strategy & Core Operations",
      subtitle: "Cross-Functional Workflow Architecture",
      imagePrompt: `futuristic tech workspace workflow visual for ${slideTopic}, photorealistic 8k, blue accent lighting, professional composition`,
      bullets: [
        "Multi-channel connector integration (Shopify, Meta, Google Workspace)",
        "Sub-100ms reasoning loop powered by Gemini 3.5 Flash",
        "Automated campaign execution and inventory sync",
      ],
      notes: "Speaker Notes: Walk through system architecture and connector bindings.",
    },
    {
      num: 4,
      title: "Key Performance Indicators & ROI",
      subtitle: "Growth Metrics & Revenue Milestones",
      imagePrompt: `revenue growth chart and business success metrics illustration for ${slideTopic}, crisp graphic design, octane render`,
      bullets: [
        "Expected revenue & conversion optimization target: +24% YoY",
        "Reduced operational cycle time across team workflows",
        "High ROAS on ad manager and email retention campaigns",
      ],
      notes: "Speaker Notes: Emphasize business impact, ROI, and core KPIs.",
    },
    {
      num: 5,
      title: "Roadmap & Next Action Steps",
      subtitle: "Immediate Deliverables & Timeline",
      imagePrompt: `strategic project milestone roadmap diagram for ${slideTopic}, clean modern presentation slide background, highly detailed`,
      bullets: [
        "Phase 1: Configure connector authorization & store credentials",
        "Phase 2: Launch automated agent execution schedules",
        "Phase 3: Review weekly performance reports in Hanna Dashboard",
      ],
      notes: "Speaker Notes: Conclude presentation and assign owner deliverables.",
    },
  ];

  const current = slides[activeSlide];
  const slideImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(current.imagePrompt)}?width=800&height=400&nologo=true&seed=${current.num * 42}`;

  return (
    <div
      className="google-slides-deck-card"
      style={{
        margin: "16px 0",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface-raised)",
        maxWidth: "640px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "var(--text-primary)" }}>
          <Presentation size={15} style={{ color: "#fbbc04" }} />
          <span>Google Slides Presentation Deck</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: "500" }}>
            Slide {activeSlide + 1} of {slides.length}
          </span>
          <button
            type="button"
            onClick={() => window.open("https://docs.google.com/presentation", "_blank")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              color: "var(--gemini-accent)",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <span>Open in Slides</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Slide Visual Banner */}
      <div style={{ width: "100%", height: "140px", overflow: "hidden", position: "relative", background: "#111" }}>
        <img
          src={slideImageUrl}
          alt={current.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }}
          loading="lazy"
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: "10px", left: "16px", right: "16px", color: "#fff" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".08em", background: "rgba(251, 188, 4, 0.9)", color: "#000", padding: "2px 6px", borderRadius: "4px" }}>
            SLIDE {current.num}
          </span>
        </div>
      </div>

      {/* Slide Content Canvas */}
      <div
        style={{
          padding: "20px 24px",
          minHeight: "180px",
          background: "linear-gradient(135deg, rgba(251, 188, 4, 0.04) 0%, rgba(26, 115, 232, 0.04) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".06em", color: "#fbbc04", marginBottom: "4px" }}>
          {current.subtitle}
        </div>

        <h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.3" }}>
          {current.title}
        </h3>

        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          {current.bullets.map((b, idx) => (
            <li key={idx} style={{ marginBottom: "6px" }}>{b}</li>
          ))}
        </ul>

        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px dashed var(--border)", fontSize: "11px", color: "var(--text-tertiary)", fontStyle: "italic" }}>
          {current.notes}
        </div>
      </div>

      {/* Slide Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSlide(s => Math.max(0, s - 1))}
          disabled={activeSlide === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface-raised)",
            color: activeSlide === 0 ? "var(--text-tertiary)" : "var(--text-primary)",
            fontSize: "12px",
            fontWeight: "500",
            cursor: activeSlide === 0 ? "default" : "pointer",
            opacity: activeSlide === 0 ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <div style={{ display: "flex", gap: "6px" }}>
          {slides.map((s, idx) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveSlide(idx)}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: activeSlide === idx ? "var(--gemini-accent)" : "var(--border)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
              }}
              title={`Jump to slide ${s.num}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setActiveSlide(s => Math.min(slides.length - 1, s + 1))}
          disabled={activeSlide === slides.length - 1}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface-raised)",
            color: activeSlide === slides.length - 1 ? "var(--text-tertiary)" : "var(--text-primary)",
            fontSize: "12px",
            fontWeight: "500",
            cursor: activeSlide === slides.length - 1 ? "default" : "pointer",
            opacity: activeSlide === slides.length - 1 ? 0.5 : 1,
          }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

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

import { ChatGPTImageCard } from "./ChatGPTImageCard";

export function cleanResponseSymbols(text: string): string {
  if (!text) return "";
  let cleaned = text
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

  // Convert raw standalone image URLs (not already formatted as markdown image ![...](...)) into markdown image syntax
  const rawUrlRegex = /(?<!\!\[[^\]]*\]\()(https?:\/\/[^\s<>)]+\.(?:png|jpg|jpeg|webp|gif|svg)(?:\?[^\s<>)]*)?|https?:\/\/image\.pollinations\.ai\/prompt\/[^\s<>)]+)/gi;
  cleaned = cleaned.replace(rawUrlRegex, (url) => `\n\n![Web Image](${url})\n\n`);

  return cleaned;
}

type ChartDataPayload = {
  type?: "line" | "bar" | "area";
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey?: string;
  yKeys?: string[];
};

function ChatGPTDataChart({ payload }: { payload: ChartDataPayload }) {
  if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) return null;

  const chartType = payload.type || "bar";
  const title = payload.title || "Interactive Data Visualization";
  const xKey = payload.xKey || Object.keys(payload.data[0])[0] || "name";

  const allKeys = Object.keys(payload.data[0]);
  const yKeys = payload.yKeys || allKeys.filter(k => k !== xKey && typeof payload.data[0][k] === "number");

  // ChatGPT Signature minimalist palette: deep blues, teals, and soft slates
  const palette = ["#2563eb", "#0d9488", "#475569", "#6366f1", "#0891b2"];

  return (
    <div
      className="chatgpt-chart-card"
      style={{
        margin: "20px 0",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "16px 20px 12px",
        boxShadow: "var(--shadow-small)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          fontSize: "13px",
          fontWeight: "600",
          color: "var(--text-primary)",
        }}
      >
        <BarChart3 size={16} style={{ color: "#2563eb" }} />
        <span>{title}</span>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={payload.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
              <XAxis dataKey={xKey} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {yKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={palette[idx % palette.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={payload.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
              <XAxis dataKey={xKey} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {yKeys.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={palette[idx % palette.length]}
                  stroke={palette[idx % palette.length]}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={payload.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
              <XAxis dataKey={xKey} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {yKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={palette[idx % palette.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function MarkdownMessage({ content, isStreaming }: MarkdownMessageProps) {
  const sanitizedContent = cleanResponseSymbols(content);

  // Extract potential image URLs
  const imageUrlMatch = content.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif|svg)/i);

  // Check if content indicates a Google Slides / Presentation deck creation
  const isPresentation = /(google slides|presentation deck|slide deck|generated a 5-slide|presentation for)/i.test(content);
  const presentationTitleMatch = content.match(/(?:for|on)\s+["'‘“]?([^"'\n’”#]+)["'’”]?/i);
  const deckTitle = presentationTitleMatch ? presentationTitleMatch[1].trim() : "Interactive Presentation Deck";

  return (
    <div className="markdown-message">
      {isPresentation && <GoogleSlidesDeckCard title={deckTitle} />}

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table({ children }) {
            return (
              <div className="markdown-table-wrapper" style={{ overflowX: "auto", margin: "14px 0" }}>
                <table className="markdown-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead style={{ background: "var(--surface-raised)", borderBottom: "2px solid var(--border)" }}>{children}</thead>;
          },
          th({ children }) {
            return <th style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text-primary)" }}>{children}</th>;
          },
          td({ children }) {
            return <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{children}</td>;
          },
          code({ className, children, ...props }) {
            const match = /language-([\w-]+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");

            if (match && (match[1] === "chart" || match[1] === "json:chart")) {
              try {
                const parsed = JSON.parse(code);
                if (parsed && Array.isArray(parsed.data)) {
                  return <ChatGPTDataChart payload={parsed} />;
                }
              } catch {
                // Fallback to standard code block if JSON parsing fails
              }
            }

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

      {isStreaming && (
        <span className="typing-cursor" aria-hidden="true" title="Generating response..." />
      )}
    </div>
  );
}
