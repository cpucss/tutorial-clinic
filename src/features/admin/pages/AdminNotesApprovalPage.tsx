import { useState } from "react";
import { Check, Download, Search, X } from "lucide-react";

import { notes } from "../../../mock";
import { ConfirmDialog, EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import type { NoteItem } from "../../../types/note";

export function AdminNotesApprovalPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const [queue, setQueue] = useState<NoteItem[]>(notes);
  const [rejectTarget, setRejectTarget] = useState<NoteItem | null>(null);
  const pending = queue.filter((note) => note.status === "Pending");
  const reviewed = queue.filter((note) => note.status !== "Pending");

  function approveNote(note: NoteItem) {
    setQueue((items) =>
      items.map((item) => (item.id === note.id ? { ...item, status: "Approved" } : item)),
    );
    onNotify?.({
      tone: "success",
      title: "Note approved",
      description: `${note.title} is now visible in the library.`,
    });
  }

  function rejectNote(note: NoteItem) {
    setQueue((items) =>
      items.map((item) => (item.id === note.id ? { ...item, status: "Rejected" } : item)),
    );
    onNotify?.({
      tone: "warning",
      title: "Note rejected",
      description: `${note.title} moved out of the pending queue.`,
    });
    setRejectTarget(null);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Notes moderation</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Review student uploads
            </h1>
            <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
              Approve useful study material, reject incomplete files, and keep points fair.
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
            <Download size={14} /> Export Queue
          </button>
        </div>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-[310px_1fr] gap-5 items-start">
          <aside className="rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Queue summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="Pending" value={pending.length} active />
              <Stat label="Approved" value={queue.filter((n) => n.status === "Approved").length} />
              <Stat label="Rejected" value={queue.filter((n) => n.status === "Rejected").length} />
              <Stat label="Total files" value={queue.length} />
            </div>
            <div className="relative mt-5">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
              <input placeholder="Search uploads" className="h-9 w-full rounded-full bg-white pl-8 pr-3 outline-none" style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />
            </div>
          </aside>

          <main className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="p-5 flex items-center justify-between">
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Pending approval</h2>
              <span style={{ fontSize: 12, color: "#6F6F6F" }}>{pending.length} item{pending.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid gap-2 p-5 pt-0">
              {pending.length ? (
                pending.map((note) => (
                  <ReviewCard
                    key={note.id}
                    note={note}
                    onApprove={() => approveNote(note)}
                    onReject={() => setRejectTarget(note)}
                  />
                ))
              ) : (
                <EmptyState
                  title="No pending uploads"
                  body={`${reviewed.length} reviewed files are already handled. New uploads will appear here.`}
                  icon={<Check size={18} />}
                />
              )}
            </div>
          </main>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject this upload?"
        body={`"${rejectTarget?.title ?? "This note"}" will leave the pending queue. Add backend rejection reasons before production.`}
        confirmLabel="Reject note"
        cancelLabel="Keep pending"
        tone="error"
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => {
          if (rejectTarget) rejectNote(rejectTarget);
        }}
      />
    </div>
  );
}

function ReviewCard({
  note,
  onApprove,
  onReject,
}: {
  note: NoteItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col items-start justify-between gap-4 sm:flex-row" style={{ background: "#FAF8F2" }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1C" }}>{note.title}</h3>
          <StatusBadge status={note.status} />
        </div>
        <p className="mt-1" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
          {note.subject} - {note.yearLevel} - uploaded by {note.uploader} on {note.uploadedAt}
        </p>
        <p className="mt-2" style={{ fontSize: 13, color: "#1C1C1C", lineHeight: 1.55 }}>
          {note.description ?? "No description provided."}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Action icon={<Check size={13} />} label="Approve" primary onClick={onApprove} />
        <Action icon={<X size={13} />} label="Reject" onClick={onReject} />
      </div>
    </div>
  );
}

function Stat({ label, value, active = false }: { label: string; value: number; active?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: active ? "#F5A623" : "#FAF8F2" }}>
      <div style={{ fontSize: 11, color: active ? "#FFFFFF" : "#6F6F6F" }}>{label}</div>
      <div className="mt-1" style={{ fontSize: 22, fontWeight: 700, color: active ? "#FFFFFF" : "#1C1C1C" }}>{value}</div>
    </div>
  );
}

function Action({ icon, label, primary = false, onClick }: { icon: React.ReactNode; label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="motion-button flex items-center gap-1 rounded-full px-3 py-1.5" style={{ background: primary ? "#F5A623" : "#FFFFFF", color: primary ? "#FFFFFF" : "#1C1C1C", fontSize: 12, fontWeight: 500, boxShadow: primary ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}>
      {icon}
      {label}
    </button>
  );
}
