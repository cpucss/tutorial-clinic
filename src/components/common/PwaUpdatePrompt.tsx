import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleWaitingWorker = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setRegistration(reg);
        setNeedRefresh(true);
      }
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        handleWaitingWorker(reg);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (installing) {
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setRegistration(reg);
                setNeedRefresh(true);
              }
            });
          }
        });
      }
    });

    // Also listen for custom update event if emitted
    const handleCustomUpdate = () => setNeedRefresh(true);
    window.addEventListener("pwa-update-available", handleCustomUpdate);

    return () => {
      window.removeEventListener("pwa-update-available", handleCustomUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    // Listen for controlling service worker change to reload
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        window.location.reload();
      },
      { once: true }
    );
    // Fallback reload if controllerchange is delayed
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-[#D5CDBC] bg-white p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2"
      role="alert"
      aria-live="polite"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#12372A]/10 text-[#12372A]">
        <RefreshCw size={18} className="animate-spin-once" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-[#272727]">Update available</p>
        <p className="text-xs text-[#6F6F6F]">A new version of Tutorial Clinic is ready.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={handleUpdate}
          className="rounded-lg bg-[#12372A] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B4D3E] active:scale-95 transition-all"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="rounded-lg p-1 text-[#8A8377] hover:bg-[#FAF8F2] hover:text-[#272727] transition-colors"
          aria-label="Dismiss update notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
