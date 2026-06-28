"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __looplicInstallPrompt?: BeforeInstallPromptEvent | null;
    __looplicPwaInstallSetup?: boolean;
  }
}

const installAcceptedKey = "looplic-install-app-installed";
const installChoiceTimeoutMs = 60000;
const installReadinessCheckMs = 1500;

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(userAgent);
  return isIos && isSafari;
}

function isMobileChrome() {
  const userAgent = window.navigator.userAgent;
  return /android/i.test(userAgent) && /chrome|crios/i.test(userAgent) && !/edg/i.test(userAgent);
}

function getInstallSupportLabel() {
  if (typeof window === "undefined") return "Install not ready";
  if (isIosSafari()) return "Add to Home Screen";
  if (isMobileChrome()) return "Install not ready";
  return "Install not ready";
}

function waitForInstallChoice(promptEvent: BeforeInstallPromptEvent) {
  return Promise.race([
    promptEvent.userChoice.catch(() => undefined),
    new Promise<undefined>((resolve) => {
      window.setTimeout(() => resolve(undefined), installChoiceTimeoutMs);
    }),
  ]);
}

export function InstallAppButton({ compact = false, menuItem = false }: { compact?: boolean; menuItem?: boolean }) {
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const [iosInstallInstructions, setIosInstallInstructions] = useState(false);

  useEffect(() => {
    if (!window.__looplicPwaInstallSetup && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const syncState = () => {
      const nextInstalled = isStandaloneApp() || window.localStorage.getItem(installAcceptedKey) === "true";
      setInstalled(nextInstalled);
      setPromptReady(Boolean(window.__looplicInstallPrompt));
      setIosInstallInstructions(!nextInstalled && !window.__looplicInstallPrompt && isIosSafari());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__looplicInstallPrompt = event as BeforeInstallPromptEvent;
      syncState();
    };

    const handleInstalled = () => {
      window.localStorage.setItem(installAcceptedKey, "true");
      window.__looplicInstallPrompt = null;
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("looplic-install-prompt-ready", syncState);
    window.addEventListener("looplic-service-worker-ready", syncState);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("looplic-app-installed", handleInstalled);
    window.addEventListener("focus", syncState);
    document.addEventListener("visibilitychange", syncState);
    syncState();
    const readinessInterval = window.setInterval(syncState, installReadinessCheckMs);

    return () => {
      window.clearInterval(readinessInterval);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("looplic-install-prompt-ready", syncState);
      window.removeEventListener("looplic-service-worker-ready", syncState);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("looplic-app-installed", handleInstalled);
      window.removeEventListener("focus", syncState);
      document.removeEventListener("visibilitychange", syncState);
    };
  }, []);

  async function ensureServiceWorkerReady() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    await navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    await navigator.serviceWorker.ready.catch(() => undefined);
    window.dispatchEvent(new Event("looplic-service-worker-ready"));
  }

  async function installApp() {
    if (installing) {
      return;
    }

    if (installed || isStandaloneApp()) {
      setInstalled(true);
      toast.info("Looplic is already installed on this device.");
      return;
    }

    if (!promptReady && isIosSafari()) {
      toast.info("Tap Share, then Add to Home Screen.");
      return;
    }

    if (!promptReady) {
      if (isMobileChrome()) {
        toast.info("Install will unlock when Chrome finishes checking this app.");
      } else {
        toast.info("Install will unlock when Chrome or Edge reports this app is ready.");
      }
      return;
    }

    const promptEvent = window.__looplicInstallPrompt;
    if (!promptEvent) {
      setPromptReady(false);
      return;
    }

    setInstalling(true);
    await ensureServiceWorkerReady();

    try {
      await promptEvent.prompt();
      const choice = await waitForInstallChoice(promptEvent);
      window.__looplicInstallPrompt = null;
      setPromptReady(false);

      if (choice?.outcome === "accepted") {
        window.localStorage.setItem(installAcceptedKey, "true");
        setInstalled(true);
        toast.success("Looplic app install started.");
      } else if (choice?.outcome === "dismissed") {
        toast.info("Install was dismissed. You can try again from the profile menu.");
      } else {
        toast.info("Install prompt did not finish. Open this page in Chrome or Edge and try again.");
      }
    } catch {
      window.__looplicInstallPrompt = null;
      setPromptReady(false);
      toast.error("Unable to start app install in this browser.");
    } finally {
      setInstalling(false);
    }
  }

  const canInstall = !installed && (promptReady || iosInstallInstructions);
  const disabled = installing || installed || !canInstall;
  const label = installed ? "App installed" : installing ? "Installing..." : promptReady ? "Install app" : getInstallSupportLabel();

  return (
    <button
      type="button"
      onClick={installApp}
      disabled={disabled}
      title={installed ? "Looplic is already installed on this device." : promptReady ? "Install Looplic on this device." : "Install unlocks after the browser confirms this app is installable."}
      className={
        menuItem
          ? "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60"
          : compact
          ? "inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-70"
          : "inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700 transition-colors hover:bg-sky-100 hover:text-sky-800 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-70"
      }
    >
      <Download className="size-4" />
      {label}
    </button>
  );
}
