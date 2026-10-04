import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { useAuth } from "./_core/hooks/useAuth";
import { Route, Switch } from "wouter";

const devFallbackUser = {
  uid: "demo-user-id",
  displayName: "Hanna User",
  email: "demo@hanna.ai",
} as any;

function App() {
  const auth = useAuth();
  if (auth.loading) return <DashboardLayoutSkeleton />;
  const currentUser = auth.user ?? devFallbackUser;

  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/login">
          <LoginPage auth={auth} mode="login" />
        </Route>
        <Route path="/create-account">
          <LoginPage auth={auth} mode="signup" />
        </Route>
        <Route path="/landing">
          <LandingPage />
        </Route>
        <Route path="/">
          <Home user={currentUser} onLogout={auth.logout} />
        </Route>
        <Route>
          <Home user={currentUser} onLogout={auth.logout} />
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

export default App;
