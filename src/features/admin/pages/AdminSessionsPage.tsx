import { useState } from "react";
import { CalendarPlus, Search, SlidersHorizontal } from "lucide-react";

import { events } from "../../../mock";
import { ConfirmDialog, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";

const subjects = ["All subjects", "CS101", "CS150", "CS220", "CS301", "CS401"];

export function AdminSessionsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(typeof events)[number] | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Session management</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Tutorial sessions
            </h1>
            <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
              Create sessions, update details, and control attendance availability.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
            <CalendarPlus size={14} /> Create Session
          </button>
        </div>

        <div className="mt-6 rounded-xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="p-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
              <input placeholder="Search sessions" className="h-9 w-full rounded-full bg-white pl-8 pr-3 outline-none" style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />
            </div>
            <div className="relative">
              <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
              <select className="h-9 rounded-full bg-white pl-8 pr-8 outline-none" style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                {subjects.map((subject) => <option key={subject}>{subject}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead style={{ background: "#FAF8F2" }}>
                <tr>
                  {["Title", "Subject", "Date", "Time", "Venue", "Attendance", ""].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => {
                  const date = new Date(event.date);
                  const enabled = index !== 1;
                  return (
                    <tr key={event.id} style={{ borderTop: "1px solid #F0EFE9" }}>
                      <td className="px-5 py-3">
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{event.title}</div>
                        <div style={{ fontSize: 12, color: "#6F6F6F" }}>{event.speaker}</div>
                      </td>
                      <td className="px-5 py-3" style={{ fontSize: 13, color: "#1C1C1C" }}>{event.topics[0]}</td>
                      <td className="px-5 py-3" style={{ fontSize: 13, color: "#6F6F6F" }}>{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                      <td className="px-5 py-3" style={{ fontSize: 13, color: "#1C1C1C" }}>{date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</td>
                      <td className="px-5 py-3" style={{ fontSize: 13, color: "#6F6F6F" }}>{event.venue}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={enabled ? "Enabled" : "Disabled"} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <RowButton label="Edit Session" onClick={() => setShowForm(true)} />
                          <RowButton label="Delete Session" onClick={() => setDeleteTarget(event)} />
                          <RowButton label={enabled ? "Disable Attendance" : "Enable Attendance"} primary={!enabled} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <SessionFormModal
          onClose={() => setShowForm(false)}
          onNotify={onNotify}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this session?"
        body={`"${deleteTarget?.title ?? "This session"}" will be removed from the admin schedule view. Connect this action to the backend before production.`}
        confirmLabel="Delete session"
        cancelLabel="Keep session"
        tone="error"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          onNotify?.({
            tone: "warning",
            title: "Session delete queued",
            description: deleteTarget ? `${deleteTarget.title} would be deleted by the backend.` : "The delete action was confirmed.",
          });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function RowButton({ label, primary = false, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full px-3 py-1" style={{ background: primary ? "#F5A623" : "#F8F8F8", color: primary ? "#FFFFFF" : "#1C1C1C", fontSize: 12, fontWeight: 500 }}>
      {label}
    </button>
  );
}

function SessionFormModal({
  onClose,
  onNotify,
}: {
  onClose: () => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!title.trim()) {
      setError("Enter a session title.");
      return;
    }
    if (!subject.trim()) {
      setError("Enter a subject code.");
      return;
    }
    if (!date.trim() || !time.trim()) {
      setError("Add both date and time.");
      return;
    }
    if (!venue.trim()) {
      setError("Enter the room or online meeting location.");
      return;
    }

    onNotify?.({
      tone: "success",
      title: "Session saved",
      description: `${title.trim()} passed front-end validation.`,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,28,28,0.36)" }}>
      <div className="max-h-[calc(100dvh-2rem)] w-[min(560px,calc(100vw-2rem))] overflow-y-auto rounded-xl p-6" style={{ background: "#FFFFFF", boxShadow: "0 18px 60px rgba(0,0,0,0.18)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Session form modal</div>
            <h2 className="mt-1" style={{ fontSize: 26, fontWeight: 700, color: "#1C1C1C" }}>Create or edit session</h2>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}>Close</button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && (
            <div className="sm:col-span-2">
              <InlineNotice tone="error" title="Session needs more detail">
                {error}
              </InlineNotice>
            </div>
          )}
          <Field label="Title" placeholder="Database Design Clinic" value={title} onChange={setTitle} wide />
          <Field label="Subject" placeholder="CS220" value={subject} onChange={setSubject} />
          <Field label="Date" placeholder="2026-07-02" value={date} onChange={setDate} />
          <Field label="Time" placeholder="2:00 PM" value={time} onChange={setTime} />
          <Field label="Venue" placeholder="Room CS-110" value={venue} onChange={setVenue} />
          <Field label="Description" placeholder="Topics and facilitator notes" value={description} onChange={setDescription} wide textarea />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-5 py-2.5" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button onClick={submit} className="rounded-full px-5 py-2.5" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>Create Session</button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  wide = false,
  textarea = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <div className="mb-1.5" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{label}</div>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="h-24 w-full resize-none rounded-md bg-white px-3 py-2 outline-none" placeholder={placeholder} style={{ border: "1px solid #F0EFE9", color: "#1C1C1C", fontSize: 13 }} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md bg-white px-3 outline-none" placeholder={placeholder} style={{ border: "1px solid #F0EFE9", color: "#1C1C1C", fontSize: 13 }} />
      )}
    </label>
  );
}
