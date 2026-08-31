/*
 * Hanna / Quiet Command Center
 * The app shell stays intentionally small: the Home page owns the focused workspace
 * while the existing error boundary protects the interface during interaction.
 */
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./_core/hooks/useAuth";

function App() {
  const auth = useAuth();
  if (auth.loading) return <div className="auth-loading"><span className="auth-mark">H</span><p>Preparing your workspace…</p></div>;
  return <ErrorBoundary>{auth.isAuthenticated ? <Home user={auth.user} onLogout={auth.logout} /> : <LoginPage auth={auth} />}</ErrorBoundary>;
}

export default App;
