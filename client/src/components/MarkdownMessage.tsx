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

  const highlighted = language && hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value;
  return <div className="code-block-shell"><div className="code-block-toolbar"><span>{language || "code"}</span><button type="button" onClick={copyCode} aria-label="Copy code">{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button></div><pre><code className={language ? `language-${language}` : undefined} dangerouslySetInnerHTML={{ __html: highlighted }} /></pre></div>;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return <div className="markdown-message"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    code({ className, children, ...props }) {
      const match = /language-([\w-]+)/.exec(className || "");
      const code = String(children).replace(/\n$/, "");
      if (!match) return <code className="inline-code" {...props}>{children}</code>;
      return <CodeBlock language={match[1] || "code"} code={code} />;
    },
  }}>{content}</ReactMarkdown></div>;
}
