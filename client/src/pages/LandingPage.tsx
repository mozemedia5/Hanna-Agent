import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Cpu,
  Database,
  Eye,
  Globe,
  Layers,
  Lock,
  Moon,
  Play,
  Pause,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";

function HannaLogo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="hanna-brand" aria-label="Hanna">
      <span className="hanna-brand-icon">
        <img src="/hanna-icon-192.png" alt="Hanna AI" />
      </span>
      {withWordmark && <span className="hanna-brand-name">Hanna</span>}
    </span>
  );
}

const codeSnippets = {
  typescript: `import { HannaClient } from "@hanna/ai";

const hanna = new HannaClient({
  apiKey: process.env.HANNA_API_KEY,
  model: "gemini-3.6-flash",
});

// Stream intelligent multimodal reasoning
const response = await hanna.chat.completions.create({
  messages: [{ role: "user", content: "Optimize this agent loop for sub-100ms latency" }],
  tools: [{ type: "code_interpreter" }, { type: "web_search" }],
  stream: true,
});

for await (const chunk of response) {
  process.stdout.write(chunk.delta.content || "");
}`,
  python: `from hanna import HannaClient

client = HannaClient(
    api_key="hn_live_9f82d1c7a304e2",
    model="gemini-3.6-flash"
)

# Execute structured agent workflow with native tools
response = client.agents.run(
    prompt="Analyze dataset and schedule cleanup job",
    temperature=0.2,
    enable_tools=True
)

print(f"Status: {response.status} | Output: {response.text}")`,
  curl: `curl https://api.hanna.ai/v1/chat/completions \\
  -H "Authorization: Bearer $HANNA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-3.6-flash",
    "messages": [{"role": "user", "content": "Explain agentic routing"}],
    "temperature": 0.3
  }'`,
};

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        !document.documentElement.classList.contains("light")
      );
    }
    return true;
  });

  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "interactive">(
    "video"
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeCodeLang, setActiveCodeLang] = useState<
    "typescript" | "python" | "curl"
  >("typescript");
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    "gemini-3.6" | "gemini-2.5"
  >("gemini-3.6");
  const [multimodalTab, setMultimodalTab] = useState<"code" | "web" | "db">(
    "code"
  );
  const [simulatedTerminalStep, setSimulatedTerminalStep] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTerminalStep(prev => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <main className="landing-page-v2">
      {/* Sticky Translucent Top Navigation Bar */}
      <header className="landing-header-sticky">
        <div className="container landing-nav-inner">
          <button
            className="landing-brand-button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Hanna Home"
          >
            <HannaLogo />
            <span className="landing-brand-badge">Workspace</span>
          </button>

          <nav className="landing-nav-links" aria-label="Main Navigation">
            <a href="#models">Models</a>
            <a href="#bento-features">Capabilities</a>
            <a href="#code-playground">Developer API</a>
            <a href="#solutions">Solutions</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              className="landing-nav-login"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>

            <button
              className="landing-nav-cta"
              onClick={() => navigate("/create-account")}
            >
              <span>Get started free</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-v2 container">
        <div className="hero-badge-wrap">
          <div className="hero-pill-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Next-Generation Intelligence</span>
            <span className="badge-dot" />
            <span className="badge-text-dim">Gemini 3.6 Flash</span>
          </div>
        </div>

        <h1 className="hero-title">
          Your personal assistant for study, store management, and{" "}
          <span className="gemini-gradient-text">everyday productivity.</span>
        </h1>

        <p className="hero-description">
          Hanna helps you learn step by step with interactive tutoring, manage
          Shopify store operations, run market research, produce videos, publish
          social media content, and automate daily tasks.
        </p>

        <div className="hero-cta-group">
          <button
            className="hero-primary-btn"
            onClick={() => navigate("/create-account")}
          >
            <span>Start building for free</span>
            <ArrowRight size={18} />
          </button>

          <a href="#demo-section" className="hero-secondary-btn">
            <Play size={16} className="play-icon" />
            <span>See live demo</span>
          </a>
        </div>

        <div className="hero-trust-bar">
          <div className="trust-item">
            <Check size={14} className="trust-check" />
            <span>Free tier included</span>
          </div>
          <span className="trust-divider">•</span>
          <div className="trust-item">
            <Check size={14} className="trust-check" />
            <span>No credit card required</span>
          </div>
          <span className="trust-divider">•</span>
          <div className="trust-item">
            <Check size={14} className="trust-check" />
            <span>Sub-100ms response time</span>
          </div>
        </div>

        {/* Hero Video & Media Integration Showcase */}
        <div id="demo-section" className="hero-media-container">
          <div className="hero-media-frame">
            {/* Top Toolbar */}
            <div className="media-frame-topbar">
              <div className="window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>

              <div className="media-tabs">
                <button
                  className={`media-tab ${activeMediaTab === "video" ? "is-active" : ""}`}
                  onClick={() => setActiveMediaTab("video")}
                >
                  <Play size={13} />
                  <span>Product Walkthrough</span>
                </button>
                <button
                  className={`media-tab ${activeMediaTab === "interactive" ? "is-active" : ""}`}
                  onClick={() => setActiveMediaTab("interactive")}
                >
                  <Sparkles size={13} />
                  <span>Live Interactive Preview</span>
                </button>
              </div>

              <div className="media-quality-tag">
                <span className="live-status-dot" />
                <span>Gemini 3.6 Engine</span>
              </div>
            </div>

            {/* Media Content Area */}
            <div className="media-viewport">
              {activeMediaTab === "video" ? (
                <div className="video-player-wrapper">
                  <div className="motion-graphic-hero">
                    <div className="graphic-grid-bg" />
                    <div className="graphic-glow-orb glow-orb-1" />
                    <div className="graphic-glow-orb glow-orb-2" />

                    {/* Animated Workspace Interface Mock */}
                    <div className="motion-ui-mock">
                      <div className="mock-sidebar">
                        <div className="mock-brand">
                          <HannaLogo withWordmark={false} />
                          <span>Hanna Studio</span>
                        </div>
                        <div className="mock-nav-item is-active">
                          <Cpu size={14} /> Models
                        </div>
                        <div className="mock-nav-item">
                          <Terminal size={14} /> Agent Runs
                        </div>
                        <div className="mock-nav-item">
                          <Database size={14} /> Connectors
                        </div>
                      </div>

                      <div className="mock-main">
                        <div className="mock-prompt-bar">
                          <Sparkles size={15} className="mock-sparkle" />
                          <span className="typing-effect">
                            Generate high-throughput data processing pipeline
                            with Gemini fallback...
                          </span>
                          <span className="mock-kbd">⌘ Enter</span>
                        </div>

                        <div className="mock-response-stream">
                          <div className="stream-badge">
                            <Zap size={12} /> Gemini 3.6 Flash · 84ms latency
                          </div>
                          <div className="stream-code-preview">
                            <span className="code-line">
                              <span className="c-kw">
                                export async function
                              </span>{" "}
                              <span className="c-fn">streamPipeline</span>(data)
                              &#123;
                            </span>
                            <span className="code-line">
                              &nbsp;&nbsp;<span className="c-kw">const</span>{" "}
                              engine = <span className="c-kw">new</span>{" "}
                              <span className="c-cls">HannaEngine</span>(&#123;
                              mode: <span className="c-str">"ultra-fast"</span>{" "}
                              &#125;);
                            </span>
                            <span className="code-line">
                              &nbsp;&nbsp;
                              <span className="c-kw">return await</span> engine.
                              <span className="c-fn">executeWorkflow</span>
                              (data);
                            </span>
                            <span className="code-line">&#125;</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Controls Overlay */}
                  <div className="video-controls-overlay">
                    <button
                      className="control-btn"
                      onClick={togglePlay}
                      aria-label="Toggle Play"
                    >
                      {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <div className="timeline-bar">
                      <div
                        className="timeline-progress"
                        style={{ width: "68%" }}
                      />
                    </div>
                    <button
                      className="control-btn"
                      onClick={toggleMute}
                      aria-label="Toggle Sound"
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="interactive-demo-wrapper">
                  <div className="interactive-demo-card">
                    <div className="demo-input-header">
                      <span className="demo-label">LIVE PROMPT PLAYGROUND</span>
                      <span className="demo-model-badge">Gemini 3.6 Flash</span>
                    </div>

                    <div className="demo-input-box">
                      <textarea
                        readOnly
                        value="Analyze this user feedback dataset and create an automated action plan with connector dispatch."
                      />
                      <button
                        className="demo-send-btn"
                        onClick={() =>
                          setSimulatedTerminalStep(s => (s + 1) % 4)
                        }
                      >
                        <span>Execute Prompt</span>
                        <Zap size={14} />
                      </button>
                    </div>

                    <div className="demo-output-stage">
                      <div className="stage-step">
                        <span className="step-num">01</span>
                        <div className="step-content">
                          <strong>Multimodal Context Analysis</strong>
                          <p>
                            Parsed 1,420 user entries across text, images, and
                            telemetry in 42ms.
                          </p>
                        </div>
                        <Check size={16} className="step-check" />
                      </div>

                      <div className="stage-step">
                        <span className="step-num">02</span>
                        <div className="step-content">
                          <strong>Agentic Tool Invocation</strong>
                          <p>
                            Dispatched 3 parallel connector tools to Jira,
                            Slack, and Firestore.
                          </p>
                        </div>
                        <Check size={16} className="step-check" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box Dynamic Grid Section */}
      <section id="bento-features" className="landing-section container">
        <div className="section-header-centered">
          <div className="eyebrow-pill">
            <Layers size={13} />
            <span>Platform Capabilities</span>
          </div>
          <h2>
            Engineered for developers who demand{" "}
            <span className="gemini-gradient-text">speed and elegance.</span>
          </h2>
          <p className="section-subtext">
            Everything you need to construct, test, and deploy intelligent
            agents with complete reliability.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: Large Multimodal Reasoning */}
          <article className="bento-card card-large">
            <div className="bento-card-header">
              <div className="card-icon-badge">
                <Eye size={20} />
              </div>
              <span className="card-kicker">
                MULTIMODAL VISION &amp; CONTEXT
              </span>
            </div>
            <h3>See, reason, and act across media formats seamlessly.</h3>
            <p>
              Process high-resolution screenshots, code files, architecture
              diagrams, and raw text in a single unified prompt window.
            </p>

            <div className="multimodal-preview-widget">
              <div className="preview-chip-group">
                <button
                  className={`preview-chip ${multimodalTab === "code" ? "is-active" : ""}`}
                  onClick={() => setMultimodalTab("code")}
                >
                  <Code2 size={13} /> Study & Tutor
                </button>
                <button
                  className={`preview-chip ${multimodalTab === "web" ? "is-active" : ""}`}
                  onClick={() => setMultimodalTab("web")}
                >
                  <Globe size={13} /> Store & Shopify
                </button>
                <button
                  className={`preview-chip ${multimodalTab === "db" ? "is-active" : ""}`}
                  onClick={() => setMultimodalTab("db")}
                >
                  <Database size={13} /> Video & Social
                </button>
              </div>

              <div className="widget-display">
                <div className="display-code-block">
                  <code>
                    {multimodalTab === "code" &&
                      "// Interactive Study Mode\nHanna analyzes your uploaded PDF/notes step by step:\n1. Explains key concepts Socratically\n2. Quizzes you on core definitions\n3. Summarizes complex formulas and case studies"}
                    {multimodalTab === "web" &&
                      "// Shopify & Store Management\nHanna syncs inventory, audits store listings, creates product descriptions, and prepares order fulfillment workflows across Shopify and CJ Dropshipping."}
                    {multimodalTab === "db" &&
                      "// Video Generation & Social Media\nHanna drafts short-form video scripts, renders promo clips with HeyGen/InVideo, and schedules posts across TikTok, Instagram, and YouTube."}
                  </code>
                </div>
              </div>
            </div>
          </article>

          {/* Card 2: Sub-Second Tool Execution Simulator */}
          <article className="bento-card card-medium">
            <div className="bento-card-header">
              <div className="card-icon-badge">
                <Terminal size={20} />
              </div>
              <span className="card-kicker">AGENTIC TOOL EXECUTION</span>
            </div>
            <h3>Sub-second autonomous tool loops.</h3>
            <p>
              Invoke search, execute python code, run queries, and update
              external databases without manual intervention.
            </p>

            <div className="terminal-simulator">
              <div className="terminal-header">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-title">tool-runner.sh</span>
              </div>
              <div className="terminal-body">
                <p className="term-line">
                  <span className="term-prompt">&gt;</span> hanna run --tool
                  google_search
                </p>
                <p className="term-response">
                  {simulatedTerminalStep >= 0 &&
                    "✓ Fetching live documentation..."}
                </p>
                <p className="term-response">
                  {simulatedTerminalStep >= 1 &&
                    "✓ Parsed 12 search result objects"}
                </p>
                <p className="term-response highlighted">
                  {simulatedTerminalStep >= 2 &&
                    "⚡ Response synthesized in 64ms"}
                </p>
              </div>
            </div>
          </article>

          {/* Card 3: Enterprise Security & Privacy */}
          <article className="bento-card card-medium">
            <div className="bento-card-header">
              <div className="card-icon-badge">
                <ShieldCheck size={20} />
              </div>
              <span className="card-kicker">ENTERPRISE PRIVACY</span>
            </div>
            <h3>Private by default with AES-256 encryption.</h3>
            <p>
              Your code, credentials, and conversation data remain encrypted at
              rest and in transit. No zero-day retention.
            </p>

            <div className="security-badge-card">
              <div className="security-lock-glow">
                <Lock size={28} />
              </div>
              <div className="security-specs">
                <span>AES-256-GCM Encrypted</span>
                <strong>Zero Model Training On Private Data</strong>
              </div>
            </div>
          </article>

          {/* Card 4: Dynamic Model Router */}
          <article id="models" className="bento-card card-medium">
            <div className="bento-card-header">
              <div className="card-icon-badge">
                <Cpu size={20} />
              </div>
              <span className="card-kicker">INTELLIGENT MODEL ROUTING</span>
            </div>
            <h3>Adaptive routing across Gemini model tiers.</h3>
            <p>
              Switch dynamically between ultra-fast Flash and deep reasoning
              models based on task complexity.
            </p>

            <div className="model-selector-widget">
              <button
                className={`model-card-option ${selectedModel === "gemini-3.6" ? "is-selected" : ""}`}
                onClick={() => setSelectedModel("gemini-3.6")}
              >
                <div>
                  <strong>Gemini 3.6 Flash</strong>
                  <span>Next-gen speed &amp; reasoning</span>
                </div>
                <span className="latency-tag">&lt; 90ms</span>
              </button>

              <button
                className={`model-card-option ${selectedModel === "gemini-2.5" ? "is-selected" : ""}`}
                onClick={() => setSelectedModel("gemini-2.5")}
              >
                <div>
                  <strong>Gemini 2.5 Flash</strong>
                  <span>Balanced high-volume model</span>
                </div>
                <span className="latency-tag">&lt; 120ms</span>
              </button>
            </div>
          </article>

          {/* Card 5: Developer API Code Playground */}
          <article id="code-playground" className="bento-card card-wide">
            <div className="bento-card-header">
              <div className="card-icon-badge">
                <Code2 size={20} />
              </div>
              <span className="card-kicker">NATIVE SDKs &amp; REST API</span>
            </div>
            <h3>Build with clean, intuitive APIs in minutes.</h3>
            <p>
              Integrate Hanna into your TypeScript, Python, or standard HTTP
              workflows with minimal boilerplate.
            </p>

            <div className="code-playground-box">
              <div className="playground-tabs">
                <button
                  className={`pg-tab ${activeCodeLang === "typescript" ? "is-active" : ""}`}
                  onClick={() => setActiveCodeLang("typescript")}
                >
                  TypeScript
                </button>
                <button
                  className={`pg-tab ${activeCodeLang === "python" ? "is-active" : ""}`}
                  onClick={() => setActiveCodeLang("python")}
                >
                  Python
                </button>
                <button
                  className={`pg-tab ${activeCodeLang === "curl" ? "is-active" : ""}`}
                  onClick={() => setActiveCodeLang("curl")}
                >
                  cURL
                </button>

                <button
                  className="copy-code-btn"
                  onClick={handleCopyCode}
                  title="Copy snippet"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <pre className="playground-code">
                <code>{codeSnippets[activeCodeLang]}</code>
              </pre>
            </div>
          </article>
        </div>
      </section>

      {/* Developer Solutions & Principles Section */}
      <section
        id="solutions"
        className="landing-section solutions-section container"
      >
        <div className="section-header-centered">
          <div className="eyebrow-pill">
            <Wand2 size={13} />
            <span>Developer Experience</span>
          </div>
          <h2>
            Designed for clarity, focus, and{" "}
            <span className="gemini-gradient-text">considered work.</span>
          </h2>
        </div>

        <div className="principles-grid-v2">
          <div className="principle-card">
            <span className="principle-num">01</span>
            <h3>Study & Learning Companion</h3>
            <p>
              Upload lecture notes, textbooks, and research PDFs. Hanna acts as
              a step-by-step tutor that explains complex concepts clearly.
            </p>
          </div>

          <div className="principle-card">
            <span className="principle-num">02</span>
            <h3>Shopify Store & Commerce Hub</h3>
            <p>
              Manage products, analyze sales trends, draft marketing materials,
              and coordinate dropshipping fulfillment seamlessly.
            </p>
          </div>

          <div className="principle-card">
            <span className="principle-num">03</span>
            <h3>Video & Social Media Growth</h3>
            <p>
              Generate AI videos, conduct market research, and manage your
              social content strategy with Liverton and connected platforms.
            </p>
          </div>
        </div>

        {/* User Testimonials & Recommendations */}
        <div
          style={{
            marginTop: "48px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            className="principle-card"
            style={{ background: "var(--surface-raised)" }}
          >
            <p
              style={{
                fontStyle: "italic",
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              "Hanna transformed how our team manages Shopify stores and creates
              promotional videos. Having market research and social scheduling
              in one clean workspace saved us hours every week."
            </p>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
              — Liverton & Co.
            </strong>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-tertiary)",
              }}
            >
              E-Commerce Strategy & Marketing
            </span>
          </div>
          <div
            className="principle-card"
            style={{ background: "var(--surface-raised)" }}
          >
            <p
              style={{
                fontStyle: "italic",
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              "The Study mode is incredible. I uploaded my exam revision
              materials and Hanna explained every complex diagram and formula
              step-by-step like a personal tutor."
            </p>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
              — Maya S.
            </strong>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-tertiary)",
              }}
            >
              Graduate Student & Researcher
            </span>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="landing-cta-v2 container">
        <div className="cta-box-glow">
          <div className="cta-content">
            <h2>
              Ready to elevate your{" "}
              <span className="gemini-gradient-text">AI agent workflow?</span>
            </h2>
            <p>
              Get started with Hanna today. Free tier included with full access
              to Gemini models and developer tools.
            </p>
            <div className="cta-actions">
              <button
                className="cta-primary-btn"
                onClick={() => navigate("/create-account")}
              >
                <span>Create free account</span>
                <ArrowRight size={17} />
              </button>
              <button
                className="cta-secondary-btn"
                onClick={() => navigate("/login")}
              >
                <span>Sign in to existing workspace</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-v2 container">
        <div className="footer-top">
          <div className="footer-brand">
            <HannaLogo />
            <p>
              Quiet, high-performance AI workspace for study, store management,
              video generation, and productivity.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#models">Gemini Models</a>
              <a href="#bento-features">Capabilities</a>
              <a href="#code-playground">API Reference</a>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <a href="/login">Sign in</a>
              <a href="/create-account">Get Started</a>
              <a href="#solutions">Developer Guide</a>
            </div>

            <div className="footer-column">
              <h4>Platform</h4>
              <span>AES-256 Encrypted</span>
              <span>Sub-100ms Latency</span>
              <span>Private by Default</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Hanna Agent Inc. All rights reserved.</span>
          <span className="footer-tagline">
            Built for considered work · Google Gemini Aesthetic
          </span>
        </div>
      </footer>
    </main>
  );
}
