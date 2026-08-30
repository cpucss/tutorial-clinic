import { useMemo, useState } from "react";
import { Bookmark, CalendarDays, Check, Clock, MapPin, QrCode, Search, Users } from "lucide-react";

import { ConfirmDialog, EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { effectiveEventStatus, getRsvpCount, useAppData } from "../../../context/AppDataContext";
import type { DemoEvent } from "../../../types/app";
import type { YearLevel } from "../../../types/common";
import { formatDateTime } from "../../../utils/format";

const years: Array<"All" | YearLevel> = ["All", "Freshman", "Sophomore", "Junior", "Senior"];

export function EventsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, currentUser, toggleRsvp, toggleSchedule } = useAppData();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<"All" | YearLevel>("All");
  const [status, setStatus] = useState("Upcoming");
  const [subjectId, setSubjectId] = useState("All");
  const [selectedId, setSelectedId] = useState(state.events[0]?.id ?? "");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const myRsvpIds = new Set(state.rsvps.filter((item) => item.userId === currentUser?.id).map((item) => item.eventId));
  const scheduleIds = new Set(state.scheduleEventIds[currentUser?.id ?? ""] ?? []);

  const filtered = useMemo(() => state.events.filter((event) => {
    const haystack = `${event.title} ${event.description} ${event.instructor} ${event.venue} ${event.topics.join(" ")}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (year === "All" || event.yearLevels.includes(year)) && (subjectId === "All" || event.subjectId === subjectId) && (status === "All" || effectiveEventStatus(event) === status);
  }).sort((a, b) => +new Date(a.date) - +new Date(b.date)), [query, state.events, status, subjectId, year]);
  const selected = filtered.find((event) => event.id === selectedId) ?? filtered[0];

  async function changeRsvp(event: DemoEvent) {
    if (myRsvpIds.has(event.id)) { setCancelId(event.id); return; }
    const result = await toggleRsvp(event.id);
    onNotify?.({ tone: result.ok ? "success" : "error", title: result.ok ? "RSVP saved" : "RSVP unavailable", description: result.message });
  }

  function schedule(eventId: string) {
    const saved = scheduleIds.has(eventId);
    const result = toggleSchedule(eventId);
    onNotify?.({ tone: result.ok ? "success" : "error", title: result.ok ? (saved ? "Removed from schedule" : "Added to My Schedule") : "Schedule not updated", description: result.ok ? "Your browser-persistent schedule is up to date." : result.message });
  }

  return (
    <div className="events-page flex h-full flex-col lg:flex-row">
      <aside className="event-browser-panel">
        <div className="event-browser-heading"><div><div className="section-kicker">Study sessions</div><h1 className="page-heading">Events</h1></div><span className="event-results-count">{filtered.length}<small>session{filtered.length === 1 ? "" : "s"}</small></span></div>
        <label className="search-field"><Search size={15} /><span className="sr-only">Search sessions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sessions" /></label>
        <div className="event-filter-strip" data-mobile-scroll>
          <label className="compact-field"><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value as typeof year)}>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="compact-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{["All", "Upcoming", "Live", "Completed", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="compact-field event-filter-subject"><span>Subject</span><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="All">All subjects</option>{state.subjects.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></label>
        </div>
        <div className="event-list-heading"><strong>Available sessions</strong><span>Swipe to browse</span></div>
        <div className="event-list" data-mobile-scroll>{filtered.map((event) => <button type="button" key={event.id} className={`event-list-card ${selected?.id === event.id ? "is-selected" : ""}`} aria-pressed={selected?.id === event.id} onClick={() => setSelectedId(event.id)}><span className="event-list-card-heading"><strong>{event.title}</strong>{myRsvpIds.has(event.id) && <Check size={14} aria-label="RSVP saved" />}</span><span className="event-card-meta"><CalendarDays size={13} />{formatDateTime(event.date)}</span><span className="event-card-meta"><MapPin size={13} />{event.venue}<small>{event.instructor}</small></span></button>)}{!filtered.length && <EmptyState title="No sessions found" body="Try changing your search or filters." />}</div>
      </aside>

      <main className="event-detail-panel min-w-0 flex-1 overflow-y-auto bg-white">{selected ? <EventDetail event={selected} rsvpCount={getRsvpCount(state, selected.id)} rsvped={myRsvpIds.has(selected.id)} scheduled={scheduleIds.has(selected.id)} isStudent={currentUser?.role !== "admin"} onRsvp={() => changeRsvp(selected)} onSchedule={() => schedule(selected.id)} subject={state.subjects.find((item) => item.id === selected.subjectId)?.name ?? "General study"} /> : <div className="p-8"><EmptyState title="Choose a session" body="Select a session from the list to view its full details." /></div>}</main>

      <ConfirmDialog open={Boolean(cancelId)} title="Cancel this RSVP?" body="Your reservation will be released. The event remains in My Schedule unless you remove it separately." confirmLabel="Cancel RSVP" cancelLabel="Keep RSVP" tone="warning" onCancel={() => setCancelId(null)} onConfirm={async () => { if (cancelId) { const targetId = cancelId; setCancelId(null); const result = await toggleRsvp(targetId); onNotify?.({ tone: result.ok ? "warning" : "error", title: result.ok ? "RSVP cancelled" : "Unable to cancel", description: result.message }); } }} />
    </div>
  );
}

function EventDetail({ event, subject, rsvpCount, rsvped, scheduled, isStudent, onRsvp, onSchedule }: { event: DemoEvent; subject: string; rsvpCount: number; rsvped: boolean; scheduled: boolean; isStudent: boolean; onRsvp: () => void; onSchedule: () => void }) {
  const full = rsvpCount >= event.capacity;
  const status = effectiveEventStatus(event);
  return <article className="event-detail"><div className="event-detail-hero"><CalendarDays size={46} /><div><span>{subject}</span><h2>{event.title}</h2></div></div><div className="event-detail-body"><div className="event-detail-badges"><StatusBadge status={status} />{event.yearLevels.map((year) => <StatusBadge key={year} status={year} />)}</div><p className="event-detail-description">{event.description}</p><dl className="event-detail-grid"><Detail icon={<Clock />} label="Date and time" value={`${formatDateTime(event.date)} to ${new Date(event.endDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`} /><Detail icon={<MapPin />} label="Venue" value={event.venue} /><Detail icon={<Users />} label="Capacity" value={`${rsvpCount} of ${event.capacity} reserved`} /><Detail icon={<QrCode />} label="Attendance" value={status === "Live" ? "Show your personal QR to an administrator" : "Your personal QR is available from Attendance"} /></dl><div className="event-detail-actions">{isStudent && <><button className="primary-button" disabled={!rsvped && (full || ["Completed", "Cancelled"].includes(status))} onClick={onRsvp}>{rsvped ? "Cancel RSVP" : full ? "Session full" : "RSVP to session"}</button><button className="secondary-button" onClick={onSchedule}><Bookmark size={15} fill={scheduled ? "currentColor" : "none"} />{scheduled ? "Remove from My Schedule" : "Add to My Schedule"}</button></>}</div><div className="event-detail-topics"><h3>Topics covered</h3><div>{event.topics.map((topic) => <span key={topic} className="topic-chip">{topic}</span>)}</div></div></div></article>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="detail-tile"><span className="text-[#F5A623] [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span><div><dt>{label}</dt><dd>{value}</dd></div></div>; }
