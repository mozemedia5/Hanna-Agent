import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Public landing composer: captures the first message and sends users to login/signup.
 * After auth, Home can read sessionStorage key `hanna_pending_prompt`.
 */
export default function LandingPromptBox() {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");

  const goAuth = (mode: "login" | "signup") => {
    const trimmed = value.trim();
    if (trimmed) {
      try {
        sessionStorage.setItem("hanna_pending_prompt", trimmed);
      } catch {
        /* ignore */
      }
    }
    navigate(mode === "login" ? "/login" : "/create-account");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goAuth("signup");
  };

  return (
    <form className="landing-prompt-box" onSubmit={onSubmit} style={{ width: "100%", maxWidth: 640, margin: "24px auto 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
          background: "var(--surface-raised, rgba(0,0,0,0.25))",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <Sparkles size={18} style={{ color: "var(--gemini-accent)", marginBottom: 10, flexShrink: 0 }} />
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Ask Hanna anything — store ops, ads, content, code…"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: 15,
            lineHeight: 1.45,
            fontFamily: "inherit",
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              goAuth("signup");
            }
          }}
        />
        <button
          type="submit"
          aria-label="Continue"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "var(--gemini-accent)",
            color: "var(--ink-contrast, #0a0a0a)",
            flexShrink: 0,
          }}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
        Sign in required to chat.{" "}
        <button type="button" onClick={() => goAuth("login")} style={{ background: "none", border: "none", color: "var(--gemini-accent)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
          Already have an account?
        </button>
      </p>
    </form>
  );
}
