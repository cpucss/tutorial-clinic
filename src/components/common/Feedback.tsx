import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type React from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
};

const toneStyles: Record<
  ToastTone,
  { bg: string; fg: string; border: string; icon: React.ReactNode }
> = {
  success: {
    bg: "#F2F7EC",
    fg: "#26351D",
    border: "#D8E6C9",
    icon: <CheckCircle2 size={16} strokeWidth={1.9} />,
  },
  error: {
    bg: "#FFF1F1",
    fg: "#6E1C1C",
    border: "#F1C7C7",
    icon: <AlertTriangle size={16} strokeWidth={1.9} />,
  },
  info: {
    bg: "#F4F1E8",
    fg: "#2D2D2D",
    border: "#E4DAC8",
    icon: <Info size={16} strokeWidth={1.9} />,
  },
  warning: {
    bg: "#FFF4DE",
    fg: "#5C3914",
    border: "#F1D6A6",
    icon: <AlertTriangle size={16} strokeWidth={1.9} />,
  },
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const palette =
    normalized.includes("approved") ||
    normalized.includes("confirmed") ||
    normalized.includes("present") ||
    normalized.includes("enabled") ||
    normalized.includes("upcoming") ||
    normalized.includes("completed")
      ? { bg: "#F2F7EC", fg: "#26351D", border: "#D8E6C9" }
      : normalized.includes("pending") ||
        normalized.includes("waiting") ||
        normalized.includes("live")
      ? { bg: "#FFF4DE", fg: "#5C3914", border: "#F1D6A6" }
      : normalized.includes("rejected") ||
        normalized.includes("absent") ||
        normalized.includes("cancelled") ||
        normalized.includes("full") ||
        normalized.includes("disabled")
      ? { bg: "#FFF1F1", fg: "#6E1C1C", border: "#F1C7C7" }
      : { bg: "#F4F1E8", fg: "#2D2D2D", border: "#E4DAC8" };

  return (
    <span
      className="status-badge"
      style={{
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
      }}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      <p className="empty-state-body">{body}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="motion-button empty-state-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function InlineNotice({
  tone = "info",
  title,
  children,
}: {
  tone?: ToastTone;
  title: string;
  children?: React.ReactNode;
}) {
  const style = toneStyles[tone];

  return (
    <div
      className="inline-notice"
      style={{
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
      }}
    >
      <span className="inline-notice-icon">{style.icon}</span>
      <div>
        <div className="inline-notice-title">{title}</div>
        {children && <div className="inline-notice-body">{children}</div>}
      </div>
    </div>
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-block" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} style={{ width: `${92 - index * 13}%` }} />
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep",
  tone = "warning",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ToastTone;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    controls()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCancel(); return; }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, open]);
  if (!open) return null;

  const isDanger = tone === "error" || tone === "warning";

  return (
    <div className="confirm-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className="confirm-icon"
          style={{
            background: isDanger ? "#FFF4DE" : "#F2F7EC",
            color: isDanger ? "#5C3914" : "#26351D",
          }}
        >
          {isDanger ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div className="confirm-copy">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{body}</p>
        </div>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel} className="motion-button confirm-cancel">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="motion-button confirm-primary"
            style={{
              background: isDanger ? "#B94B35" : "#F5A623",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const style = toneStyles[tone];

        return (
          <div
            key={toast.id}
            className="toast-card"
            style={{
              background: style.bg,
              color: style.fg,
              border: `1px solid ${style.border}`,
            }}
          >
            <span className="toast-icon">{style.icon}</span>
            <div className="toast-copy">
              <div className="toast-title">{toast.title}</div>
              {toast.description && <div className="toast-description">{toast.description}</div>}
            </div>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function LoadingLabel({ label = "Loading" }: { label?: string }) {
  return (
    <span className="loading-label">
      <Loader2 size={14} className="loading-spinner" />
      {label}
    </span>
  );
}
