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
  siGooglecalendar,
  siGooglemaps,
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
  siWoocommerce,
  siMailchimp,
  siHubspot,
  siIntercom,
  siJira,
  siZendesk,
  siSalesforce,
  siQuickbooks,
  siTwilio,
  siZapier,
  siAsana,
  siCanva,
  siClickup,
  siDropbox,
  siHuggingface,
  siLinear,
  siMake,
  siMetabase,
  siPaypal,
  siPerplexity,
  siPosthog,
  siTodoist,
  siTrello,
  siWebflow,
  siWordpress,
  siXero,
  siZapier as siZapierIcon,
  siZoom,
  siN8n,
  siTypeform,
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

// ── Google & Gemini ──
export function GoogleIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogle} size={size} className={className} />;
}

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

// ── Major AI Models & Developer Tools ──
export function ShopifyIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siShopify} size={size} className={className} />;
}

export function OpenAIIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siOpenai} size={size} className={className} />;
}

export function AnthropicIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siAnthropic} size={size} className={className} />;
}

export function SlackIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siSlack} size={size} className={className} />;
}

export function GmailIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGmail} size={size} className={className} />;
}

export function GoogleCalendarIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGooglecalendar} size={size} className={className} />;
}

export function GoogleMapsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGooglemaps} size={size} className={className} />;
}

export function GitHubIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGithub} size={size} className={className} />;
}

export function VercelIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siVercel} size={size} className={className} />;
}

export function WooCommerceIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siWoocommerce} size={size} className={className} />;
}

export function MailchimpIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siMailchimp} size={size} className={className} />;
}

export function HubSpotIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siHubspot} size={size} className={className} />;
}

export function IntercomIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siIntercom} size={size} className={className} />;
}

export function JiraIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siJira} size={size} className={className} />;
}

export function ZendeskIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siZendesk} size={size} className={className} />;
}

export function SalesforceIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siSalesforce} size={size} className={className} />;
}

export function QuickBooksIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siQuickbooks} size={size} className={className} />;
}

export function TwilioIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTwilio} size={size} className={className} />;
}

export function ZapierIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siZapier} size={size} className={className} />;
}

export function AsanaIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siAsana} size={size} className={className} />;
}

export function CanvaIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siCanva} size={size} className={className} />;
}

export function ClickUpIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siClickup} size={size} className={className} />;
}

export function CloudflareIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siCloudflare} size={size} className={className} />;
}

export function DropboxIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siDropbox} size={size} className={className} />;
}

export function HuggingFaceIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siHuggingface} size={size} className={className} />;
}

export function LinearIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siLinear} size={size} className={className} />;
}

export function MakeIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siMake} size={size} className={className} />;
}

export function MetabaseIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siMetabase} size={size} className={className} />;
}

export function PayPalIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siPaypal} size={size} className={className} />;
}

export function PerplexityIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siPerplexity} size={size} className={className} />;
}

export function PostHogIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siPosthog} size={size} className={className} />;
}

export function SupabaseIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siSupabase} size={size} className={className} />;
}

export function TodoistIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTodoist} size={size} className={className} />;
}

export function TrelloIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTrello} size={size} className={className} />;
}

export function WebflowIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siWebflow} size={size} className={className} />;
}

export function WordPressIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siWordpress} size={size} className={className} />;
}

export function XeroIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siXero} size={size} className={className} />;
}

export function ZoomIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siZoom} size={size} className={className} />;
}

export function N8nIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siN8n} size={size} className={className} />;
}

export function TypeformIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTypeform} size={size} className={className} />;
}

export function WhatsAppIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siWhatsapp} size={size} className={className} />;
}

export function FacebookIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siFacebook} size={size} className={className} />;
}

export function TwitchIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTwitch} size={size} className={className} />;
}

export function GitLabIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGitlab} size={size} className={className} />;
}

export function NetlifyIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siNetlify} size={size} className={className} />;
}

export function HerokuIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siHeroku} size={size} className={className} />;
}

export function DockerIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siDocker} size={size} className={className} />;
}

export function FirebaseIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siFirebase} size={size} className={className} />;
}

export function FigmaIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siFigma} size={size} className={className} />;
}

export function InstagramIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siInstagram} size={size} className={className} />;
}

export function TikTokIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTiktok} size={size} className={className} />;
}

export function MetaAdsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siMeta} size={size} className={className} />;
}

export function GoogleAdsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogleads} size={size} className={className} />;
}

export function GoogleDriveIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogledrive} size={size} className={className} />;
}

export function YouTubeIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siYoutube} size={size} className={className} />;
}

export function PinterestIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siPinterest} size={size} className={className} />;
}

export function StripeIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siStripe} size={size} className={className} />;
}

export function NotionIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siNotion} size={size} className={className} />;
}

export function AirtableIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siAirtable} size={size} className={className} />;
}

// ── Custom SVG Brand Marks ──
export function MondayIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF3366" />
      <path fill="#fff" d="M6 17V8h2.5l2.2 4.8L12.9 8H15.5v9H13v-5.2l-2 4.4h-1.2l-2-4.4V17H6z" />
    </svg>
  );
}

export function ApifyIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="11" fill="#00A2FF" />
      <path fill="#fff" d="M12 4l6 14h-3.2l-1.3-3.2H10.5L9.2 18H6l6-14zm0 4.2L10.8 12h2.4L12 8.2z" />
    </svg>
  );
}

export function KlaviyoIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="5" fill="#2B3131" />
      <path fill="#FF6B6B" d="M5 5h14v14H5z" />
      <path fill="#2B3131" d="M12 5l7 7-7 7-7-7z" />
    </svg>
  );
}

export function FirecrawlIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF4500" />
      <path fill="#fff" d="M12 3c0 4-3 6-3 9 0 3 2.5 5 5 5s5-2 5-5c0-4-4-5-4-9 0 0-3 1-3 0z" />
    </svg>
  );
}

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

export function CreatifyIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#6366F1" d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    </svg>
  );
}

export function ZendropIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#06B6D4" d="M4.5 4.5h15l-10 10h10v5h-15L14.5 9H4.5v-4.5z" />
    </svg>
  );
}

export function AutoDSIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle fill="#3B82F6" cx="12" cy="12" r="11" />
      <path fill="#fff" d="M12 5.5L6.5 18h3.2l1.1-2.6h2.4L14.3 18h3.2L12 5.5zm-.8 7.2L12 8.8l.8 3.9h-1.6z" />
    </svg>
  );
}

export function CJDropshippingIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="5" fill="#FF6000" />
      <text x="12" y="17" fill="#fff" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="bold" textAnchor="middle">CJ</text>
    </svg>
  );
}

export function LinktreeIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#43E660" d="M13.51 7.15l2.45-2.45 2.45 2.45-2.45 2.45h4.15v3.42h-3.51l3.51 3.51-2.44 2.44-3.52-3.51v4.95H9.86v-4.95l-3.51 3.51-2.45-2.44 3.51-3.51H3.9V9.59h4.15L5.6 7.14l2.44-2.44 2.45 2.45V2h3.02v5.15z" />
    </svg>
  );
}

export function LovableIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#FF4D4D" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
    </svg>
  );
}

export function V0Icon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M4 6h4v12H4V6Zm6 0h10v3h-7v2h7v7H10V6Z" />
    </svg>
  );
}

export function SynthesiaIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#5B21B6" />
      <rect x="7" y="8" width="10" height="2.5" rx="1" fill="#fff" />
      <rect x="7" y="13.5" width="10" height="2.5" rx="1" fill="#fff" />
    </svg>
  );
}

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

export function TakeAppIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#10B981" />
      <path fill="#fff" d="M7 7h10v2.5H13.5v8h-3v-8H7V7z" />
    </svg>
  );
}

export function JulesIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#10B981" />
      <path fill="#fff" d="M9 7v6.5a2.5 2.5 0 1 1-5 0V12h2v1.5a.5.5 0 0 0 1 0V7h2Zm5 0h2.5v10H14V7Z" />
    </svg>
  );
}

export function StitchIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="11" fill="#14B8A6" />
      <path fill="#fff" d="M12 5v14M5 12h14M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function OpenRouterIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="6" fill="#6366F1" />
      <circle cx="8" cy="12" r="2.5" fill="#fff" />
      <circle cx="16" cy="7" r="2.5" fill="#fff" />
      <circle cx="16" cy="17" r="2.5" fill="#fff" />
      <path d="M10 11l4-3M10 13l4 3" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function BeaconsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="11" fill="#FFDD00" />
      <path fill="#000" d="M12 4l2.5 5.5L20 12l-5.5 2.5L12 20l-2.5-5.5L4 12l5.5-2.5L12 4z" />
    </svg>
  );
}

// ──────────────────────────────────────────
// renderBrandIcon — lookup for all connectors
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
  if (lower.includes("openrouter")) return <OpenRouterIcon size={size} className={className} />;
  if (lower.includes("perplexity")) return <PerplexityIcon size={size} className={className} />;
  if (lower.includes("hugging")) return <HuggingFaceIcon size={size} className={className} />;

  // E-Commerce
  if (lower.includes("shopify")) return <ShopifyIcon size={size} className={className} />;
  if (lower.includes("woocommerce")) return <WooCommerceIcon size={size} className={className} />;
  if (lower.includes("zendrop")) return <ZendropIcon size={size} className={className} />;
  if (lower.includes("autods")) return <AutoDSIcon size={size} className={className} />;
  if (lower.includes("cj drop") || lower.includes("cjdropshipping")) return <CJDropshippingIcon size={size} className={className} />;
  if (lower.includes("beacons")) return <BeaconsIcon size={size} className={className} />;

  // Social & Communication
  if (lower.includes("whatsapp")) return <WhatsAppIcon size={size} className={className} />;
  if (lower.includes("instagram")) return <InstagramIcon size={size} className={className} />;
  if (lower.includes("tiktok")) return <TikTokIcon size={size} className={className} />;
  if (lower.includes("youtube")) return <YouTubeIcon size={size} className={className} />;
  if (lower.includes("pinterest")) return <PinterestIcon size={size} className={className} />;
  if (lower.includes("facebook")) return <FacebookIcon size={size} className={className} />;
  if (lower.includes("twitch")) return <TwitchIcon size={size} className={className} />;
  if (lower.includes("linktree")) return <LinktreeIcon size={size} className={className} />;

  // Google ecosystem
  if (lower.includes("google calendar")) return <GoogleCalendarIcon size={size} className={className} />;
  if (lower.includes("google maps")) return <GoogleMapsIcon size={size} className={className} />;
  if (lower.includes("google ad")) return <GoogleAdsIcon size={size} className={className} />;
  if (lower.includes("google drive") || lower.includes("google workspace")) return <GoogleDriveIcon size={size} className={className} />;
  if (lower.includes("google")) return <GoogleIcon size={size} className={className} />;
  if (lower.includes("gmail")) return <GmailIcon size={size} className={className} />;

  // Marketing & Finance
  if (lower.includes("meta")) return <MetaAdsIcon size={size} className={className} />;
  if (lower.includes("stripe")) return <StripeIcon size={size} className={className} />;
  if (lower.includes("paypal")) return <PayPalIcon size={size} className={className} />;
  if (lower.includes("quickbooks")) return <QuickBooksIcon size={size} className={className} />;
  if (lower.includes("xero")) return <XeroIcon size={size} className={className} />;
  if (lower.includes("mailchimp")) return <MailchimpIcon size={size} className={className} />;
  if (lower.includes("hubspot")) return <HubSpotIcon size={size} className={className} />;
  if (lower.includes("klaviyo")) return <KlaviyoIcon size={size} className={className} />;
  if (lower.includes("typeform")) return <TypeformIcon size={size} className={className} />;
  if (lower.includes("posthog")) return <PostHogIcon size={size} className={className} />;
  if (lower.includes("metabase")) return <MetabaseIcon size={size} className={className} />;

  // Developer & Workspace
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
  if (lower.includes("jules")) return <JulesIcon size={size} className={className} />;
  if (lower.includes("stitch")) return <StitchIcon size={size} className={className} />;
  if (lower.includes("linear")) return <LinearIcon size={size} className={className} />;
  if (lower.includes("firecrawl")) return <FirecrawlIcon size={size} className={className} />;
  if (lower.includes("apify")) return <ApifyIcon size={size} className={className} />;

  // Productivity & Business
  if (lower.includes("slack")) return <SlackIcon size={size} className={className} />;
  if (lower.includes("notion")) return <NotionIcon size={size} className={className} />;
  if (lower.includes("figma")) return <FigmaIcon size={size} className={className} />;
  if (lower.includes("airtable")) return <AirtableIcon size={size} className={className} />;
  if (lower.includes("asana")) return <AsanaIcon size={size} className={className} />;
  if (lower.includes("canva")) return <CanvaIcon size={size} className={className} />;
  if (lower.includes("clickup")) return <ClickUpIcon size={size} className={className} />;
  if (lower.includes("dropbox")) return <DropboxIcon size={size} className={className} />;
  if (lower.includes("intercom")) return <IntercomIcon size={size} className={className} />;
  if (lower.includes("jira")) return <JiraIcon size={size} className={className} />;
  if (lower.includes("zendesk")) return <ZendeskIcon size={size} className={className} />;
  if (lower.includes("salesforce")) return <SalesforceIcon size={size} className={className} />;
  if (lower.includes("twilio")) return <TwilioIcon size={size} className={className} />;
  if (lower.includes("zapier")) return <ZapierIcon size={size} className={className} />;
  if (lower.includes("todoist")) return <TodoistIcon size={size} className={className} />;
  if (lower.includes("trello")) return <TrelloIcon size={size} className={className} />;
  if (lower.includes("webflow")) return <WebflowIcon size={size} className={className} />;
  if (lower.includes("wordpress")) return <WordPressIcon size={size} className={className} />;
  if (lower.includes("zoom")) return <ZoomIcon size={size} className={className} />;
  if (lower.includes("monday")) return <MondayIcon size={size} className={className} />;
  if (lower.includes("make")) return <MakeIcon size={size} className={className} />;
  if (lower.includes("n8n")) return <N8nIcon size={size} className={className} />;

  // Video & Content
  if (lower.includes("heygen")) return <HeyGenIcon size={size} className={className} />;
  if (lower.includes("invideo")) return <InVideoIcon size={size} className={className} />;
  if (lower.includes("creatify")) return <CreatifyIcon size={size} className={className} />;
  if (lower.includes("synthesia")) return <SynthesiaIcon size={size} className={className} />;
  if (lower.includes("elevenlabs")) return <ElevenLabsIcon size={size} className={className} />;
  if (lower.includes("take")) return <TakeAppIcon size={size} className={className} />;
  if (lower.includes("lovable")) return <LovableIcon size={size} className={className} />;

  // Default fallback
  return <GoogleIcon size={size} className={className} />;
}
