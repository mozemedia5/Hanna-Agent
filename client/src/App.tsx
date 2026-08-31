import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./_core/hooks/useAuth";
import { Route, Switch } from "wouter";

function App() {
  const auth = useAuth();
  if (auth.loading) return <div className="auth-loading"><span className="auth-loading-icon"><img src="/hanna-icon-192.png" alt="" /></span><p>Preparing your workspace…</p></div>;
  return <ErrorBoundary>{auth.isAuthenticated ? <Home user={auth.user} onLogout={auth.logout} /> : <Switch><Route path="/login"><LoginPage auth={auth} mode="login" /></Route><Route path="/create-account"><LoginPage auth={auth} mode="signup" /></Route><Route path="/"><LandingPage /></Route><Route><LandingPage /></Route></Switch>}</ErrorBoundary>;
}
export default App;
