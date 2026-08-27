export type HannaUser = { id: string; email?: string; displayName?: string };
export type UserSecretRecord = { providerId: string; encryptedValues: Record<string, string>; updatedAt: number };
export type FirebaseBackend = {
  authenticate(request: Request): Promise<HannaUser | null>;
  getSecret(userId: string, providerId: string): Promise<UserSecretRecord | null>;
  saveSecret(userId: string, record: UserSecretRecord): Promise<void>;
  deleteSecret(userId: string, providerId: string): Promise<void>;
  putFile(userId: string, data: Uint8Array, contentType: string): Promise<{ path: string; url?: string }>;
};

/**
 * Firebase is intentionally injected rather than imported here. This keeps
 * credentials and SDK initialization out of the client bundle and lets the
 * application supply Firebase Admin/Auth/Storage when configured.
 */
export function assertFirebaseBackend(backend: FirebaseBackend | undefined): asserts backend is FirebaseBackend {
  if (!backend) throw new Error("Firebase backend is not configured. Add the server-side Firebase adapter before enabling this operation.");
}
