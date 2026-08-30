import { useState } from "react";
import { CalendarCheck, CheckCircle2, Clock3, QrCode, Sparkles } from "lucide-react";

import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { formatDateTime } from "../../../utils/format";
import { AttendanceCheckinPage } from "./AttendanceCheckinPage";

export function AttendanceHistoryPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, currentUser } = useAppData();
  const [view, setView] = useState<"history" | "my-qr">("history");

  if (view === "my-qr") return <AttendanceCheckinPage onBack={() => setView("history")} onNotify={onNotify} />;

  const records = state.attendance
    .filter((item) => item.userId === currentUser?.id)
    .sort((a, b) => +new Date(b.checkedInAt) - +new Date(a.checkedInAt));
  const approved = records.filter((item) => item.status === "Approved");
  const pending = records.filter((item) => item.status === "Pending");
  const rate = records.length ? Math.round((approved.length / records.length) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Participation</div>
            <h1 className="page-heading">Attendance</h1>
            <p className="page-description">Show your personal QR to an administrator or enter a session code to record your attendance.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => setView("my-qr")}><QrCode size={15} /> Check in to session</button>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-4">
          <Summary icon={<CalendarCheck />} label="Total check-ins" value={records.length} />
          <Summary icon={<CheckCircle2 />} label="Approved" value={approved.length} />
          <Summary icon={<Clock3 />} label="Pending" value={pending.length} />
          <Summary icon={<Sparkles />} label="Approval rate" value={`${rate}%`} />
        </section>

        <section className="mt-5 overflow-hidden rounded-xl bg-white demo-card">
          <div className="flex items-center justify-between border-b border-[#F0EFE9] p-5">
            <div><h2 className="text-lg font-bold">Attendance history</h2><p className="mt-1 text-xs text-[#6F6F6F]">Points are awarded only after approval.</p></div>
            <StatusBadge status={`${records.length} records`} />
          </div>
          {records.length ? (
            <ul>{records.map((record) => {
              const event = state.events.find((item) => item.id === record.eventId);
              return <li key={record.id} className="history-row"><div><div className="font-bold">{event?.title ?? "Removed session"}</div><div className="mt-1 text-xs text-[#6F6F6F]">Checked in {formatDateTime(record.checkedInAt)} - {record.method} - {record.arrival}</div>{record.correctionNote && <div className="mt-2 text-xs text-[#B94B35]">Admin note: {record.correctionNote}</div>}</div><div className="flex items-center gap-3"><StatusBadge status={record.status} />{record.status === "Approved" && <strong className="text-[#9A5D0B]">+40</strong>}</div></li>;
            })}</ul>
          ) : (
            <div className="p-5"><EmptyState title="No attendance records" body="Attendance recorded by an administrator will appear here." actionLabel="Check in to session" onAction={() => setView("my-qr")} /></div>
          )}
        </section>
      </div>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-white p-4 demo-card"><div className="flex items-center justify-between text-[#F5A623]"><span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span><strong className="text-2xl text-[#1C1C1C]">{value}</strong></div><div className="mt-3 text-xs font-bold text-[#6F6F6F]">{label}</div></div>;
}
