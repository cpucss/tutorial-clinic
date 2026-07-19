import { useEffect, useRef } from "react";
import { Copy, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useAppData } from "../../../context/AppDataContext";
import { formatDateTime } from "../../../utils/format";
import { buildAttendanceQrPayload } from "../qr";

export function QrModal({ eventId, onClose, onCopied }: { eventId: string; onClose: () => void; onCopied?: () => void }) {
  const { state } = useAppData();
  const closeRef = useRef<HTMLButtonElement>(null);
  const event = state.events.find((item) => item.id === eventId);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (key: KeyboardEvent) => { if (key.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  if (!event) return null;
  const payload = buildAttendanceQrPayload(event.id, event.attendanceCode);
  const attendanceCode = event.attendanceCode;
  async function copy() { await navigator.clipboard.writeText(attendanceCode); onCopied?.(); }
  return <div className="confirm-overlay" onMouseDown={onClose}><div className="qr-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-title" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><div className="section-kicker">Scannable attendance QR</div><h2 id="qr-title">{event.title}</h2><p>{formatDateTime(event.date)} - {event.venue}</p></div><button ref={closeRef} className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose} aria-label="Close QR code"><X size={16} /></button></div><div className="qr-code-panel"><QRCodeSVG value={payload} size={220} level="M" marginSize={2} title={`Attendance QR for ${event.title}`} /></div><div className="qr-code-value"><span>{event.attendanceCode}</span><button onClick={copy}><Copy size={14} /> Copy code</button></div><p className="qr-help">This QR contains the session ID and attendance code. Scan it from the Attendance page or enter the code manually.</p></div></div>;
}
