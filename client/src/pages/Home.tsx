/*
 * Temporary restore shell — full Home will be re-applied
 */
import React from "react";
import type { User } from "firebase/auth";

export default function Home({ user, onLogout }: { user?: User | null; onLogout?: () => Promise<void> }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0f14", color: "#e8eef7", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Hanna workspace</h1>
        <p style={{ opacity: 0.75, marginBottom: 16 }}>
          Signed in as {user?.email || "user"}. Full chat UI is being restored — please refresh in a moment.
        </p>
        <button
          type="button"
          onClick={() => onLogout?.()}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #333", background: "#151b24", color: "inherit", cursor: "pointer" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
