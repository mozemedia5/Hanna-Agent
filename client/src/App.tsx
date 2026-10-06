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
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/login">
          {auth.isAuthenticated ? <Home user={auth.user} onLogout={auth.logout} /> : <LoginPage auth={auth} mode="login" />}
        </Route>
        <Route path="/create-account">
          {auth.isAuthenticated ? <Home user={auth.user} onLogout={auth.logout} /> : <LoginPage auth={auth} mode="signup" />}
        </Route>
        <Route path="/landing">
          <LandingPage />
        </Route>
        <Route path="/demo">
          <Home user={{ displayName: "Demo User", email: "demo@hanna.ai" } as any} />
        </Route>
        <Route path="/">
          {auth.isAuthenticated ? <Home user={auth.user} onLogout={auth.logout} /> : <LoginPage auth={auth} mode="login" />}
        </Route>
        <Route>
          {auth.isAuthenticated ? <Home user={auth.user} onLogout={auth.logout} /> : <LoginPage auth={auth} mode="login" />}
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

export default App;
