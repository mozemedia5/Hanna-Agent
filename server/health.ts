import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

export async function handleProductionHealthDiagnostics(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  const groqConfigured = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  const firebaseConfigured = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID
  );
  const googleOauthConfigured = Boolean(
    (process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
    (process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  );
  const githubOauthConfigured = Boolean(
    (process.env.GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID) &&
    (process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_OAUTH_CLIENT_SECRET)
  );
  const encryptionConfigured = Boolean(
    process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.OAUTH_STATE_SECRET
  );

  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    services: {
      gemini: {
        configured: geminiConfigured,
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      },
      groq: {
        configured: groqConfigured,
      },
      firebaseAdmin: {
        configured: firebaseConfigured,
      },
      googleOAuth: {
        configured: googleOauthConfigured,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || "https://hanna-agent.vercel.app/api/oauth/google/callback",
      },
      githubOAuth: {
        configured: githubOauthConfigured,
        redirectUri: process.env.GITHUB_REDIRECT_URI || "https://hanna-agent.vercel.app/api/oauth/github/callback",
      },
      encryption: {
        configured: encryptionConfigured,
      },
    },
  };

  res.setHeader("cache-control", "no-store");
  res.status(200).json(status);
}
