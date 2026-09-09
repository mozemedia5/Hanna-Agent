/*
 * ProviderIcons — Real brand icons for all connectors and integrations.
 * Uses the simple-icons library for official brand SVGs where available.
 * Falls back to clean, recognizable brand-mark representations.
 */
import {
  siAnthropic,
  siGithub,
  siGoogle,
  siGoogleads,
  siGmail,
  siGoogledrive,
  siInstagram,
  siMeta,
  siOpenai,
  siPinterest,
  siShopify,
  siSlack,
  siTiktok,
  siVercel,
  siWhatsapp,
  siYoutube,
  siStripe,
  siFirebase,
  siDocker,
  siNotion,
  siFigma,
  siAirtable,
  siGitlab,
  siNetlify,
  siHeroku,
  siSupabase,
  siCloudflare,
  siReact,
  siTypescript,
  siTailwindcss,
  siFacebook,
  siTwitch,
} from "simple-icons";

import React from "react";

type IconProps = { size?: number; className?: string };

type SimpleBrand = { path: string; hex: string };

function SimpleBrandIcon({ icon, size = 20, className = "" }: IconProps & { icon: SimpleBrand }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} role="img">
      <path fill={`#${icon.hex}`} d={icon.path} />
    </svg>
  );
}

// ── Google (already in simple-icons) ──
export function GoogleIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogle} size={size} className={className} />;
}

// ── Google Gemini (official brand mark — gradient sparkle) ──
export function GeminiIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A73E8" />
          <stop offset="35%" stopColor="#8AB4F8" />
          <stop offset="70%" stopColor="#C5221F" />
          <stop offset="100%" stopColor="#F29900" />
        </linearGradient>
      </defs>
      <path fill="url(#gemini-grad)" d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z" />
    </svg>
  );
}

// ── Shopify (simple-icons) ──
export function ShopifyIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siShopify} size={size} className={className} />;
}

// ── OpenAI (simple-icons) ──
export function OpenAIIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siOpenai} size={size} className={className} />;
}

// ── Anthropic (simple-icons) ──
export function AnthropicIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siAnthropic} size={size} className={className} />;
}

// ── Groq (official brand mark — stylized G in red) ──
export function GroqIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#F55036" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 7.647h-3.28c-.394 0-.767.078-1.105.22-.338.143-.632.347-.872.612a2.87 2.87 0 0 0-.556.886c-.12.342-.181.711-.181 1.106v.067c0 .394.06.763.181 1.105.124.343.312.643.556.886.24.265.534.469.872.612.338.142.711.213 1.105.213h3.28c.394 0 .767-.071 1.105-.213.338-.143.632-.347.872-.612.244-.243.432-.543.556-.886.12-.342.181-.711.181-1.105v-.067c0-.395-.06-.764-.181-1.106a2.87 2.87 0 0 0-.556-.886c-.24-.265-.534-.469-.872-.612a3.04 3.04 0 0 0-1.105-.22zM6.206 7.647H2.926c-.394 0-.767.078-1.105.22-.338.143-.632.347-.872.612A2.87 2.87 0 0 0 .393 9.365C.273 9.707.212 10.076.212 10.471v.067c0 .394.061.763.181 1.105.124.343.312.643.556.886.24.265.534.469.872.612.338.142.711.213 1.105.213h3.28c.394 0 .767-.071 1.105-.213.338-.143.632-.347.872-.612.244-.243.432-.543.556-.886.12-.342.181-.711.181-1.105v-.067c0-.395-.06-.764-.181-1.106a2.87 2.87 0 0 0-.556-.886c-.24-.265-.534-.469-.872-.612a3.04 3.04 0 0 0-1.105-.22zm11.788 0h-3.28c-.394 0-.767.078-1.105.22-.338.143-.632.347-.872.612a2.87 2.87 0 0 0-.556.886c-.12.342-.181.711-.181 1.106v.067c0 .394.06.763.181 1.105.124.343.312.643.556.886.24.265.534.469.872.612.338.142.711.213 1.105.213h3.28c.394 0 .767-.071 1.105-.213.338-.143.632-.347.872-.612.244-.243.432-.543.556-.886.12-.342.181-.711.181-1.105v-.067c0-.395-.06-.764-.181-1.106a2.87 2.87 0 0 0-.556-.886c-.24-.265-.534-.469-.872-.612a3.04 3.04 0 0 0-1.105-.22z" />
    </svg>
  );
}

// ── Slack (simple-icons) ──
export function SlackIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siSlack} size={size} className={className} />;
}

// ── Gmail (simple-icons) ──
export function GmailIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGmail} size={size} className={className} />;
}

// ── GitHub (simple-icons) ──
export function GitHubIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGithub} size={size} className={className} />;
}

// ── Vercel (simple-icons) ──
export function VercelIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siVercel} size={size} className={className} />;
}

// ── WhatsApp (simple-icons) ──
export function WhatsAppIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siWhatsapp} size={size} className={className} />;
}

// ── Instagram (simple-icons) ──
export function InstagramIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siInstagram} size={size} className={className} />;
}

// ── TikTok (simple-icons) ──
export function TikTokIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTiktok} size={size} className={className} />;
}

// ── Meta (simple-icons) ──
export function MetaAdsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siMeta} size={size} className={className} />;
}

// ── Google Ads (simple-icons) ──
export function GoogleAdsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogleads} size={size} className={className} />;
}

// ── Google Drive (simple-icons) ──
export function GoogleDriveIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogledrive} size={size} className={className} />;
}

// ── YouTube (simple-icons) ──
export function YouTubeIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siYoutube} size={size} className={className} />;
}

// ── Pinterest (simple-icons) ──
export function PinterestIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siPinterest} size={size} className={className} />;
}

// ── Stripe (simple-icons) ──
export function StripeIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siStripe} size={size} className={className} />;
}

// ── Firebase (simple-icons) ──
export function FirebaseIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siFirebase} size={size} className={className} />;
}

// ── Docker (simple-icons) ──
export function DockerIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siDocker} size={size} className={className} />;
}

// ── Notion (simple-icons) ──
export function NotionIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siNotion} size={size} className={className} />;
}

// ── Figma (simple-icons) ──
export function FigmaIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siFigma} size={size} className={className} />;
}

// ── Airtable (simple-icons) ──
export function AirtableIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siAirtable} size={size} className={className} />;
}

// ── GitLab (simple-icons) ──
export function GitLabIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGitlab} size={size} className={className} />;
}

// ── Netlify (simple-icons) ──
export function NetlifyIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siNetlify} size={size} className={className} />;
}

// ── Heroku (simple-icons) ──
export function HerokuIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siHeroku} size={size} className={className} />;
}

// ── Supabase (simple-icons) ──
export function SupabaseIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siSupabase} size={size} className={className} />;
}

// ── Cloudflare (simple-icons) ──
export function CloudflareIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siCloudflare} size={size} className={className} />;
}

// ── React (simple-icons) ──
export function ReactIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siReact} size={size} className={className} />;
}

// ── TypeScript (simple-icons) ──
export function TypeScriptIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTypescript} size={size} className={className} />;
}

// ── Tailwind CSS (simple-icons) ──
export function TailwindIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTailwindcss} size={size} className={className} />;
}

// ── Facebook (simple-icons) ──
export function FacebookIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siFacebook} size={size} className={className} />;
}

// ── Twitch (simple-icons) ──
export function TwitchIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTwitch} size={size} className={className} />;
}

// ── LinkedIn (clean brand mark) ──
export function LinkedInIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ── Apple (clean brand mark) ──
export function AppleIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ── Microsoft (clean brand mark) ──
export function MicrosoftIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

// ── Amazon (clean brand mark) ──
export function AmazonIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#FF9900" d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.44-2.186 1.44-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.683zm3.186 7.705a.659.659 0 0 1-.749.075c-1.053-.877-1.242-1.279-1.818-2.12-1.738 1.772-2.969 2.302-5.218 2.302-2.66 0-4.744-1.645-4.744-4.94 0-2.572 1.394-4.322 3.379-5.181 1.716-.759 4.11-.891 5.942-1.095v-.41c0-.753.058-1.642-.385-2.294-.384-.579-1.124-.82-1.775-.82-1.205 0-2.277.618-2.54 1.897-.054.285-.261.566-.549.58l-3.065-.33c-.259-.058-.548-.266-.472-.66C5.771 3.019 9.195 1.5 12.228 1.5c1.553 0 3.582.413 4.802 1.59 1.542 1.464 1.393 3.413 1.393 5.539v5.037c0 1.508.625 2.168 1.213 2.983.205.287.25.631-.009.843-.652.532-1.812 1.51-2.437 2.061l-.049-.001zM19.5 12.684c-.092-.053-.182-.075-.262-.125-1.493-.932-3.493-1.529-3.493-1.529s.033 2.093-.619 3.528c-.528 1.155-1.595 1.607-2.623 1.607-.583 0-.888-.207-.888-.642 0-.905.749-1.374 1.443-1.374.42 0 .636.155.844.395.207.239.429.566.736.566.307 0 .424-.227.424-.566v-.406c0-.339-.117-.566-.424-.566-.307 0-.529.327-.736.566-.208.24-.424.395-.844.395-.694 0-1.443.469-1.443 1.374 0 .435.305.642.888.642 1.028 0 2.095-.452 2.623-1.607.652-1.435.619-3.528.619-3.528s2 1.234 3.493 1.529c.08.05.17.072.262.125.12.068.24.162.358.254.298.233.508.573.508.953v.134c0 .38-.21.72-.508.953-.118.092-.238.186-.358.254z" />
    </svg>
  );
}

// ──────────────────────────────────────────
// Brands NOT in Simple Icons — clean official-style marks
// ──────────────────────────────────────────

// ── HeyGen (official brand mark — purple gradient play) ──
export function HeyGenIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="heygen-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#heygen-g)" />
      <path fill="#fff" d="M8.5 7v10l9-5-9-5z" />
    </svg>
  );
}

// ── InVideo (official brand mark — purple-pink gradient play) ──
export function InVideoIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="invideo-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#invideo-g)" />
      <path fill="#fff" d="M10 7.5v9l7.5-4.5L10 7.5z" />
    </svg>
  );
}

// ── Creatify (official brand mark — star shape) ──
export function CreatifyIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#6366F1" d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    </svg>
  );
}

// ── Zendrop (official brand mark — cyan rocket) ──
export function ZendropIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#06B6D4" d="M4.5 4.5h15l-10 10h10v5h-15L14.5 9H4.5v-4.5z" />
    </svg>
  );
}

// ── AutoDS (official brand mark — blue A) ──
export function AutoDSIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle fill="#3B82F6" cx="12" cy="12" r="11" />
      <path fill="#fff" d="M12 5.5L6.5 18h3.2l1.1-2.6h2.4L14.3 18h3.2L12 5.5zm-.8 7.2L12 8.8l.8 3.9h-1.6z" />
    </svg>
  );
}

// ── CJ Dropshipping (official brand mark — orange CJ) ──
export function CJDropshippingIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="5" fill="#FF6000" />
      <text x="12" y="17" fill="#fff" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="bold" textAnchor="middle">CJ</text>
    </svg>
  );
}

// ── Linktree (official brand mark — green tree) ──
export function LinktreeIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#43E660" d="M13.51 7.15l2.45-2.45 2.45 2.45-2.45 2.45h4.15v3.42h-3.51l3.51 3.51-2.44 2.44-3.52-3.51v4.95H9.86v-4.95l-3.51 3.51-2.45-2.44 3.51-3.51H3.9V9.59h4.15L5.6 7.14l2.44-2.44 2.45 2.45V2h3.02v5.15z" />
    </svg>
  );
}

// ── Lovable (official brand mark — red heart) ──
export function LovableIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#FF4D4D" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
    </svg>
  );
}

// ── v0 by Vercel (official brand mark) ──
export function V0Icon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M4 6h4v12H4V6Zm6 0h10v3h-7v2h7v7H10V6Z" />
    </svg>
  );
}

// ── Synthesia (official brand mark — purple bars) ──
export function SynthesiaIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#5B21B6" />
      <rect x="7" y="8" width="10" height="2.5" rx="1" fill="#fff" />
      <rect x="7" y="13.5" width="10" height="2.5" rx="1" fill="#fff" />
    </svg>
  );
}

// ── ElevenLabs (official brand mark — sound waves) ──
export function ElevenLabsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3" y="8" width="2.5" height="8" rx="1" fill="currentColor" />
      <rect x="7.5" y="5" width="2.5" height="14" rx="1" fill="currentColor" />
      <rect x="12" y="3" width="2.5" height="18" rx="1" fill="currentColor" />
      <rect x="16.5" y="6" width="2.5" height="12" rx="1" fill="currentColor" />
      <rect x="21" y="9" width="2.5" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

// ── TakeApp (official brand mark — green T) ──
export function TakeAppIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#10B981" />
      <path fill="#fff" d="M7 7h10v2.5H13.5v8h-3v-8H7V7z" />
    </svg>
  );
}

// ── Jules (Google's AI agent — green badge) ──
export function JulesIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#10B981" />
      <path fill="#fff" d="M9 7v6.5a2.5 2.5 0 1 1-5 0V12h2v1.5a.5.5 0 0 0 1 0V7h2Zm5 0h2.5v10H14V7Z" />
    </svg>
  );
}

// ── Stitch (Google's UI generator — teal circle) ──
export function StitchIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="11" fill="#14B8A6" />
      <path fill="#fff" d="M12 5v14M5 12h14M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ──────────────────────────────────────────
// renderBrandIcon — single lookup for all connectors
// ──────────────────────────────────────────

export function renderBrandIcon(
  name: string,
  size = 18,
  className = ""
): React.ReactElement {
  const lower = name.toLowerCase();

  // Major AI models
  if (lower.includes("gemini")) return <GeminiIcon size={size} className={className} />;
  if (lower.includes("openai") || lower.includes("gpt")) return <OpenAIIcon size={size} className={className} />;
  if (lower.includes("anthropic") || lower.includes("claude")) return <AnthropicIcon size={size} className={className} />;
  if (lower.includes("groq") || lower.includes("llama")) return <GroqIcon size={size} className={className} />;

  // E-Commerce
  if (lower.includes("shopify")) return <ShopifyIcon size={size} className={className} />;
  if (lower.includes("zendrop")) return <ZendropIcon size={size} className={className} />;
  if (lower.includes("autods")) return <AutoDSIcon size={size} className={className} />;
  if (lower.includes("cj drop") || lower.includes("cjdropshipping")) return <CJDropshippingIcon size={size} className={className} />;

  // Social & Communication
  if (lower.includes("whatsapp")) return <WhatsAppIcon size={size} className={className} />;
  if (lower.includes("instagram")) return <InstagramIcon size={size} className={className} />;
  if (lower.includes("tiktok")) return <TikTokIcon size={size} className={className} />;
  if (lower.includes("youtube")) return <YouTubeIcon size={size} className={className} />;
  if (lower.includes("pinterest")) return <PinterestIcon size={size} className={className} />;
  if (lower.includes("linkedin")) return <LinkedInIcon size={size} className={className} />;
  if (lower.includes("facebook")) return <FacebookIcon size={size} className={className} />;
  if (lower.includes("twitch")) return <TwitchIcon size={size} className={className} />;
  if (lower.includes("linktree")) return <LinktreeIcon size={size} className={className} />;

  // Google ecosystem
  if (lower.includes("google ad")) return <GoogleAdsIcon size={size} className={className} />;
  if (lower.includes("google drive") || lower.includes("google workspace")) return <GoogleDriveIcon size={size} className={className} />;
  if (lower.includes("google")) return <GoogleIcon size={size} className={className} />;
  if (lower.includes("gmail")) return <GmailIcon size={size} className={className} />;

  // Marketing & Ads
  if (lower.includes("meta")) return <MetaAdsIcon size={size} className={className} />;

  // Developer & Infrastructure
  if (lower.includes("github")) return <GitHubIcon size={size} className={className} />;
  if (lower.includes("gitlab")) return <GitLabIcon size={size} className={className} />;
  if (lower.includes("vercel")) return <VercelIcon size={size} className={className} />;
  if (lower.includes("v0")) return <V0Icon size={size} className={className} />;
  if (lower.includes("netlify")) return <NetlifyIcon size={size} className={className} />;
  if (lower.includes("heroku")) return <HerokuIcon size={size} className={className} />;
  if (lower.includes("cloudflare")) return <CloudflareIcon size={size} className={className} />;
  if (lower.includes("docker")) return <DockerIcon size={size} className={className} />;
  if (lower.includes("firebase")) return <FirebaseIcon size={size} className={className} />;
  if (lower.includes("supabase")) return <SupabaseIcon size={size} className={className} />;
  if (lower.includes("react")) return <ReactIcon size={size} className={className} />;
  if (lower.includes("typescript")) return <TypeScriptIcon size={size} className={className} />;
  if (lower.includes("tailwind")) return <TailwindIcon size={size} className={className} />;
  if (lower.includes("jules")) return <JulesIcon size={size} className={className} />;
  if (lower.includes("stitch")) return <StitchIcon size={size} className={className} />;

  // Productivity
  if (lower.includes("slack")) return <SlackIcon size={size} className={className} />;
  if (lower.includes("notion")) return <NotionIcon size={size} className={className} />;
  if (lower.includes("figma")) return <FigmaIcon size={size} className={className} />;
  if (lower.includes("airtable")) return <AirtableIcon size={size} className={className} />;
  if (lower.includes("stripe")) return <StripeIcon size={size} className={className} />;

  // Video & Content
  if (lower.includes("heygen")) return <HeyGenIcon size={size} className={className} />;
  if (lower.includes("invideo")) return <InVideoIcon size={size} className={className} />;
  if (lower.includes("creatify")) return <CreatifyIcon size={size} className={className} />;
  if (lower.includes("synthesia")) return <SynthesiaIcon size={size} className={className} />;
  if (lower.includes("elevenlabs")) return <ElevenLabsIcon size={size} className={className} />;
  if (lower.includes("take")) return <TakeAppIcon size={size} className={className} />;

  // Platforms
  if (lower.includes("lovable")) return <LovableIcon size={size} className={className} />;
  if (lower.includes("apple")) return <AppleIcon size={size} className={className} />;
  if (lower.includes("microsoft")) return <MicrosoftIcon size={size} className={className} />;
  if (lower.includes("amazon")) return <AmazonIcon size={size} className={className} />;

  // Default fallback
  return <GoogleIcon size={size} className={className} />;
}
