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
    title: "Hanna now supports multimodal research",
    body: "Upload images, PDFs, and documents directly into conversations. Hanna analyzes visual content using Gemini's multimodal capabilities for deeper insights.",
    category: "Feature",
    date: "Just now",
    icon: Sparkles,
    featured: true,
    gradient: "linear-gradient(135deg, #1a73e8 0%, #7c3aed 50%, #ec4899 100%)",
  },
  {
    id: "n2",
    title: "Built-in image generation is live",
    body: "Generate product visuals, marketing graphics, and creative assets directly from your chat. Powered by Gemini's native image generation.",
    category: "Feature",
    date: "1 week ago",
    icon: Video,
    featured: true,
    gradient: "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
  },
  {
    id: "n3",
    title: "Shopify MCP integration available",
    body: "Connect your Shopify store via One-Click MCP for seamless product management, order tracking, and inventory sync. No OAuth setup required.",
    category: "Integration",
    date: "2 weeks ago",
    icon: Zap,
  },
  {
    id: "n4",
    title: "Hanna workspace customization",
    body: "Personalize Hanna's context and behavior with custom instructions. Set personas for e-commerce, coding, research, and creative writing.",
    category: "Feature",
    date: "3 weeks ago",
    icon: Star,
  },
  {
    id: "n5",
    title: "Welcome to Hanna Agent",
    body: "Your AI workspace for commerce automation is ready. Connect your tools, set up integrations, and start automating with Gemini-powered intelligence.",
    category: "Welcome",
    date: "1 month ago",
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
