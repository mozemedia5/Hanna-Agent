import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";

type AuthApi = {
  error: Error | null;
  loginWithEmail: (email: string, password: string) => Promise<unknown>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<unknown>;
  loginWithGoogle: () => Promise<unknown>;
  loginWithApple: () => Promise<unknown>;
  loginWithGithub: () => Promise<unknown>;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-icon-svg">
      <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z" />
      <path fill="#34A853" d="M12 21.55c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.55Z" />
      <path fill="#FBBC05" d="M6.54 13.64A5.85 5.85 0 0 1 6.24 12c0-.57.1-1.12.3-1.64V7.83H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.17l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.33c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.42 14.63 2.45 12 2.45a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-icon-svg">
      <path fill="currentColor" d="M17.05 12.54c-.02-2.25 1.84-3.35 1.92-3.4a4.1 4.1 0 0 0-3.24-1.75c-1.37-.14-2.7.82-3.4.82-.72 0-1.8-.8-2.95-.77a4.35 4.35 0 0 0-3.65 2.23c-1.58 2.73-.4 6.75 1.11 8.96.76 1.08 1.64 2.28 2.8 2.24 1.13-.05 1.56-.72 2.93-.72 1.36 0 1.75.72 2.94.69 1.22-.02 1.98-1.09 2.72-2.18a8.92 8.92 0 0 0 1.24-2.53 3.9 3.9 0 0 1-2.42-3.59ZM14.82 5.94a3.95 3.95 0 0 0 .9-2.84 4.03 4.03 0 0 0-2.6 1.35 3.75 3.75 0 0 0-.93 2.73 3.34 3.34 0 0 0 2.63-1.24Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-icon-svg">
      <path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function HannaLogo() {
  return (
    <span className="hanna-brand">
      <span className="hanna-brand-icon"><img src="/hanna-icon-192.png" alt="" /></span>
      <span className="hanna-brand-name">Hanna</span>
    </span>
  );
}

export default function LoginPage({ auth, mode = "login" }: { auth: AuthApi; mode?: "login" | "signup" }) {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const isSignup = mode === "signup";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      if (isSignup) await auth.registerWithEmail(name, email, password);
      else await auth.loginWithEmail(email, password);
    } catch (reason) {
      setLocalError(
        reason instanceof Error
          ? reason.message.replace(/^Firebase: /, "").replace(/ \(auth\/[^)]+\)\.?$/, ".")
          : "Unable to authenticate."
      );
    } finally {
      setBusy(false);
    }
  };

  const social = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setLocalError("");
    try {
      await action();
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  };

  const message = localError || auth.error?.message;

  return (
    <main className="auth-shell">
      <div className="auth-background-shape" />
      <nav className="auth-nav container">
        <button className="landing-logo-button" onClick={() => navigate("/")}>
          <HannaLogo />
        </button>
        <button className="auth-back-link" onClick={() => navigate("/")}>
          <ArrowLeft size={14} /> Back to home
        </button>
      </nav>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-heading">
            <p className="eyebrow">
              {isSignup ? "Start with a clear place to think" : "Welcome back to Hanna"}
            </p>
            <h1>{isSignup ? "Create your account" : "Sign in"}</h1>
            <p>{isSignup ? "A quieter workspace for your best ideas." : "Your ideas are waiting where you left them."}</p>
          </div>

          <div className="social-grid">
            <button className="social-provider-btn social-google" disabled={busy} onClick={() => social(auth.loginWithGoogle)}>
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button className="social-provider-btn social-apple" disabled={busy} onClick={() => social(auth.loginWithApple)}>
              <AppleIcon />
              <span>Apple</span>
            </button>
            <button className="social-provider-btn social-github" disabled={busy} onClick={() => social(auth.loginWithGithub)}>
              <GitHubIcon />
              <span>GitHub</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <form onSubmit={submit} className="auth-form">
            {isSignup && (
              <label>
                <span>Name</span>
                <div className="input-wrap">
                  <Mail size={15} />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
            )}
            <label>
              <span>Email address</span>
              <div className="input-wrap">
                <Mail size={15} />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>
            <label>
              <span>Password</span>
              <div className="input-wrap">
                <LockKeyhole size={15} />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignup ? "At least 6 characters" : "Your password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            {!isSignup && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => setLocalError("Password reset is available from your Firebase email flow.")}
              >
                Forgot password?
              </button>
            )}
            {message && <p className="auth-error" role="alert">{message}</p>}
            <button className="auth-submit" disabled={busy}>
              {busy ? "Working…" : isSignup ? "Create account" : "Log in"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New user?"}{" "}
            <button onClick={() => navigate(isSignup ? "/login" : "/create-account")}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="auth-legal">
            By continuing, you agree to Hanna's <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
          </p>
        </div>
      </section>

      <p className="auth-footer-note">Private by default · Built for considered work</p>
    </main>
  );
}
