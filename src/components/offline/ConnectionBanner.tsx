// Global connection and sync status banner.
// Displays online/offline state and pending sync count.

import { motion, AnimatePresence } from "motion/react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useSyncStatus } from "../../hooks/useSyncStatus";

interface ConnectionBannerProps {
  userId: string | null;
}

export function ConnectionBanner({ userId }: ConnectionBannerProps) {
  const isOnline = useNetworkStatus();
  const { pendingCount } = useSyncStatus(userId);

  let message: string;
  let bgColor: string;
  let textColor: string;
  let Icon: typeof WifiOff;

  if (isOnline && pendingCount === 0) {
    return null;
  } else if (isOnline && pendingCount > 0) {
    message = `Saving ${pendingCount} pending change${pendingCount > 1 ? "s" : ""}...`;
    bgColor = "#EEF2FF";
    textColor = "#3730A3";
    Icon = RefreshCw;
  } else if (!isOnline && pendingCount > 0) {
    message = `Offline - ${pendingCount} change${pendingCount > 1 ? "s are" : " is"} waiting for a connection`;
    bgColor = "#FEF3C7";
    textColor = "#92400E";
    Icon = WifiOff;
  } else {
    message = "Offline - showing the latest available information";
    bgColor = "#FEF3C7";
    textColor = "#92400E";
    Icon = WifiOff;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          background: bgColor,
          color: textColor,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "13px",
          fontWeight: 500,
          zIndex: 9999,
          width: "100%",
        }}
      >
        <Icon size={14} strokeWidth={2} />
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
