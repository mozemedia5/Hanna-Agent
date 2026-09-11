/*
 * Profile Page — User profile, credits, usage, and account management
 */
import { useAuth } from "@/_core/hooks/useAuth";
import {
  calculateConversationAnalytics,
  listUserConversations,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

type ProfilePageProps = {
  onLogout: () => void;
  onNavigateToSettings: () => void;
  onNavigateToUpgrade?: () => void;
  onNavigateToUsage?: () => void;
  onBack?: () => void;
};

export default function ProfilePage({
  onLogout,
  onNavigateToSettings,
  onNavigateToUpgrade,
  onNavigateToUsage,
  onBack,
}: ProfilePageProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ReturnType<
    typeof calculateConversationAnalytics
  > | null>(null);

  useEffect(() => {
    void listUserConversations()
      .then(conversations =>
        setAnalytics(calculateConversationAnalytics(conversations))
      )
      .catch(() => setAnalytics(calculateConversationAnalytics([])));
  }, []);

  const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

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
          <span className="eyebrow">Account</span>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="profile-avatar-large">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              (user?.displayName || user?.email || "U")
                .slice(0, 1)
                .toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h2>{user?.displayName || "User"}</h2>
            <span>{user?.email || "No email"}</span>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="profile-credits-card">
        <div className="credits-header">
          <CreditCard size={18} />
          <span>Credits</span>
          <span className="credits-amount">2.5k left</span>
        </div>
        <div className="credits-bar">
          <div className="credits-bar-fill" style={{ width: "100%" }} />
        </div>
        <div className="credits-actions">
          <Button variant="outline" className="credits-action-btn" onClick={onNavigateToUsage}>
            <BarChart3 size={14} />
            Usage
          </Button>
          <Button className="credits-action-btn upgrade" onClick={onNavigateToUpgrade}>
            Upgrade
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="profile-actions-list">
        <button className="profile-action-row" onClick={onNavigateToUpgrade}>
          <Gift size={18} />
          <div className="profile-action-copy">
            <strong>Upgrade Plan</strong>
            <span>3-day trial + 50% off first month</span>
          </div>
          <ArrowUpRight size={16} className="profile-action-arrow" />
        </button>
        <button className="profile-action-row">
          <TrendingUp size={18} />
          <div className="profile-action-copy">
            <strong>Affiliate</strong>
            <span>100% commission</span>
          </div>
          <ArrowUpRight size={16} className="profile-action-arrow" />
        </button>
        <button className="profile-action-row">
          <HelpCircle size={18} />
          <div className="profile-action-copy">
            <strong>Help</strong>
          </div>
          <ArrowUpRight size={16} className="profile-action-arrow" />
        </button>
        <button className="profile-action-row" onClick={onNavigateToSettings}>
          <Settings size={18} />
          <div className="profile-action-copy">
            <strong>Settings</strong>
          </div>
          <ArrowUpRight size={16} className="profile-action-arrow" />
        </button>
      </div>

      {/* Usage Stats */}
      <div className="profile-usage-section">
        <h3>Usage Overview</h3>
        <div className="usage-stat-grid">
          <div className="usage-stat">
            <span>Conversations</span>
            <strong>{formatNumber(analytics?.totalConversations ?? 0)}</strong>
          </div>
          <div className="usage-stat">
            <span>Messages</span>
            <strong>{formatNumber(analytics?.totalMessages ?? 0)}</strong>
          </div>
          <div className="usage-stat">
            <span>Est. tokens</span>
            <strong>{formatNumber(analytics?.estimatedTokens ?? 0)}</strong>
          </div>
          <div className="usage-stat">
            <span>Active days</span>
            <strong>{formatNumber(analytics?.activeDays ?? 0)}</strong>
          </div>
        </div>
      </div>

      {/* Log out */}
      <button className="profile-logout" onClick={onLogout}>
        <LogOut size={18} />
        Log out
      </button>
    </div>
  );
}
