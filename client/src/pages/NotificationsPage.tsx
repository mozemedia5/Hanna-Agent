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
  icon: typeof Rocket;
  featured?: boolean;
  gradient?: string;
};

const notifications: Notification[] = [
  {
    id: "n1",
    title: "Google Workspace & Deep Research Live",
    body: "Connect Google Drive, Docs, Sheets, Slides, Ads, Gmail, and Calendar. Hanna automates cross-platform deep search and multi-step task execution.",
    category: "Feature",
    date: "Just now",
    icon: Sparkles,
    featured: true,
    gradient: "linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)",
  },
  {
    id: "n2",
    title: "Visual Response Cards & Read Aloud",
    body: "AI responses now render interactive data graphs, image visual containers, and voice Read Aloud controls for accessible listening.",
    category: "Feature",
    date: "Today",
    icon: Video,
    featured: true,
    gradient: "linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)",
  },
  {
    id: "n3",
    title: "Shopify Storefront MCP & E-Commerce Tools",
    body: "Connect your store to automate catalog syncing, low-inventory alerts, best-seller tracking, and fulfillment workflows.",
    category: "Integration",
    date: "3 days ago",
    icon: Zap,
  },
  {
    id: "n4",
    title: "E-Commerce & Business Plugin Catalog",
    body: "Browse and connect over 390 developer and business plugins with official brand marks, 1-click OAuth, and custom MCP endpoint discovery.",
    category: "Integration",
    date: "1 week ago",
    icon: Star,
  },
  {
    id: "n5",
    title: "Hanna Workspace & Multi-Contributor Collaboration",
    body: "Share conversations directly across WhatsApp, Telegram, X, and Email or invite team contributors with credit allowance controls.",
    category: "Workspace",
    date: "2 weeks ago",
    icon: Gift,
  },
];

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
            Product updates, new features, and milestones from your Hanna
            workspace.
          </p>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.map(notification => {
          const Icon = notification.icon;
          return (
            <div
              className={`notification-card ${notification.featured ? "is-featured" : ""}`}
              key={notification.id}
            >
              {notification.featured && notification.gradient && (
                <div
                  className="notification-banner"
                  style={{ background: notification.gradient }}
                >
                  <div className="notification-banner-content">
                    <Icon size={24} color="#ffffff" />
                    <h2>{notification.title}</h2>
                  </div>
                </div>
              )}
              {!notification.featured && (
                <div className="notification-header-row">
                  <div className="notification-icon-circle">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3>{notification.title}</h3>
                  </div>
                </div>
              )}
              <div className="notification-body">
                <p>{notification.body}</p>
              </div>
              <div className="notification-footer">
                <span className="notification-category">
                  {notification.category}
                </span>
                <span className="notification-date">{notification.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
