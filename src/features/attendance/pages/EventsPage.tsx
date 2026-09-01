import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import {
  AlertTriangle,
  Bookmark,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { ConfirmDialog, EmptyState, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { effectiveEventStatus, getRsvpCount, useAppData } from "../../../context/AppDataContext";
import type { DemoEvent } from "../../../types/app";
import type { YearLevel } from "../../../types/common";
import { formatDateTime } from "../../../utils/format";

const years: Array<"All" | YearLevel> = ["All", "Freshman", "Sophomore", "Junior", "Senior"];
const statusOptions = ["Active", "Upcoming", "Live", "Completed", "Cancelled", "All"] as const;
type StatusOption = (typeof statusOptions)[number];

function isStatusMatch(event: DemoEvent, filterStatus: StatusOption): boolean {
  if (event.status === "Draft") return false;
  const effective = effectiveEventStatus(event);
  if (filterStatus === "Active") return effective === "Upcoming" || effective === "Live";
  if (filterStatus === "All") return true;
  return effective === filterStatus;
}

export function EventsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const location = useLocation();
  const {
    state,
    currentUser,
    toggleRsvp,
    toggleSchedule,
    sharedRecordsLoading,
    sharedRecordsError,
    sharedRecordsUpdatedAt,
    refreshSharedRecords,
  } = useAppData();

  const [query, setQuery] = useState("");
  const [year, setYear] = useState<"All" | YearLevel>("All");
  const [status, setStatus] = useState<StatusOption>("Active");
  const [subjectId, setSubjectId] = useState("All");
  const [selectedId, setSelectedId] = useState<string>("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const myRsvpIds = useMemo(
    () =>
      new Set(
        state.rsvps
          .filter((item) => item.userId === currentUser?.id || item.userId === currentUser?.authUserId)
          .map((item) => item.eventId)
      ),
    [currentUser?.authUserId, currentUser?.id, state.rsvps]
  );

  const scheduleIds = useMemo(
    () =>
      new Set([
        ...(state.scheduleEventIds[currentUser?.id ?? ""] ?? []),
        ...(currentUser?.authUserId ? state.scheduleEventIds[currentUser.authUserId] ?? [] : []),
      ]),
    [currentUser?.authUserId, currentUser?.id, state.scheduleEventIds]
  );

  // Filtered published sessions
  const filtered = useMemo(() => {
    return state.events
      .filter((event) => {
        if (event.status === "Draft") return false;
        const haystack = `${event.title} ${event.description} ${event.instructor} ${event.venue} ${event.topics.join(" ")}`.toLowerCase();
        const matchesQuery = !query || haystack.includes(query.toLowerCase());
        const matchesYear = year === "All" || event.yearLevels.includes(year);
        const matchesSubject = subjectId === "All" || event.subjectId === subjectId;
        const matchesStatus = isStatusMatch(event, status);
        return matchesQuery && matchesYear && matchesSubject && matchesStatus;
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [query, state.events, status, subjectId, year]);

  // Handle incoming notification navigation with target sessionId
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetSessionId = params.get("sessionId") || (location.state as any)?.sessionId;
    if (!targetSessionId) return;

    const targetEvent = state.events.find((e) => e.id === targetSessionId);
    if (targetEvent) {
      setSelectedId(targetEvent.id);
      // Automatically adjust filters to ensure the target session is visible
      if (targetEvent.status === "Draft") {
        onNotify?.({
          tone: "info",
          title: "Draft session",
          description: "This session is currently in Draft mode.",
        });
      } else {
        if (!isStatusMatch(targetEvent, status)) {
          const effective = effectiveEventStatus(targetEvent);
          setStatus(effective === "Completed" || effective === "Cancelled" ? effective : "Active");
        }
        if (year !== "All" && !targetEvent.yearLevels.includes(year)) {
          setYear("All");
        }
        if (subjectId !== "All" && targetEvent.subjectId !== subjectId) {
          setSubjectId("All");
        }
      }
    } else if (!sharedRecordsLoading) {
      onNotify?.({
        tone: "info",
        title: "Session not found",
        description: "The requested tutorial session is no longer available or was removed.",
      });
    }
  }, [location.search, location.state, sharedRecordsLoading, state.events]);

  // Keep selectedId valid within filtered results
  const selected = useMemo(() => {
    return filtered.find((event) => event.id === selectedId) ?? filtered[0];
  }, [filtered, selectedId]);

  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.some((e) => e.id === selectedId))) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  async function changeRsvp(event: DemoEvent) {
    if (myRsvpIds.has(event.id)) {
      setCancelId(event.id);
      return;
    }
    const result = await toggleRsvp(event.id);
    onNotify?.({
      tone: result.ok ? "success" : "error",
      title: result.ok ? "RSVP saved" : "RSVP unavailable",
      description: result.message,
    });
  }

  async function schedule(eventId: string) {
    const saved = scheduleIds.has(eventId);
    const result = await toggleSchedule(eventId);
    onNotify?.({
      tone: result.ok ? "success" : "error",
      title: result.ok
        ? saved
          ? "Removed from schedule"
          : "Added to My Schedule"
        : "Schedule not updated",
      description:
        result.message || (result.ok ? "Your schedule is up to date." : "Please try again."),
    });
  }

  const liveSessionsCount = useMemo(
    () => state.events.filter((e) => e.status !== "Draft" && effectiveEventStatus(e) === "Live").length,
    [state.events]
  );

  return (
    <div className="events-page flex h-full flex-col lg:flex-row">
      <aside className="event-browser-panel">
        <div className="event-browser-heading">
          <div>
            <div className="section-kicker">Study sessions</div>
            <h1 className="page-heading">Events</h1>
          </div>
          <div className="flex items-center gap-2">
            {liveSessionsCount > 0 && status !== "Live" && (
              <button
                className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                onClick={() => setStatus("Live")}
                title="View live sessions currently in progress"
              >
                <Radio size={12} className="animate-pulse text-emerald-600" />
                {liveSessionsCount} Live
              </button>
            )}
            <span className="event-results-count">
              {filtered.length}
              <small>session{filtered.length === 1 ? "" : "s"}</small>
            </span>
          </div>
        </div>

        {sharedRecordsError && (
          <div className="mt-2">
            <InlineNotice tone="error" title="Synchronization issue">
              <div className="flex flex-col gap-2">
                <span>Failed to load latest sessions: {sharedRecordsError}</span>
                <button
                  type="button"
                  className="secondary-button self-start text-xs"
                  onClick={() => refreshSharedRecords()}
                >
                  <RefreshCw size={12} /> Retry sync
                </button>
              </div>
            </InlineNotice>
          </div>
        )}

        <label className="search-field">
          <Search size={15} />
          <span className="sr-only">Search sessions</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sessions"
          />
        </label>

        <div className="event-filter-strip" data-mobile-scroll>
          <label className="compact-field">
            <span>Year</span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value as typeof year)}
            >
              {years.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusOption)}
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "Active" ? "Active (Upcoming & Live)" : item}
                </option>
              ))}
            </select>
          </label>
          <label className="compact-field event-filter-subject">
            <span>Subject</span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="All">All subjects</option>
              {state.subjects
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="event-list-heading">
          <strong>Available sessions</strong>
          <span>Swipe to browse</span>
        </div>

        <div className="event-list" data-mobile-scroll>
          {sharedRecordsLoading && state.events.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8A8377]">
              Loading tutorial sessions...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((event) => {
              const effective = effectiveEventStatus(event);
              return (
                <button
                  type="button"
                  key={event.id}
                  className={`event-list-card ${selected?.id === event.id ? "is-selected" : ""}`}
                  aria-pressed={selected?.id === event.id}
                  onClick={() => setSelectedId(event.id)}
                >
                  <span className="event-list-card-heading">
                    <strong>{event.title}</strong>
                    <div className="flex items-center gap-1">
                      {effective === "Live" && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          LIVE
                        </span>
                      )}
                      {myRsvpIds.has(event.id) && <Check size={14} aria-label="RSVP saved" />}
                    </div>
                  </span>
                  <span className="event-card-meta">
                    <CalendarDays size={13} />
                    {formatDateTime(event.date)}
                  </span>
                  <span className="event-card-meta">
                    <MapPin size={13} />
                    {event.venue}
                    <small>{event.instructor}</small>
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyState
              title={
                status === "Live"
                  ? "No live sessions"
                  : status === "Upcoming"
                  ? "No upcoming sessions"
                  : status === "Active"
                  ? "No active sessions"
                  : "No sessions found"
              }
              body={
                status === "Live"
                  ? "No tutorial sessions are currently live. Check upcoming sessions or view all."
                  : status === "Active"
                  ? "No active or upcoming sessions match your current filters. Try changing your filters."
                  : "Try changing your search or filter selections."
              }
              actionLabel={status !== "Active" && status !== "All" ? "View all active" : undefined}
              onAction={status !== "Active" && status !== "All" ? () => setStatus("Active") : undefined}
            />
          )}
        </div>
      </aside>

      <main className="event-detail-panel min-w-0 flex-1 overflow-y-auto bg-white">
        {selected ? (
          <EventDetail
            event={selected}
            rsvpCount={getRsvpCount(state, selected.id)}
            rsvped={myRsvpIds.has(selected.id)}
            scheduled={scheduleIds.has(selected.id)}
            isStudent={currentUser?.role !== "admin"}
            onRsvp={() => changeRsvp(selected)}
            onSchedule={() => schedule(selected.id)}
            subject={state.subjects.find((item) => item.id === selected.subjectId)?.name ?? "General study"}
          />
        ) : (
          <div className="p-8">
            <EmptyState
              title="Choose a session"
              body="Select a session from the list to view its full details."
            />
          </div>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel this RSVP?"
        body="Your reservation will be released. The event remains in My Schedule unless you remove it separately."
        confirmLabel="Cancel RSVP"
        cancelLabel="Keep RSVP"
        tone="warning"
        onCancel={() => setCancelId(null)}
        onConfirm={async () => {
          if (cancelId) {
            const targetId = cancelId;
            setCancelId(null);
            const result = await toggleRsvp(targetId);
            onNotify?.({
              tone: result.ok ? "warning" : "error",
              title: result.ok ? "RSVP cancelled" : "Unable to cancel",
              description: result.message,
            });
          }
        }}
      />
    </div>
  );
}

function EventDetail({
  event,
  subject,
  rsvpCount,
  rsvped,
  scheduled,
  isStudent,
  onRsvp,
  onSchedule,
}: {
  event: DemoEvent;
  subject: string;
  rsvpCount: number;
  rsvped: boolean;
  scheduled: boolean;
  isStudent: boolean;
  onRsvp: () => void;
  onSchedule: () => void;
}) {
  const status = effectiveEventStatus(event);
  return (
    <article className="event-detail">
      <div className="event-detail-hero">
        <CalendarDays size={46} />
        <div>
          <span>{subject}</span>
          <h2>{event.title}</h2>
        </div>
      </div>
      <div className="event-detail-body">
        <div className="event-detail-badges">
          <StatusBadge status={status} />
          {event.yearLevels.map((year) => (
            <StatusBadge key={year} status={year} />
          ))}
        </div>
        <p className="event-detail-description">{event.description}</p>
        <dl className="event-detail-grid">
          <Detail
            icon={<Clock />}
            label="Date and time"
            value={`${formatDateTime(event.date)} to ${new Date(event.endDate).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}`}
          />
          <Detail icon={<MapPin />} label="Venue" value={event.venue} />
          <Detail
            icon={<Users />}
            label="Capacity"
            value={
              isStudent
                ? `${event.capacity} seats - availability is confirmed when you RSVP`
                : `${rsvpCount} of ${event.capacity} reserved`
            }
          />
          <Detail
            icon={<QrCode />}
            label="Attendance"
            value={
              status === "Live"
                ? "Show your personal QR to an administrator"
                : "Your personal QR is available from Attendance"
            }
          />
        </dl>
        <div className="event-detail-actions">
          {isStudent && (
            <>
              <button
                className="primary-button"
                disabled={!rsvped && ["Completed", "Cancelled"].includes(status)}
                onClick={onRsvp}
              >
                {rsvped ? "Cancel RSVP" : "RSVP to session"}
              </button>
              <button className="secondary-button" onClick={onSchedule}>
                <Bookmark size={15} fill={scheduled ? "currentColor" : "none"} />
                {scheduled ? "Remove from My Schedule" : "Add to My Schedule"}
              </button>
            </>
          )}
        </div>
        <div className="event-detail-topics">
          <h3>Topics covered</h3>
          <div>
            {event.topics.map((topic) => (
              <span key={topic} className="topic-chip">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="detail-tile">
      <span className="text-[#F5A623] [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}
