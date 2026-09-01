import { useCallback, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { initializeFirebase, loadFirebaseConfig } from "@/lib/firebase";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};
let authPromise: Promise<Auth> | null = null;
const getAuthClient = () => {
  if (!authPromise) authPromise = loadFirebaseConfig().then(initializeFirebase);
  return authPromise;
};
async function prepareAuth() {
  const auth = await getAuthClient();
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

export function useAuth(options?: UseAuthOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    getAuthClient()
      .then(auth => {
        if (disposed) return;
        unsubscribe = onAuthStateChanged(auth, nextUser => {
          if (!disposed) {
            setUser(nextUser);
            setLoading(false);
          }
        });
      })
      .catch(reason => {
        if (!disposed) {
          setError(
            reason instanceof Error
              ? reason
              : new Error("Authentication is unavailable.")
          );
          setLoading(false);
        }
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);
  const run = useCallback(async (action: (auth: Auth) => Promise<unknown>) => {
    setError(null);
    try {
      return await action(await prepareAuth());
    } catch (reason) {
      const nextError =
        reason instanceof Error ? reason : new Error("Authentication failed.");
      setError(nextError);
      throw nextError;
    }
  }, []);
  const loginWithEmail = useCallback(
    (email: string, password: string) =>
      run(auth => signInWithEmailAndPassword(auth, email.trim(), password)),
    [run]
  );
  const registerWithEmail = useCallback(
    (name: string, email: string, password: string) =>
      run(async auth => {
        const credentials = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (name.trim())
          await updateProfile(credentials.user, { displayName: name.trim() });
        return credentials;
      }),
    [run]
  );
  const loginWithGoogle = useCallback(
    () => run(auth => signInWithPopup(auth, new GoogleAuthProvider())),
    [run]
  );
  const loginWithApple = useCallback(
    () => run(auth => signInWithPopup(auth, new OAuthProvider("apple.com"))),
    [run]
  );
  const loginWithGithub = useCallback(
    () => run(auth => signInWithPopup(auth, new GithubAuthProvider())),
    [run]
  );
  const logout = useCallback(async () => {
    await signOut(await getAuthClient());
  }, []);
  const refresh = useCallback(async () => {
    const auth = await getAuthClient();
    if (auth.currentUser) await auth.currentUser.getIdToken(true);
  }, []);
  useEffect(() => {
    if (!options?.redirectOnUnauthenticated || loading) return;
    if (
      !user &&
      options.redirectPath &&
      window.location.pathname !== options.redirectPath
    )
      window.location.assign(options.redirectPath);
  }, [
    loading,
    options?.redirectOnUnauthenticated,
    options?.redirectPath,
    user,
  ]);
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithApple,
    loginWithGithub,
    refresh,
    logout,
  };
}
export async function getFirebaseIdToken() {
  return (await getAuthClient()).currentUser?.getIdToken() ?? null;
}
