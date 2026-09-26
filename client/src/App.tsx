import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { useAuth } from "./_core/hooks/useAuth";
import { Route, Switch } from "wouter";

function App() {
  const auth = useAuth();

  if (auth.loading) return <DashboardLayoutSkeleton />;

  // Authenticated users get the full dashboard / agent workspace with legal route overlays.
  if (auth.isAuthenticated && auth.user) {
    return (
      <ErrorBoundary>
        <Switch>
          <Route path="/privacypolicy">
            <PrivacyPolicyPage isAuthenticated={true} />
          </Route>
          <Route path="/privacy">
            <PrivacyPolicyPage isAuthenticated={true} />
          </Route>
          <Route path="/terms">
            <TermsOfServicePage isAuthenticated={true} />
          </Route>
          <Route path="/terms-of-service">
            <TermsOfServicePage isAuthenticated={true} />
          </Route>
          <Route path="/">
            <Home user={auth.user} onLogout={auth.logout} />
          </Route>
          <Route>
            <Home user={auth.user} onLogout={auth.logout} />
          </Route>
        </Switch>
      </ErrorBoundary>
    );
  }

  // Unauthenticated users: marketing landing, auth, and legal routes.
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/login">
          <LoginPage auth={auth} mode="login" />
        </Route>
        <Route path="/create-account">
          <LoginPage auth={auth} mode="signup" />
        </Route>
        <Route path="/privacypolicy">
          <PrivacyPolicyPage isAuthenticated={false} />
        </Route>
        <Route path="/privacy">
          <PrivacyPolicyPage isAuthenticated={false} />
        </Route>
        <Route path="/terms">
          <TermsOfServicePage isAuthenticated={false} />
        </Route>
        <Route path="/terms-of-service">
          <TermsOfServicePage isAuthenticated={false} />
        </Route>
        <Route path="/">
          <LandingPage />
        </Route>
        <Route>
          <LandingPage />
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

export default App;
