import { useEffect, useRef, useState, useCallback } from "react";
import { useAppData } from "../../context/AppDataContext";
import type { ToastMessage } from "../common/Feedback";
import { Clock } from "lucide-react";

export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
export const WARNING_THRESHOLD_MS = 4 * 60 * 1000; // 4 minutes (240,000 ms)
export const STORAGE_ACTIVITY_KEY = "ccs_session_last_active_ts";
export const BROADCAST_CHANNEL_NAME = "ccs_inactivity_channel";

interface InactivityManagerProps {
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
  onNavigateToLogin?: () => void;
}

export function InactivityManager({ onNotify, onNavigateToLogin }: InactivityManagerProps) {
  const { currentUser, logout } = useAppData();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const lastActiveRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const triggerLogout = useCallback(() => {
    if (isLoggingOutRef.current || !currentUser) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);

    try {
      channelRef.current?.postMessage({ type: "LOGOUT" });
    } catch {
      // BroadcastChannel ignore
    }

    logout();
    onNavigateToLogin?.();

    onNotify?.({
      tone: "warning",
      title: "Session timed out",
      description: "You were signed out after 5 minutes of inactivity. Please sign in again.",
    });
  }, [currentUser, logout, onNavigateToLogin, onNotify]);

  const recordActivity = useCallback(() => {
    if (!currentUser || isLoggingOutRef.current) return;
    const now = Date.now();
    lastActiveRef.current = now;
    setShowWarning(false);

    try {
      localStorage.setItem(STORAGE_ACTIVITY_KEY, String(now));
      channelRef.current?.postMessage({ type: "ACTIVITY", timestamp: now });
    } catch {
      // Ignore storage/channel errors
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setShowWarning(false);
      isLoggingOutRef.current = false;
      return;
    }

    isLoggingOutRef.current = false;
    const now = Date.now();
    lastActiveRef.current = now;
    localStorage.setItem(STORAGE_ACTIVITY_KEY, String(now));

    // Initialize BroadcastChannel
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current.onmessage = (event) => {
          if (event.data?.type === "LOGOUT") {
            triggerLogout();
          } else if (event.data?.type === "ACTIVITY") {
            lastActiveRef.current = Math.max(lastActiveRef.current, event.data.timestamp || Date.now());
            setShowWarning(false);
          }
        };
      }
    } catch {
      // Ignore fallback
    }

    // Storage event fallback for cross-tab sync
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_ACTIVITY_KEY && event.newValue) {
        const ts = Number(event.newValue);
        if (!isNaN(ts)) {
          lastActiveRef.current = Math.max(lastActiveRef.current, ts);
          setShowWarning(false);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // Throttled activity event listener
    let lastThrottled = 0;
    const handleUserInteraction = () => {
      const current = Date.now();
      if (current - lastThrottled > 1000) {
        lastThrottled = current;
        recordActivity();
      }
    };

    const events = ["keydown", "mousedown", "pointerdown", "touchstart", "scroll"] as const;
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Visibility change / window focus expiry validation
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible" && !isLoggingOutRef.current) {
        const stored = Number(localStorage.getItem(STORAGE_ACTIVITY_KEY) || 0);
        const effectiveLast = Math.max(lastActiveRef.current, stored);
        const elapsed = Date.now() - effectiveLast;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          triggerLogout();
        } else if (elapsed >= WARNING_THRESHOLD_MS) {
          setShowWarning(true);
          setRemainingSeconds(Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000)));
        } else {
          setShowWarning(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // 1-second interval timer
    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;
      const stored = Number(localStorage.getItem(STORAGE_ACTIVITY_KEY) || 0);
      const effectiveLast = Math.max(lastActiveRef.current, stored);
      const elapsed = Date.now() - effectiveLast;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        triggerLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        setRemainingSeconds(Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("storage", handleStorage);
      try {
        channelRef.current?.close();
      } catch {
        // Ignore
      }
    };
  }, [currentUser, recordActivity, triggerLogout]);

  if (!currentUser || !showWarning) return null;

  return (
    <div className="confirm-overlay" role="presentation">
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inactivity-warning-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon" style={{ background: "#FEF3C7", color: "#92400E" }}>
          <Clock size={20} />
        </div>
        <div className="confirm-copy">
          <h2 id="inactivity-warning-title">Session timeout warning</h2>
          <p>
            You have been inactive. For security, your session will automatically end in{" "}
            <strong className="text-amber-700">{remainingSeconds}s</strong>.
          </p>
        </div>
        <div className="confirm-actions">
          <button
            type="button"
            className="motion-button confirm-primary"
            style={{ background: "#12372A", color: "#FFFFFF" }}
            onClick={recordActivity}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
