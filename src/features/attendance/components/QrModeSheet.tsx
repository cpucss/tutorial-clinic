import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { AdminStudentQrScanner, StudentAttendanceQr } from "./StudentAttendanceQr";

export function QrModeSheet({
  onClose,
  onNotify,
}: {
  onClose: () => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { currentUser } = useAppData();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="confirm-overlay qr-mode-overlay" onMouseDown={onClose}>
      <section className="qr-mode-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-mode-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="qr-mode-header">
          <div>
            <div className="section-kicker">Attendance</div>
            <h2 id="qr-mode-title">{isAdmin ? "Scan student QR" : "My attendance QR"}</h2>
            <p>{isAdmin ? "Select a clinic session and scan the student's personal QR." : "Show this personal QR to the administrator recording attendance."}</p>
          </div>
          <button ref={closeRef} className="icon-button rounded-full bg-[#FAF8F2]" type="button" onClick={onClose} aria-label="Close attendance QR"><X size={17} /></button>
        </header>
        {isAdmin ? <AdminStudentQrScanner onNotify={onNotify} /> : <StudentAttendanceQr onNotify={onNotify} />}
      </section>
    </div>
  );
}
