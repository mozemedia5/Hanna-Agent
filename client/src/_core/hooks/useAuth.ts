import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };
type FirebaseUser = { name?: string | null; email?: string | null };

/** Firebase Auth seam. It intentionally fails closed until the custom adapter is configured. */
export function useAuth(options?: UseAuthOptions) {
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [user] = useState<FirebaseUser | null>(null);
  const logout = useCallback(async () => undefined, []);

  useEffect(() => {
    if (!options?.redirectOnUnauthenticated || typeof window === "undefined") return;
    if (options.redirectPath && window.location.pathname !== options.redirectPath) window.location.assign(options.redirectPath);
  }, [options?.redirectOnUnauthenticated, options?.redirectPath]);

  return { user, loading, error, isAuthenticated: false, refresh: async () => undefined, logout };
}
