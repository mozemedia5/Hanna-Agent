import {
  siAnthropic,
  siGithub,
  siGoogle,
  siGoogleads,
  siGmail,
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

export function GoogleIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogle} size={size} className={className} />;
}

export function LovableIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#FF4D4D"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
      />
    </svg>
  );
}

export function GeminiIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="gemini-gradient"
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1A73E8" />
          <stop offset="35%" stopColor="#8AB4F8" />
          <stop offset="70%" stopColor="#C5221F" />
          <stop offset="100%" stopColor="#F29900" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gemini-gradient)"
        d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z"
      />
    </svg>
  );
}

export function OpenAIIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siOpenai} size={size} className={className} />;
}

export function AnthropicIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siAnthropic} size={size} className={className} />;
}

export function GoogleDriveIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path fill="#FFC107" d="M7.8 2h8.4l5.3 9.3H13.1L7.8 2Z" />
      <path fill="#1976D2" d="M13.1 11.3H21.5L16.2 20.6H7.8l5.3-9.3Z" />
      <path fill="#4CAF50" d="M7.8 20.6L2.5 11.3 7.8 2h5.3L7.8 20.6Z" />
    </svg>
  );
}

export function InVideoIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="invideo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect
        width="20"
        height="20"
        x="2"
        y="2"
        rx="6"
        fill="url(#invideo-grad)"
      />
      <polygon fill="#FFFFFF" points="9.5,7.5 16.5,12 9.5,16.5" />
    </svg>
  );
}

export function MetaAdsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siMeta} size={size} className={className} />;
}

export function ShopifyIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siShopify} size={size} className={className} />;
}

export function SlackIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siSlack} size={size} className={className} />;
}

export function GmailIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGmail} size={size} className={className} />;
}

export function GitHubIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGithub} size={size} className={className} />;
}

export function VercelIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siVercel} size={size} className={className} />;
}

export function V0Icon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path fill="currentColor" d="M4 6h4v12H4V6Zm6 0h10v3h-7v2h7v7H10V6Z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siWhatsapp} size={size} className={className} />;
}

export function InstagramIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siInstagram} size={size} className={className} />;
}

export function TikTokIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siTiktok} size={size} className={className} />;
}

export function GoogleAdsIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siGoogleads} size={size} className={className} />;
}

export function GoogleTrendsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#4285F4"
        d="M3.5 18.5 9 13l4 4 7.5-7.5H16V7h7.5v7.5H21V9.5L13 17.5l-4-4-5.5 5.5H3.5Z"
      />
    </svg>
  );
}

export function HeyGenIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="heygen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A2BE2" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect
        width="20"
        height="20"
        x="2"
        y="2"
        rx="6"
        fill="url(#heygen-grad)"
      />
      <path fill="#FFFFFF" d="M8 6.5v11l8.5-5.5L8 6.5Z" />
    </svg>
  );
}

export function SynthesiaIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="6" fill="#5B21B6" />
      <path fill="#FFFFFF" d="M7 8h10v2.5H7V8Zm0 5.5h10V16H7v-2.5Z" />
    </svg>
  );
}

export function ElevenLabsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path fill="currentColor" d="M7 4h3.5v16H7V4Zm6.5 0H17v16h-3.5V4Z" />
    </svg>
  );
}

export function TakeAppIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="6" fill="#10B981" />
      <path fill="#FFFFFF" d="M7 7h10v3H13.5v7H10.5V10H7V7Z" />
    </svg>
  );
}

export function LinktreeIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#43E660"
        d="M13.51 7.15l2.45-2.45L18.4 7.14l-2.45 2.45h4.15v3.42h-3.51l3.51 3.51-2.44 2.44-3.52-3.51v4.95H9.86v-4.95l-3.51 3.51-2.45-2.44 3.51-3.51H3.9V9.59h4.15L5.6 7.14l2.44-2.44 2.45 2.45V2h3.02v5.15z"
      />
    </svg>
  );
}

export function CreatifyIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#6366F1"
        d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"
      />
    </svg>
  );
}

export function ZendropIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path fill="#06B6D4" d="M4 4h16l-12 12h12v4H4L16 8H4V4Z" />
    </svg>
  );
}

export function AutoDSIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <circle fill="#3B82F6" cx="12" cy="12" r="10" />
      <path
        fill="#FFFFFF"
        d="M12 6L6 18h3.5l1.2-2.7h2.6L14.5 18H18L12 6Zm-1 6.5L12 9l1 3.5h-2Z"
      />
    </svg>
  );
}

export function CJDropshippingIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" fill="#FF6000" rx="5" />
      <text
        x="12"
        y="16"
        fill="#FFFFFF"
        fontFamily="sans-serif"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
      >
        CJ
      </text>
    </svg>
  );
}

export function JulesIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" fill="#10B981" rx="5" />
      <path
        fill="#FFFFFF"
        d="M8 7v7a3 3 0 0 1-6 0V12h2v2a1 1 0 0 0 2 0V7h2Zm5 0h2v10h-2V7Z"
      />
    </svg>
  );
}

export function StitchIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#14B8A6"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Zm-1-13h2v10h-2V7Z"
      />
    </svg>
  );
}

export function GroqIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <circle fill="#F55036" cx="12" cy="12" r="10" />
      <text
        x="12"
        y="16"
        fill="#FFFFFF"
        fontFamily="sans-serif"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
      >
        G
      </text>
    </svg>
  );
}

export function YouTubeIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siYoutube} size={size} className={className} />;
}

export function PinterestIcon({ size = 20, className = "" }: IconProps) {
  return <SimpleBrandIcon icon={siPinterest} size={size} className={className} />;
}

export function renderBrandIcon(
  name: string,
  size = 18,
  className = ""
): React.ReactElement {
  const lower = name.toLowerCase();
  if (lower.includes("shopify"))
    return <ShopifyIcon size={size} className={className} />;
  if (lower.includes("gemini"))
    return <GeminiIcon size={size} className={className} />;
  if (lower.includes("openai") || lower.includes("gpt"))
    return <OpenAIIcon size={size} className={className} />;
  if (lower.includes("anthropic") || lower.includes("claude"))
    return <AnthropicIcon size={size} className={className} />;
  if (lower.includes("slack"))
    return <SlackIcon size={size} className={className} />;
  if (lower.includes("gmail"))
    return <GmailIcon size={size} className={className} />;
  if (lower.includes("github"))
    return <GitHubIcon size={size} className={className} />;
  if (lower.includes("v0")) return <V0Icon size={size} className={className} />;
  if (lower.includes("vercel"))
    return <VercelIcon size={size} className={className} />;
  if (lower.includes("whatsapp"))
    return <WhatsAppIcon size={size} className={className} />;
  if (lower.includes("instagram"))
    return <InstagramIcon size={size} className={className} />;
  if (lower.includes("tiktok"))
    return <TikTokIcon size={size} className={className} />;
  if (lower.includes("meta"))
    return <MetaAdsIcon size={size} className={className} />;
  if (lower.includes("google ad"))
    return <GoogleAdsIcon size={size} className={className} />;
  if (lower.includes("google drive") || lower.includes("google workspace"))
    return <GoogleDriveIcon size={size} className={className} />;
  if (lower.includes("google"))
    return <GoogleIcon size={size} className={className} />;
  if (lower.includes("lovable"))
    return <LovableIcon size={size} className={className} />;
  if (lower.includes("heygen"))
    return <HeyGenIcon size={size} className={className} />;
  if (lower.includes("invideo"))
    return <InVideoIcon size={size} className={className} />;
  if (lower.includes("synthesia"))
    return <SynthesiaIcon size={size} className={className} />;
  if (lower.includes("elevenlabs"))
    return <ElevenLabsIcon size={size} className={className} />;
  if (lower.includes("take"))
    return <TakeAppIcon size={size} className={className} />;
  if (lower.includes("linktree"))
    return <LinktreeIcon size={size} className={className} />;
  if (lower.includes("creatify"))
    return <CreatifyIcon size={size} className={className} />;
  if (lower.includes("zendrop"))
    return <ZendropIcon size={size} className={className} />;
  if (lower.includes("autods"))
    return <AutoDSIcon size={size} className={className} />;
  if (lower.includes("cj drop") || lower.includes("cjdropshipping"))
    return <CJDropshippingIcon size={size} className={className} />;
  if (lower.includes("jules"))
    return <JulesIcon size={size} className={className} />;
  if (lower.includes("stitch"))
    return <StitchIcon size={size} className={className} />;
  if (lower.includes("groq") || lower.includes("llama"))
    return <GroqIcon size={size} className={className} />;
  if (lower.includes("youtube"))
    return <YouTubeIcon size={size} className={className} />;
  if (lower.includes("pinterest"))
    return <PinterestIcon size={size} className={className} />;
  return <GoogleIcon size={size} className={className} />;
}
