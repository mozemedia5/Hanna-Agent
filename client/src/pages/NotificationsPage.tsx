/*
 * Notifications Page — Product updates, milestones, and announcements
 * Styled like the Runable notifications design.
 */
import {
  ArrowLeft,
  Gift,
  Rocket,
  Star,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string;
  category: string;
  date: string;
};

const notifications: Notification[] = [];

type NotificationsPageProps = {
  onBack?: () => void;
};

export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  return (
    <div className="page-container">
      {/* Back Navigation */}
      <div className="page-header-top">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">Updates</span>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            Product updates and real system alerts from your Hanna workspace.
          </p>
        </div>
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
            You're all caught up. System alerts and admin updates will appear here.
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div className="notification-card" key={notification.id}>
              <div className="notification-header-row">
                <div className="notification-icon-circle">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3>{notification.title}</h3>
                </div>
              </div>
              <div className="notification-body">
                <p>{notification.body}</p>
              </div>
              <div className="notification-footer">
                <span className="notification-category">{notification.category}</span>
                <span className="notification-date">{notification.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
