import { ArrowRight, Check, ChevronDown, Command, Layers3, LockKeyhole, Sparkles, WandSparkles } from "lucide-react";
import { useLocation } from "wouter";

function HannaLogo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="hanna-brand" aria-label="Hanna">
      <span className="hanna-brand-icon"><img src="/hanna-icon-192.png" alt="" /></span>
      {withWordmark && <span className="hanna-brand-name">Hanna</span>}
    </span>
  );
}

const features = [
  { icon: WandSparkles, index: "01", title: "From thought to next step", body: "Bring the half-formed idea. Hanna gives it shape, structure, and a clear place to begin." },
  { icon: Layers3, index: "02", title: "One calm command center", body: "Keep research, drafts, decisions, and conversations together instead of scattered across tabs." },
  { icon: LockKeyhole, index: "03", title: "Private by default", body: "Your workspace is designed for considered work, with your data and attention treated with care." },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const go = (path: string) => navigate(path);
  return (
    <main className="landing-page">
      <nav className="landing-nav container">
        <button className="landing-logo-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><HannaLogo /></button>
        <div className="landing-nav-links"><a href="#how-it-works">How it works</a><a href="#principles">Principles</a><a href="#changelog">Changelog</a></div>
        <div className="landing-nav-actions"><button className="landing-text-link" onClick={() => go("/login")}>Sign in</button><button className="landing-dark-button" onClick={() => go("/create-account")}>Get started <ArrowRight size={15} /></button></div>
      </nav>

      <section className="landing-hero container">
        <div className="landing-hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A clearer way to work with AI</p><h1>Make room for<br /><em>better thinking.</em></h1><p className="landing-lede">Hanna is a quiet AI workspace for the questions worth asking, the ideas worth shaping, and the work that deserves your full attention.</p><div className="landing-hero-actions"><button className="landing-dark-button landing-primary-button" onClick={() => go("/create-account")}>Start thinking clearly <ArrowRight size={16} /></button><a className="landing-inline-link" href="#how-it-works">See how it works <ChevronDown size={15} /></a></div><div className="landing-note"><Check size={14} /> Free to start · No credit card required</div></div>
        <div className="landing-hero-visual" aria-label="Hanna workspace preview"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-card hero-card-back"><span>THOUGHT / 001</span><strong>A place for the<br />important things.</strong></div><div className="hero-card hero-card-front"><div className="hero-card-top"><HannaLogo withWordmark={false} /><span><span className="live-dot" /> ready</span></div><p className="hero-card-label">TODAY'S PROMPT</p><h2>What would you like<br />to make clearer?</h2><div className="hero-card-input"><span>Start with a question...</span><span className="hero-card-send"><ArrowRight size={14} /></span></div><div className="hero-card-footer"><span><Command size={12} /> K</span><span>Hanna Lite</span></div></div></div>
      </section>

      <section id="how-it-works" className="landing-section landing-section-light"><div className="container"><div className="section-heading"><p className="eyebrow">A little less noise</p><h2>Designed for the space<br /><em>between the lines.</em></h2><p>Most tools ask you to keep up. Hanna helps you slow down just enough to see what matters.</p></div><div className="feature-grid">{features.map(({ icon: Icon, index, title, body }) => <article className="feature-card" key={index}><div className="feature-card-top"><span className="feature-index">{index}</span><Icon size={21} strokeWidth={1.5} /></div><h3>{title}</h3><p>{body}</p><a href="#principles" aria-label={`Learn about ${title}`}>Explore <ArrowRight size={14} /></a></article>)}</div></div></section>

      <section id="principles" className="landing-section landing-principles"><div className="container principles-grid"><div><p className="eyebrow">The Hanna way</p><h2>Good work needs<br /><em>somewhere to land.</em></h2></div><div className="principles-copy"><p>Hanna brings the best parts of an AI assistant into a workspace that feels like yours. Ask, explore, draft, and return to the thread whenever you are ready.</p><div className="principle-list"><div><span>01</span><strong>Stay curious</strong><p>Follow the question before you rush to the answer.</p></div><div><span>02</span><strong>Keep context</strong><p>Let your thinking build on itself over time.</p></div><div><span>03</span><strong>Make progress</strong><p>Turn a good thought into a useful next move.</p></div></div></div></div></section>

      <section id="changelog" className="landing-cta container"><div className="landing-cta-inner"><div><p className="eyebrow">Your next clear thought</p><h2>Begin anywhere.<br /><em>Go somewhere good.</em></h2></div><button className="landing-light-button" onClick={() => go("/create-account")}>Create your workspace <ArrowRight size={16} /></button></div></section>
      <footer className="landing-footer container"><HannaLogo /><span>© 2026 Hanna</span><span>Private by default · Built for considered work</span></footer>
    </main>
  );
}
