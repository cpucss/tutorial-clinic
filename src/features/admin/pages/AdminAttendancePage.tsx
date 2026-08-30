import { useMemo, useState } from "react";
import { Check, Download, Pencil, ScanLine, Search, X } from "lucide-react";

import { EmptyState, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { AttendanceRecord } from "../../../types/app";
import { downloadCsv, formatDateTime } from "../../../utils/format";
import { AdminStudentQrScanner } from "../../attendance/components/StudentAttendanceQr";

export function AdminAttendancePage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, moderateAttendance } = useAppData();
  const [query, setQuery] = useState("");
  const [eventId, setEventId] = useState("All");
  const [status, setStatus] = useState("All");
  const [editor, setEditor] = useState<AttendanceRecord | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const records = useMemo(() => state.attendance
    .filter((record) => {
      const user = state.users.find((item) => item.id === record.userId);
      return (!query || `${user?.name} ${user?.studentId}`.toLowerCase().includes(query.toLowerCase()))
        && (eventId === "All" || record.eventId === eventId)
        && (status === "All" || record.status === status);
    })
    .sort((a, b) => +new Date(b.checkedInAt) - +new Date(a.checkedInAt)), [eventId, query, state.attendance, state.users, status]);

  async function approve(record: AttendanceRecord) {
    const result = await moderateAttendance(record.id, "Approved");
    onNotify?.({
      tone: result.ok ? "success" : "error",
      title: result.ok ? "Attendance approved" : "Attendance not updated",
      description: result.ok ? "The student received 40 points and a notification." : result.message,
    });
  }

  function exportRows() {
    downloadCsv("tutorial-clinic-attendance.csv", records.map((record) => ({
      student: state.users.find((item) => item.id === record.userId)?.name,
      student_id: state.users.find((item) => item.id === record.userId)?.studentId,
      session: state.events.find((item) => item.id === record.eventId)?.title,
      checked_in: formatDateTime(record.checkedInAt),
      arrival: record.arrival,
      method: record.method,
      status: record.status,
      admin_note: record.correctionNote,
    })));
    onNotify?.({ tone: "success", title: "Attendance CSV exported", description: `${records.length} visible records were included.` });
  }

  const pending = state.attendance.filter((item) => item.status === "Pending").length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Attendance management</div>
            <h1 className="page-heading">Attendance review</h1>
            <p className="page-description">Scan student QR codes, review records, and document corrections.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="primary-button" type="button" onClick={() => setScannerOpen(true)}><ScanLine size={15} /> Scan student QR</button>
            <button className="secondary-button" type="button" onClick={exportRows}><Download size={15} /> Export CSV</button>
          </div>
        </header>

        <section className="mt-6 grid gap-3 rounded-xl bg-white p-4 demo-card md:grid-cols-[1fr_240px_180px]">
          <label className="search-field"><Search size={15} /><span className="sr-only">Search students</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or ID" /></label>
          <label className="compact-field"><span>Session</span><select value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="All">All sessions</option>{state.events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
          <label className="compact-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{["All", "Pending", "Approved", "Rejected"].map((item) => <option key={item}>{item}</option>)}</select></label>
        </section>

        <div className="mt-4 flex gap-2"><StatusBadge status={`${pending} pending`} /><StatusBadge status={`${records.length} visible`} /></div>
        <section className="mt-4 overflow-hidden rounded-xl bg-white demo-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Session</th><th>Check-in</th><th>Arrival</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{records.map((record) => {
                const user = state.users.find((item) => item.id === record.userId);
                const event = state.events.find((item) => item.id === record.eventId);
                return <tr key={record.id}><td><strong>{user?.name ?? "Unknown"}</strong><small>{user?.studentId}</small></td><td>{event?.title ?? "Removed session"}</td><td>{formatDateTime(record.checkedInAt)}<small>{record.method}</small></td><td>{record.arrival}</td><td><StatusBadge status={record.status} />{record.correctionNote && <small>{record.correctionNote}</small>}</td><td><div className="table-actions">{record.status === "Pending" && <button type="button" onClick={() => approve(record)}><Check size={14} /> Approve</button>}<button type="button" onClick={() => setEditor(record)}><Pencil size={14} /> Correct</button></div></td></tr>;
              })}</tbody>
            </table>
          </div>
          {!records.length && <div className="p-5"><EmptyState title="No attendance records found" body="Admin-scanned student attendance will appear here." /></div>}
        </section>
      </div>

      {editor && <AttendanceEditor record={editor} onClose={() => setEditor(null)} onNotify={onNotify} />}
      {scannerOpen && (
        <div className="confirm-overlay qr-mode-overlay" onMouseDown={() => setScannerOpen(false)}>
          <section className="qr-mode-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-qr-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="qr-mode-header">
              <div><div className="section-kicker">Attendance</div><h2 id="admin-qr-title">Scan student QR</h2><p>Select the session first, then scan the student's personal code.</p></div>
              <button className="icon-button rounded-full bg-[#FAF8F2]" type="button" onClick={() => setScannerOpen(false)} aria-label="Close student QR scanner"><X size={17} /></button>
            </header>
            <AdminStudentQrScanner onNotify={onNotify} />
          </section>
        </div>
      )}
    </div>
  );
}

function AttendanceEditor({ record, onClose, onNotify }: { record: AttendanceRecord; onClose: () => void; onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, moderateAttendance } = useAppData();
  const [status, setStatus] = useState<"Approved" | "Rejected">(record.status === "Rejected" ? "Rejected" : "Approved");
  const [note, setNote] = useState(record.correctionNote ?? "");
  const [error, setError] = useState("");
  const user = state.users.find((item) => item.id === record.userId);
  const event = state.events.find((item) => item.id === record.eventId);

  async function save() {
    const result = await moderateAttendance(record.id, status, note);
    if (!result.ok) { setError(result.message); return; }
    onNotify?.({ tone: status === "Approved" ? "success" : "warning", title: `Attendance ${status.toLowerCase()}`, description: `${user?.name}'s record was updated.` });
    onClose();
  }

  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div className="entity-detail-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><div className="section-kicker">Attendance correction</div><h2>{user?.name}</h2><p>{event?.title}</p></div><button className="icon-button rounded-full bg-[#FAF8F2]" type="button" onClick={onClose}><X size={16} /></button></header>
        {error && <InlineNotice tone="error" title="Record not updated">{error}</InlineNotice>}
        <div className="entity-form-grid mt-5">
          <label className="form-field"><span>Decision</span><select value={status} onChange={(event) => setStatus(event.target.value as "Approved" | "Rejected")}><option>Approved</option><option>Rejected</option></select></label>
          <label className="form-field md:col-span-2"><span>Correction or rejection note</span><textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder={status === "Rejected" ? "Required when rejecting" : "Optional correction detail"} /></label>
        </div>
        <footer><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={save}>Save correction</button></footer>
      </div>
    </div>
  );
}
