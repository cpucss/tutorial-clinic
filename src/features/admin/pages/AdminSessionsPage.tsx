import {useEffect, useMemo, useRef, useState} from "react";
import { CalendarPlus, Check, ChevronDown, Download, Eye, Pencil, Search, Trash2, X } from "lucide-react";
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

// ─── SearchableSubjectDropdown ───────────────────────────────────────────────────────────
function SearchableSubjectDropdown({
  subjects,
  value,
  onChange,
}: {
  subjects: Subject[];
  value: string;
  onChange: (subjectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSubject = subjects.find(
    (subject) => subject.id === value,
  );

  const filteredSubjects = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const searchableText = [
        subject.code,
        subject.name,
        subject.yearLevel,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery, subjects]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  function selectSubject(subjectId: string) {
    onChange(subjectId);
    setOpen(false);
    setSearchQuery("");
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Selected subject / dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg border border-[#E8E3D8] bg-white px-3 py-2 text-left outline-none transition focus:border-[#F5A623]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="min-w-0">
          {selectedSubject ? (
            <div className="truncate text-sm font-medium text-[#1C1C1C]">
              {selectedSubject.code}:{" "}
              {selectedSubject.name}
            </div>
          ) : (
            <div className="text-sm text-[#A0A0A0]">
              Select a subject
            </div>
          )}
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-[#6F6F6F] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-[100] mt-2 overflow-hidden rounded-xl border border-[#E8E3D8] bg-white"
          style={{
            boxShadow:
              "0 14px 35px rgba(28, 28, 28, 0.16)",
          }}
        >
          {/* Search input */}
          <div className="border-b border-[#F0EFE9] p-3">
            <label className="flex items-center gap-2 rounded-lg bg-[#FAF8F2] px-3">
              <Search
                size={15}
                className="shrink-0 text-[#A0A0A0]"
              />

              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search subject code or name"
                className="h-10 w-full bg-transparent text-sm text-[#1C1C1C] outline-none placeholder:text-[#A0A0A0]"
              />
            </label>
          </div>

          {/* Subject results */}
          <div
            className="max-h-72 overflow-y-auto p-2"
            role="listbox"
          >
            {YEAR_GROUPS.map((group) => {
              const groupSubjects =
                filteredSubjects.filter((subject) =>
                  group.levels.includes(
                    subject.yearLevel as YearLevel,
                  ),
                );

              if (!groupSubjects.length) {
                return null;
              }

              return (
                <div
                  key={group.label}
                  className="mb-3 last:mb-0"
                >
                  {/* Orange year-group heading */}
                  <div
                    className="mb-1 rounded-lg px-3 py-2 text-xs font-bold"
                    style={{
                      background: "#F5A623",
                      color: "#1C1C1C",
                    }}
                  >
                    {group.label}
                  </div>

                  <div className="grid gap-1">
                    {groupSubjects.map((subject) => {
                      const isSelected =
                        subject.id === value;

                      return (
                        <button
                          key={subject.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() =>
                            selectSubject(subject.id)
                          }
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#FAF8F2]"
                          style={{
                            background: isSelected
                              ? "#FFF3DF"
                              : "transparent",
                          }}
                        >
                          <div className="min-w-0">
                            <div
                              className="truncate text-sm font-semibold"
                              style={{
                                color: "#1C1C1C",
                              }}
                            >
                              {subject.code}
                            </div>

                            <div
                              className="truncate text-xs"
                              style={{
                                color: "#777777",
                              }}
                            >
                              {subject.name}
                            </div>
                          </div>

                          {isSelected && (
                            <Check
                              size={17}
                              className="shrink-0"
                              color="#F5A623"
                              strokeWidth={2.5}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!filteredSubjects.length && (
              <div className="px-4 py-8 text-center">
                <div className="text-sm font-semibold text-[#1C1C1C]">
                  No subjects found
                </div>

                <div className="mt-1 text-xs text-[#A0A0A0]">
                  Try searching with another subject code
                  or name.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
          <div className="form-field md:col-span-2">
            <span>Subject</span>

            <SearchableSubjectDropdown
              subjects={state.subjects}
              value={subjectId}
              onChange={setSubjectId}
            />
          </div>

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
