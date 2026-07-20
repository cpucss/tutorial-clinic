import { QrCode, ShieldCheck } from "lucide-react";

import type { ToastMessage } from "../../../components/common/Feedback";
import { StudentAttendanceQr } from "../components/StudentAttendanceQr";

export function AttendanceCheckinPage({ onBack, onNotify }: { onBack: () => void; onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="section-kicker">Attendance</div>
          <h1 className="page-heading">My attendance QR</h1>
          <p className="page-description">Show your personal QR to the administrator who is recording attendance.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>View attendance history</button>
      </header>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_330px]">
        <section className="rounded-xl bg-white p-5 demo-card">
          <StudentAttendanceQr onNotify={onNotify} />
        </section>
        <aside className="rounded-xl bg-[#1C1C1C] p-5 text-white">
          <QrCode size={28} color="#F5A623" />
          <h2 className="mt-4 text-lg font-bold">How to check in</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-white/70">
            <li>1. Open this personal QR when you arrive.</li>
            <li>2. Ask the administrator to select your clinic session.</li>
            <li>3. Let the administrator scan and confirm your code.</li>
          </ol>
          <div className="mt-6 flex gap-3 rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/70">
            <ShieldCheck className="shrink-0 text-[#F5A623]" size={20} />
            <p>Your QR is random and expires after five minutes. Generate a new one if the timer runs out.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
