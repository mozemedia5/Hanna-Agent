import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Trash2,
  Bell,
  Clock,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  date: string;
};

type NotificationsPageProps = {
  onBack?: () => void;
};

export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = () => {
    try {
      const raw = localStorage.getItem("hanna_notifications");
      if (raw) {
        setNotifications(JSON.parse(raw));
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleClearAll = () => {
    localStorage.removeItem("hanna_notifications");
    setNotifications([]);
  };

  return (
    <div className="page-container" style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Back Navigation */}
      <div className="page-header-top" style={{ marginBottom: "16px" }}>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--gemini-accent)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)" }}>
            Workspace Updates
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "2px 0 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <Bell size={24} style={{ color: "var(--gemini-accent)" }} /> Notifications
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            Real-time reports, task schedules, and workspace execution alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearAll}
            size="sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "10px", fontSize: "12px", color: "#ea4335" }}
          >
            <Trash2 size={14} /> Clear All
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-secondary)",
            margin: "20px 0",
          }}
        >
          <Sparkles size={32} style={{ color: "var(--text-tertiary)", marginBottom: "12px" }} />
          <strong style={{ display: "block", fontSize: "15px", color: "var(--text-primary)", marginBottom: "4px" }}>
            No New Notifications
          </strong>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
            You're all caught up! Real-time notifications from scheduled tasks and operator actions will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {notifications.map(item => (
            <div
              key={item.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "rgba(26, 115, 232, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      color: "var(--gemini-accent)",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={15} />
                  </div>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{item.title}</strong>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{item.date}</span>
              </div>

              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {item.body}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    background: "var(--surface-raised)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
