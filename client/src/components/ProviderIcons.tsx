import React from "react";

type IconProps = { size?: number; className?: string };

export function GoogleIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z" />
      <path fill="#34A853" d="M12 21.55c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.55Z" />
      <path fill="#FBBC05" d="M6.54 13.64A5.85 5.85 0 0 1 6.24 12c0-.57.1-1.12.3-1.64V7.83H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.17l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.33c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.42 14.63 2.45 12 2.45a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z" />
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

export function GeminiIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A73E8" />
          <stop offset="35%" stopColor="#8AB4F8" />
          <stop offset="70%" stopColor="#C5221F" />
          <stop offset="100%" stopColor="#F29900" />
        </linearGradient>
      </defs>
      <path fill="url(#gemini-gradient)" d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z" />
    </svg>
  );
}

export function OpenAIIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6 6 0 0 0-6.44-2.88 5.99 5.99 0 0 0-4.52-2.02 6 6 0 0 0-5.71 4.15 6 6 0 0 0-4.08 2.95 6 6 0 0 0 .74 7.07 5.98 5.98 0 0 0 .51 4.91 6 6 0 0 0 6.44 2.88 6 6 0 0 0 4.53 2.02 6 6 0 0 0 5.71-4.15 6 6 0 0 0 4.07-2.95 6 6 0 0 0-.73-7.07ZM12 18.06a3.97 3.97 0 0 1-2.05-.57l.08-.14 3.42-1.97a.78.78 0 0 0 .39-.67v-4.78l1.43.83v4.73a3.99 3.99 0 0 1-3.27 2.57Zm-6.52-3.76a3.99 3.99 0 0 1-.41-3.23l.14.08 3.42 1.98a.78.78 0 0 0 .78 0l4.14-2.39v1.65l-4.1 2.37a3.99 3.99 0 0 1-3.97-.46Zm-1.12-7.51a3.98 3.98 0 0 1 2.45-2.12l.06.14 1.7 3.56a.78.78 0 0 0 .39.39l4.14 2.39-1.43.83-4.1-2.37a3.99 3.99 0 0 1-3.21-2.82Zm12.06 3.65-4.14-2.39 1.43-.83 4.1 2.37a3.99 3.99 0 0 1 3.21 2.82 3.99 3.99 0 0 1-2.45 2.12l-.06-.14-1.7-3.56a.78.78 0 0 0-.39-.39Zm2.25 3.03-.14-.08-3.42-1.98a.78.78 0 0 0-.78 0l-4.14 2.39V12.15l4.1-2.37a3.99 3.99 0 0 1 4.38 3.69Zm-8.67 2.94-1.43-.83v-4.73a3.99 3.99 0 0 1 3.27-2.57 3.97 3.97 0 0 1 2.05.57l-.08.14-3.42 1.97a.78.78 0 0 0-.39.67v4.78Z" />
    </svg>
  );
}

export function AnthropicIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#D4A574" d="M16.12 3H19.5L12 21h-3.38L16.12 3ZM4.5 21h3.38l2.25-5.4h5.62l.68 1.62H8.62L12 7.8l3.38 8.1H18.9L12.75 3h-1.5L4.5 21Z" />
    </svg>
  );
}

export function GoogleDriveIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#FFC107" d="M7.8 2h8.4l5.3 9.3H13.1L7.8 2Z" />
      <path fill="#1976D2" d="M13.1 11.3H21.5L16.2 20.6H7.8l5.3-9.3Z" />
      <path fill="#4CAF50" d="M7.8 20.6L2.5 11.3 7.8 2h5.3L7.8 20.6Z" />
    </svg>
  );
}

export function InVideoIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="invideo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" x="2" y="2" rx="6" fill="url(#invideo-grad)" />
      <polygon fill="#FFFFFF" points="9.5,7.5 16.5,12 9.5,16.5" />
    </svg>
  );
}

export function MetaAdsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#0081FB" d="M16.8 4c-2.3 0-4.2 1.5-5.3 3.3C10.4 5.5 8.5 4 6.2 4 2.8 4 0 7.2 0 11.2s2.8 7.2 6.2 7.2c2.3 0 4.2-1.5 5.3-3.3 1.1 1.8 3 3.3 5.3 3.3 3.4 0 6.2-3.2 6.2-7.2S20.2 4 16.8 4Zm-10.6 11c-1.8 0-3.2-1.7-3.2-3.8s1.4-3.8 3.2-3.8c1.7 0 3 1.6 3.9 3.8-.9 2.2-2.2 3.8-3.9 3.8Zm10.6 0c-1.7 0-3-1.6-3.9-3.8.9-2.2 2.2-3.8 3.9-3.8 1.8 0 3.2 1.7 3.2 3.8s-1.4 3.8-3.2 3.8Z" />
    </svg>
  );
}

export function ShopifyIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#95BF47" d="M18.8 6.5s-.8-.2-1.2.2c-.4.4-.8 1.3-.8 1.3s-1.1-.3-1.8 0c-.7.3-1.2 1.1-1.2 1.1s-.6-.2-.9.1c-.3.3-.4.8-.4.8s-4.3 1.1-5.1 4.3c-.8 3.2 1.1 8 1.1 8s4.8.7 8.3-1.8c3.5-2.5 4.3-7.5 4.3-7.5s.4-4-.4-5.2c-.8-1.2-1.9-1.3-1.9-1.3Z" />
      <path fill="#5E8E3E" d="m15 7.8-1.3 2.4.9 3.9s.8-.3 1.4-.7c.6-.4 1.1-1 1.1-1l-2.1-4.6Z" />
    </svg>
  );
}

export function SlackIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#E01E5A" d="M6 15a2.5 2.5 0 1 1-2.5-2.5H6V15Zm1.25 0a2.5 2.5 0 1 1 5 0v-2.5h-5V15Z" />
      <path fill="#36C5F0" d="M9 6a2.5 2.5 0 1 1 2.5-2.5V6H9Zm0 1.25a2.5 2.5 0 1 1 0 5h2.5v-5H9Z" />
      <path fill="#2EB67D" d="M18 9a2.5 2.5 0 1 1 2.5 2.5H18V9Zm-1.25 0a2.5 2.5 0 1 1-5 0v2.5h5V9Z" />
      <path fill="#ECB22E" d="M15 18a2.5 2.5 0 1 1-2.5 2.5V18H15Zm0-1.25a2.5 2.5 0 1 1 0-5h-2.5v5H15Z" />
    </svg>
  );
}

export function GmailIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M20 18h-2V9.5L12 14 6 9.5V18H4V6h1.5l6.5 4.8L18.5 6H20v12Z" />
      <path fill="#EA4335" d="m12 14 6-4.5V6l-6 4.5L6 6v3.5l6 4.5Z" />
    </svg>
  );
}

export function GitHubIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

export function VercelIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 2L24 22H0L12 2Z" />
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

export function WhatsAppIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#25D366" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.81 9.81 0 0 0 12.04 2Zm5.8 14.18c-.24.68-1.2 1.24-1.95 1.4-.51.11-1.18.2-3.42-.73-2.87-1.19-4.71-4.11-4.85-4.3-.14-.19-1.17-1.56-1.17-2.97 0-1.42.74-2.11 1.01-2.4.24-.26.53-.33.71-.33.18 0 .35.01.5.01.16.01.38-.06.59.45.21.52.73 1.78.79 1.91.06.13.1.28.01.44-.09.16-.13.26-.26.41-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.26.66 1.09 1.42 1.77.97.87 1.79 1.14 2.05 1.27.26.13.41.11.56-.06.15-.17.65-.76.82-1.02.17-.26.34-.21.57-.13.23.08 1.48.7 1.73.82.25.13.41.19.47.3.06.11.06.63-.18 1.31Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="url(#ig-grad)" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.85 3.9 2.31 7.15 2.23c1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 2.69.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.36-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.84a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="135%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function TikTokIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M16.6 5.82A4.28 4.28 0 0 1 14.54 2h-3.13v14.04a2.91 2.91 0 1 1-2.91-2.9 2.87 2.87 0 0 1 1.26.29V10.2A6.04 6.04 0 1 0 14.54 16V9.12A7.44 7.44 0 0 0 19 10.42V7.27a4.34 4.34 0 0 1-2.4-1.45Z" />
    </svg>
  );
}

export function GoogleAdsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#FBC02D" d="M3.6 17.6 10 3.8a2.5 2.5 0 0 1 4.5 2.3L8.1 19.9a2.5 2.5 0 0 1-4.5-2.3Z" />
      <path fill="#4285F4" d="m20.4 17.6-6.4-13.8a2.5 2.5 0 0 0-4.5 2.3l6.4 13.8a2.5 2.5 0 0 0 4.5-2.3Z" />
      <circle fill="#34A853" cx="6.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function GoogleTrendsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M3.5 18.5 9 13l4 4 7.5-7.5H16V7h7.5v7.5H21V9.5L13 17.5l-4-4-5.5 5.5H3.5Z" />
    </svg>
  );
}

export function HeyGenIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="heygen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A2BE2" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" x="2" y="2" rx="6" fill="url(#heygen-grad)" />
      <path fill="#FFFFFF" d="M8 6.5v11l8.5-5.5L8 6.5Z" />
    </svg>
  );
}

export function SynthesiaIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="6" fill="#5B21B6" />
      <path fill="#FFFFFF" d="M7 8h10v2.5H7V8Zm0 5.5h10V16H7v-2.5Z" />
    </svg>
  );
}

export function ElevenLabsIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M7 4h3.5v16H7V4Zm6.5 0H17v16h-3.5V4Z" />
    </svg>
  );
}

export function TakeAppIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="6" fill="#10B981" />
      <path fill="#FFFFFF" d="M7 7h10v3H13.5v7H10.5V10H7V7Z" />
    </svg>
  );
}

export function LinktreeIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#43E660" d="M13.51 7.15l2.45-2.45L18.4 7.14l-2.45 2.45h4.15v3.42h-3.51l3.51 3.51-2.44 2.44-3.52-3.51v4.95H9.86v-4.95l-3.51 3.51-2.45-2.44 3.51-3.51H3.9V9.59h4.15L5.6 7.14l2.44-2.44 2.45 2.45V2h3.02v5.15z" />
    </svg>
  );
}

export function CreatifyIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#6366F1" d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
    </svg>
  );
}

export function ZendropIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#06B6D4" d="M4 4h16l-12 12h12v4H4L16 8H4V4Z" />
    </svg>
  );
}

export function AutoDSIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle fill="#3B82F6" cx="12" cy="12" r="10" />
      <path fill="#FFFFFF" d="M12 6L6 18h3.5l1.2-2.7h2.6L14.5 18H18L12 6Zm-1 6.5L12 9l1 3.5h-2Z" />
    </svg>
  );
}

export function CJDropshippingIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" fill="#FF6000" rx="5" />
      <text x="12" y="16" fill="#FFFFFF" fontFamily="sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">CJ</text>
    </svg>
  );
}

export function JulesIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" fill="#10B981" rx="5" />
      <path fill="#FFFFFF" d="M8 7v7a3 3 0 0 1-6 0V12h2v2a1 1 0 0 0 2 0V7h2Zm5 0h2v10h-2V7Z" />
    </svg>
  );
}

export function StitchIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#14B8A6" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Zm-1-13h2v10h-2V7Z" />
    </svg>
  );
}

export function GroqIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle fill="#F55036" cx="12" cy="12" r="10" />
      <text x="12" y="16" fill="#FFFFFF" fontFamily="sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">G</text>
    </svg>
  );
}

export function YouTubeIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12c0 1.9.2 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.9.5-5.8 0-1.9-.2-3.9-.5-5.8z" />
      <polygon fill="#FFFFFF" points="9.6,15.6 15.8,12 9.6,8.4" />
    </svg>
  );
}

export function PinterestIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#E60023" d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.16-.1-.95-.2-2.42.04-3.47.22-.94 1.4-5.96 1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 3.99-.28 1.19.6 2.16 1.78 2.16 2.13 0 3.77-2.25 3.77-5.49 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.2 0 1.03.4 2.13.9 2.73.1.12.11.23.08.35-.09.38-.3.1.22-.38 1.54-.06.12-.17.16-.28.11-1.04-.48-1.7-2-1.7-3.22 0-3.93 2.86-7.54 8.24-7.54 4.33 0 7.7 3.09 7.7 7.21 0 4.3-2.71 7.76-6.47 7.76-1.26 0-2.45-.66-2.85-1.43l-.78 2.97c-.28 1.08-1.04 2.43-1.55 3.26C9.64 23.75 10.8 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0Z" />
    </svg>
  );
}

export function renderBrandIcon(name: string, size = 18, className = ""): React.ReactElement {
  const lower = name.toLowerCase();
  if (lower.includes("shopify")) return <ShopifyIcon size={size} className={className} />;
  if (lower.includes("gemini")) return <GeminiIcon size={size} className={className} />;
  if (lower.includes("openai") || lower.includes("gpt")) return <OpenAIIcon size={size} className={className} />;
  if (lower.includes("anthropic") || lower.includes("claude")) return <AnthropicIcon size={size} className={className} />;
  if (lower.includes("slack")) return <SlackIcon size={size} className={className} />;
  if (lower.includes("gmail")) return <GmailIcon size={size} className={className} />;
  if (lower.includes("github")) return <GitHubIcon size={size} className={className} />;
  if (lower.includes("v0")) return <V0Icon size={size} className={className} />;
  if (lower.includes("vercel")) return <VercelIcon size={size} className={className} />;
  if (lower.includes("whatsapp")) return <WhatsAppIcon size={size} className={className} />;
  if (lower.includes("instagram")) return <InstagramIcon size={size} className={className} />;
  if (lower.includes("tiktok")) return <TikTokIcon size={size} className={className} />;
  if (lower.includes("meta")) return <MetaAdsIcon size={size} className={className} />;
  if (lower.includes("google ad")) return <GoogleAdsIcon size={size} className={className} />;
  if (lower.includes("google drive") || lower.includes("google workspace")) return <GoogleDriveIcon size={size} className={className} />;
  if (lower.includes("google")) return <GoogleIcon size={size} className={className} />;
  if (lower.includes("lovable")) return <LovableIcon size={size} className={className} />;
  if (lower.includes("heygen")) return <HeyGenIcon size={size} className={className} />;
  if (lower.includes("invideo")) return <InVideoIcon size={size} className={className} />;
  if (lower.includes("synthesia")) return <SynthesiaIcon size={size} className={className} />;
  if (lower.includes("elevenlabs")) return <ElevenLabsIcon size={size} className={className} />;
  if (lower.includes("take")) return <TakeAppIcon size={size} className={className} />;
  if (lower.includes("linktree")) return <LinktreeIcon size={size} className={className} />;
  if (lower.includes("creatify")) return <CreatifyIcon size={size} className={className} />;
  if (lower.includes("zendrop")) return <ZendropIcon size={size} className={className} />;
  if (lower.includes("autods")) return <AutoDSIcon size={size} className={className} />;
  if (lower.includes("cj drop") || lower.includes("cjdropshipping")) return <CJDropshippingIcon size={size} className={className} />;
  if (lower.includes("jules")) return <JulesIcon size={size} className={className} />;
  if (lower.includes("stitch")) return <StitchIcon size={size} className={className} />;
  if (lower.includes("groq") || lower.includes("llama")) return <GroqIcon size={size} className={className} />;
  if (lower.includes("youtube")) return <YouTubeIcon size={size} className={className} />;
  if (lower.includes("pinterest")) return <PinterestIcon size={size} className={className} />;
  return <GoogleIcon size={size} className={className} />;
}
