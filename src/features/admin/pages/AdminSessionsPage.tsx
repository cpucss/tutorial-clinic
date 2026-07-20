import { useMemo, useState } from "react";
import { CalendarPlus, Download, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog, EmptyState, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { effectiveEventStatus, getRsvpCount, useAppData } from "../../../context/AppDataContext";
import type { DemoEvent, SessionStatus, Subject } from "../../../types/app";
import type { YearLevel } from "../../../types/common";
import { downloadCsv, formatDateTime } from "../../../utils/format";

// ─── Year-group definitions ───────────────────────────────────────────────────
const YEAR_GROUPS: { label: string; levels: YearLevel[] }[] = [
  { label: "First Year",  levels: ["Freshman"] },
  { label: "Second Year", levels: ["Sophomore"] },
  { label: "Third Year",  levels: ["Junior"] },
  { label: "Fourth Year", levels: ["Senior"] },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export function AdminSessionsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, deleteEvent } = useAppData();
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("All");
  const [status, setStatus] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [editor, setEditor] = useState<DemoEvent | "new" | null>(null);
  const [view, setView] = useState<DemoEvent | null>(null);
  const [remove, setRemove] = useState<DemoEvent | null>(null);

  // Only show subjects that have at least one session created
  const usedSubjectIds = useMemo(
    () => new Set(state.events.map((e) => e.subjectId)),
    [state.events]
  );

  const events = useMemo(
    () =>
      state.events
        .filter(
          (event) =>
            (!query ||
              `${event.title} ${event.description} ${event.venue}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (subjectId === "All" || event.subjectId === subjectId) &&
            (status === "All" || effectiveEventStatus(event) === status) &&
            (!dateFilter || event.date.slice(0, 10) === dateFilter)
        )
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [dateFilter, query, state.events, status, subjectId]
  );

  function exportRows() {
    downloadCsv(
      "tutorial-clinic-sessions.csv",
      events.map((event) => ({
        title: event.title,
        subject: state.subjects.find((item) => item.id === event.subjectId)?.code,
        start: formatDateTime(event.date),
        venue: event.venue,
        instructor:
          !event.instructor || event.instructor === "To Be Determined" ? "TBA" : event.instructor,
        status: effectiveEventStatus(event),
        rsvps: getRsvpCount(state, event.id),
        capacity: event.capacity,
        attendance_code: event.attendanceCode,
      }))
    );
    onNotify?.({
      tone: "success",
      title: "Session CSV exported",
      description: `${events.length} visible sessions were included.`,
    });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="section-kicker">Session management</div>
            <h1 className="page-heading">Tutorial sessions</h1>
            <p className="page-description">
              Create, edit, search, filter, and export sessions used across the student workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="secondary-button" onClick={exportRows}>
              <Download size={15} /> Export CSV
            </button>
            <button className="primary-button" onClick={() => setEditor("new")}>
              <CalendarPlus size={15} /> Create session
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="mt-6 grid gap-3 rounded-xl bg-white p-4 demo-card md:grid-cols-2 xl:grid-cols-[1fr_220px_150px_160px]">
          <label className="search-field">
            <Search size={15} />
            <span className="sr-only">Search sessions</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions"
            />
          </label>

          {/* Subject filter — only shows subjects used in existing sessions */}
          <Filter label="Subject" value={subjectId} onChange={setSubjectId}>
            <option value="All">All subjects</option>
            {state.subjects
              .filter((s) => usedSubjectIds.has(s.id))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}: {item.name}
                </option>
              ))}
          </Filter>

          <Filter label="Status" value={status} onChange={setStatus}>
            {["All", "Upcoming", "Live", "Completed", "Cancelled", "Draft"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Filter>

          <label className="compact-field">
            <span>Date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </label>
        </section>

        {/* Table */}
        <section className="mt-5 overflow-hidden rounded-xl bg-white demo-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Instructor</th>
                  <th>RSVP</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const sub = state.subjects.find((s) => s.id === event.subjectId);
                  return (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.title}</strong>
                        <small>
                          {sub ? `${sub.code}: ${sub.name}` : event.subjectId} — Room: {event.venue}
                        </small>
                      </td>
                      <td>{formatDateTime(event.date)}</td>
                      <td>
                        {!event.instructor || event.instructor === "To Be Determined"
                          ? "TBA"
                          : event.instructor}
                      </td>
                      <td>
                        {getRsvpCount(state, event.id)}/{event.capacity}
                      </td>
                      <td>
                        <StatusBadge status={effectiveEventStatus(event)} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => setView(event)}>
                            <Eye size={14} /> View
                          </button>
                          <button onClick={() => setEditor(event)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="danger-text" onClick={() => setRemove(event)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!events.length && (
            <div className="p-5">
              <EmptyState title="No sessions found" body="Change a filter or create a new session." />
            </div>
          )}
        </section>
      </div>

      {editor && (
        <SessionEditor
          event={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onNotify={onNotify}
        />
      )}
      {view && <SessionDetails event={view} onClose={() => setView(null)} />}
      <ConfirmDialog
        open={Boolean(remove)}
        title="Delete this session?"
        body={`${remove?.title ?? "This session"} and its RSVP and attendance records will be removed.`}
        confirmLabel="Delete session"
        cancelLabel="Keep session"
        tone="error"
        onCancel={() => setRemove(null)}
        onConfirm={() => {
          if (remove) {
            deleteEvent(remove.id);
            onNotify?.({
              tone: "warning",
              title: "Session deleted",
              description: `${remove.title} was removed from all session views.`,
            });
          }
          setRemove(null);
        }}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="compact-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}

// ─── Session Editor ───────────────────────────────────────────────────────────
function SessionEditor({
  event,
  onClose,
  onNotify,
}: {
  event?: DemoEvent;
  onClose: () => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { state, saveEvent } = useAppData();
  const local = (iso?: string) =>
    iso
      ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";

  const [title, setTitle] = useState(event?.title ?? "");
  const [subjectId, setSubjectId] = useState(event?.subjectId ?? state.subjects[0]?.id ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(local(event?.date));
  const [endDate, setEndDate] = useState(local(event?.endDate));
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [instructor, setInstructor] = useState(event?.instructor ?? "");
  const [capacity, setCapacity] = useState(event?.capacity ?? 25);
  const [status, setStatus] = useState<SessionStatus>(event?.status ?? "Upcoming");
  const [code, setCode] = useState(event?.attendanceCode ?? "");
  const [topics, setTopics] = useState(event?.topics.join(", ") ?? "");
  const [yearLevels, setYearLevels] = useState<YearLevel[]>(
    event?.yearLevels ?? ["Freshman", "Sophomore", "Junior", "Senior"]
  );
  const [error, setError] = useState("");

  function submit() {
    const result = saveEvent({
      ...event,
      title,
      subjectId,
      description,
      date: date ? new Date(date).toISOString() : "",
      endDate: endDate ? new Date(endDate).toISOString() : "",
      venue,
      instructor,
      capacity,
      status,
      attendanceCode: code,
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
      yearLevels,
    });
    if (!result.ok) { setError(result.message); return; }
    onNotify?.({
      tone: "success",
      title: event ? "Session updated" : "Session created",
      description: `${title} is now synchronized across admin and student pages.`,
    });
    onClose();
  }

  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div
        className="entity-editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-editor-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <div className="section-kicker">{event ? "Edit session" : "New session"}</div>
            <h2 id="session-editor-title">
              {event ? event.title : "Create Tutorial Clinic session"}
            </h2>
          </div>
          <button
            className="icon-button rounded-full bg-[#FAF8F2]"
            onClick={onClose}
            aria-label="Close session editor"
          >
            <X size={16} />
          </button>
        </header>

        {error && <InlineNotice tone="error" title="Session not saved">{error}</InlineNotice>}

        <div className="entity-form-grid">
          {/* Title */}
          <label className="form-field md:col-span-2">
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          {/* Subject */}
          <label className="form-field md:col-span-2">
            <span>Subject</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {YEAR_GROUPS.map((group) => {
                const groupSubjects = state.subjects.filter((s) => group.levels.includes(s.yearLevel as YearLevel));
                if (!groupSubjects.length) return null;
                return (
                  <optgroup key={group.label} label={group.label}>
                    {groupSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code}: {sub.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>

          {/* Status */}
          <label className="form-field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as SessionStatus)}>
              {["Draft", "Upcoming", "Live", "Completed", "Cancelled"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          {/* Start / End */}
          <label className="form-field">
            <span>Start</span>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="form-field">
            <span>End</span>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          {/* Room */}
          <label className="form-field">
            <span>Room</span>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. MT102" />
          </label>

          {/* Instructor — only shown when editing an existing session */}
          {event && (
            <label className="form-field">
              <span>Instructor</span>
              <input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="To Be Determined"
              />
            </label>
          )}

          {/* Capacity */}
          <label className="form-field">
            <span>Participant capacity</span>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </label>

          {/* Attendance code */}
          <label className="form-field">
            <span>Attendance code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Generated if empty"
            />
          </label>

          {/* Topics */}
          <label className="form-field md:col-span-2">
            <span>Topics (comma separated)</span>
            <input value={topics} onChange={(e) => setTopics(e.target.value)} />
          </label>

          {/* Description */}
          <label className="form-field md:col-span-2">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>

          {/* Year levels */}
          <fieldset className="md:col-span-2">
            <legend>Eligible year levels</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["Freshman", "Sophomore", "Junior", "Senior"] as YearLevel[]).map((year) => (
                <label className="check-chip" key={year}>
                  <input
                    type="checkbox"
                    checked={yearLevels.includes(year)}
                    onChange={() =>
                      setYearLevels((cur) =>
                        cur.includes(year) ? cur.filter((y) => y !== year) : [...cur, year]
                      )
                    }
                  />
                  {year}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <footer>
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={submit}>
            {event ? "Save changes" : "Create session"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Session Details ──────────────────────────────────────────────────────────
function SessionDetails({ event, onClose }: { event: DemoEvent; onClose: () => void }) {
  const { state } = useAppData();
  const sub = state.subjects.find((s) => s.id === event.subjectId);
  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div
        className="entity-detail-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <div className="section-kicker">Session details</div>
            <h2>{event.title}</h2>
          </div>
          <button className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <p className="mt-4 text-sm leading-7 text-[#6F6F6F]">{event.description}</p>
        <dl className="detail-list">
          <div>
            <dt>Subject</dt>
            <dd>{sub ? `${sub.code}: ${sub.name}` : "—"}</dd>
          </div>
          <div>
            <dt>Schedule</dt>
            <dd>{formatDateTime(event.date)}</dd>
          </div>
          <div>
            <dt>Instructor</dt>
            <dd>
              {!event.instructor || event.instructor === "To Be Determined"
                ? "TBA"
                : event.instructor}
            </dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>RSVP</dt>
            <dd>
              {getRsvpCount(state, event.id)}/{event.capacity}
            </dd>
          </div>
          <div>
            <dt>Attendance code</dt>
            <dd>{event.attendanceCode}</dd>
          </div>
        </dl>
        <footer>
          <button className="primary-button" onClick={onClose}>Done</button>
        </footer>
      </div>
    </div>
  );
}
