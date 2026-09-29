import crypto from "node:crypto";

function secretKey() {
  const secret =
    process.env.HANNA_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === "test"
      ? "hanna-test-secret-key-32-chars!!"
      : undefined);

  if (!secret) {
    throw new Error(
      "Server encryption key is missing. HANNA_ENCRYPTION_KEY must be configured in environment variables."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptCredential(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptCredential(payload: string) {
  const [ivText, tagText, encryptedText] = payload.split(".");
  if (!ivText || !tagText || !encryptedText)
    throw new Error("Invalid encrypted credential");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    secretKey(),
    Buffer.from(ivText, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskCredential(value: string) {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}${"•".repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
}

export function credentialHint(value: string) {
  return value.length <= 4 ? "••••" : `…${value.slice(-4)}`;
}
