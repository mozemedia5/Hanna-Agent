import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };
type FirebaseUser = { name?: string | null; email?: string | null };

const defaultUser: FirebaseUser = {
  name: "Alex Morgan",
  email: "alex@example.com",
};

/** Firebase Auth seam. Default active state for single-tenant / local / Vercel operation. */
export function useAuth(options?: UseAuthOptions) {
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [user] = useState<FirebaseUser | null>(defaultUser);
  const logout = useCallback(async () => undefined, []);

  useEffect(() => {
    if (!options?.redirectOnUnauthenticated || typeof window === "undefined") return;
    if (!user && options.redirectPath && window.location.pathname !== options.redirectPath) {
      window.location.assign(options.redirectPath);
    }
  }, [options?.redirectOnUnauthenticated, options?.redirectPath, user]);

  return { user, loading, error, isAuthenticated: !!user, refresh: async () => undefined, logout };
}
