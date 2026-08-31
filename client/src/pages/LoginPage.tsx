import { FormEvent, useState } from "react";
import { Github, Mail, ArrowRight, Chrome, Apple } from "lucide-react";
import type { User } from "firebase/auth";

type AuthApi = {
  error: Error | null;
  loginWithEmail: (email: string, password: string) => Promise<unknown>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<unknown>;
  loginWithGoogle: () => Promise<unknown>;
  loginWithApple: () => Promise<unknown>;
  loginWithGithub: () => Promise<unknown>;
};

export default function LoginPage({ auth }: { auth: AuthApi; user?: User | null }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setLocalError("");
    try { if (mode === "login") await auth.loginWithEmail(email, password); else await auth.registerWithEmail(name, email, password); }
    catch (reason) { setLocalError(reason instanceof Error ? reason.message.replace(/^Firebase: /, "").replace(/ \(auth\/[^)]+\)\.?$/, ".") : "Unable to authenticate."); }
    finally { setBusy(false); }
  };
  const social = async (action: () => Promise<unknown>) => { setBusy(true); setLocalError(""); try { await action(); } catch (reason) { setLocalError(reason instanceof Error ? reason.message : "Unable to authenticate."); } finally { setBusy(false); } };
  const message = localError || auth.error?.message;
  return <main className="auth-shell">
    <section className="auth-story">
      <div className="auth-brand"><span className="auth-mark">H</span><span>Hanna</span></div>
      <div className="auth-story-copy"><p className="auth-kicker">A calmer way to work with AI</p><h1>Make room for<br /><em>better thinking.</em></h1><p>Hanna turns scattered questions into clear next steps, thoughtful drafts, and useful momentum.</p><div className="auth-proof"><span>01</span><p>One quiet workspace for the work that matters.</p></div></div>
      <p className="auth-footnote">Private by default · Built for considered work</p>
    </section>
    <section className="auth-card-wrap"><div className="auth-card"><div className="auth-card-heading"><p className="auth-kicker">Welcome to Hanna</p><h2>{mode === "login" ? "Sign in to continue" : "Create your workspace"}</h2><p>{mode === "login" ? "Your ideas are waiting where you left them." : "Start with a clear place to think."}</p></div>
      <div className="social-grid"><button disabled={busy} onClick={() => social(auth.loginWithGoogle)}><Chrome size={17} /> Google</button><button disabled={busy} onClick={() => social(auth.loginWithApple)}><Apple size={17} /> Apple</button><button disabled={busy} onClick={() => social(auth.loginWithGithub)}><Github size={17} /> GitHub</button></div>
      <div className="auth-divider"><span>or continue with email</span></div>
      <form onSubmit={submit} className="auth-form">{mode === "signup" && <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required /></label>}<label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required /></label>{message && <p className="auth-error" role="alert">{message}</p>}<button className="auth-submit" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16} /></button></form>
      <p className="auth-switch">{mode === "login" ? "New to Hanna?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p><p className="auth-legal">By continuing, you agree to Hanna’s terms and acknowledge its privacy policy.</p>
    </div></section>
  </main>;
}
