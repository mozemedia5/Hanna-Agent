import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { useAuth } from "./_core/hooks/useAuth";
import { Route, Switch } from "wouter";

function App() {
  const auth = useAuth();

  if (auth.loading) return <DashboardLayoutSkeleton />;

  // Authenticated users get the full dashboard / agent workspace.
  if (auth.isAuthenticated && auth.user) {
    return (
      <ErrorBoundary>
        <Home user={auth.user} onLogout={auth.logout} />
      </ErrorBoundary>
    );
  }

  // Everyone else: marketing landing + auth routes only (no AI chat).
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/login">
          <LoginPage auth={auth} mode="login" />
        </Route>
        <Route path="/create-account">
          <LoginPage auth={auth} mode="signup" />
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
