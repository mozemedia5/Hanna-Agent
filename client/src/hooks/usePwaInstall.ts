import { useState, useEffect, useCallback } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface UsePwaInstallReturn {
  isInstalled: boolean;
  canInstallPrompt: boolean;
  installing: boolean;
  installApp: () => Promise<boolean>;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is running in standalone mode (already installed)
    const isStandalone =
      (typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof window !== "undefined" &&
        (window.navigator as unknown as { standalone?: boolean })?.standalone === true) ||
      (typeof document !== "undefined" && document.referrer?.includes("android-app://"));

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Listen for browser PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 3. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("hanna_install_banner_dismissed");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        }
        return false;
      } catch (err) {
        console.warn("PWA installation prompt failed:", err);
        return false;
      } finally {
        setInstalling(false);
      }
    } else {
      // Fallback instruction for iOS / browser without direct prompt
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(
          "To install Hanna on your device:\n\n" +
            "1. Open your browser menu (or Share button on iOS)\n" +
            "2. Tap 'Add to Home Screen' or 'Install App'\n" +
            "3. Launch Hanna instantly from your home screen or dock!"
        );
      }
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstallPrompt: !!deferredPrompt,
    installing,
    installApp,
  };
}
