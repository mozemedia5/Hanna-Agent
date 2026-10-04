import React, { useState, useEffect } from "react";
import { Download, X, CheckCircle2, Zap } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function InstallAppBanner() {
  const { isInstalled, installing, installApp } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage if user recently dismissed
    const dismissedAt = localStorage.getItem("hanna_install_banner_dismissed");
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
      }
    }
  }, []);

  // Do not render if app is installed or user dismissed it
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    await installApp();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("hanna_install_banner_dismissed", Date.now().toString());
  };

  return (
    <div
      className="hanna-install-banner-floating"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9990,
        maxWidth: "420px",
        width: "calc(100vw - 40px)",
        background: "var(--surface-raised, #1c1c1e)",
        border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
        borderRadius: "16px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        padding: "16px",
        color: "var(--text-primary, #ffffff)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        animation: "slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--surface, #121212)",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.15))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <img src="/hanna-icon-192.png" alt="Hanna AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary, #ffffff)" }}>
                Install Hanna App
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  padding: "2px 6px",
                  borderRadius: "9999px",
                  background: "rgba(26, 115, 232, 0.2)",
                  color: "var(--gemini-accent, #1a73e8)",
                  border: "1px solid rgba(26, 115, 232, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <Zap size={10} /> Faster Experience
              </span>
            </div>

            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-secondary, #a1a1aa)", lineHeight: "1.35" }}>
              Get instant desktop access, sub-100ms response times, and full offline workspace capability.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-tertiary, #71717a)",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "color 0.15s ease",
          }}
          title="Dismiss install prompt"
          aria-label="Dismiss install prompt"
        >
          <X size={16} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          margin: "12px 0",
          padding: "8px 10px",
          background: "var(--surface, rgba(0,0,0,0.2))",
          borderRadius: "10px",
          border: "1px solid var(--border, rgba(255,255,255,0.06))",
          fontSize: "11px",
          color: "var(--text-secondary, #d4d4d8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={13} style={{ color: "var(--gemini-accent, #1a73e8)", flexShrink: 0 }} />
          <span>Instant Launcher & Dock</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={13} style={{ color: "var(--gemini-accent, #1a73e8)", flexShrink: 0 }} />
          <span>Zero-Browser Distraction</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            background: "var(--gemini-accent, #1a73e8)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(26, 115, 232, 0.3)",
            transition: "all 0.15s ease",
          }}
        >
          <Download size={15} />
          <span>{installing ? "Installing..." : "Install Hanna App"}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            padding: "9px 12px",
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid var(--border, rgba(255,255,255,0.15))",
            color: "var(--text-secondary, #a1a1aa)",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
