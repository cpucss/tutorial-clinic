import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPin } from "lucide-react";

import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { TabKey } from "../../../components/layout/Sidebar";
import { effectiveEventStatus, useAppData } from "../../../context/AppDataContext";
import { formatDateTime } from "../../../utils/format";

type Range = "Day" | "Week" | "Month";

export function SchedulePage({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const { state, currentUser, toggleSchedule } = useAppData();
  const [range, setRange] = useState<Range>("Week");
  const [status, setStatus] = useState("All");

  const userIds = useMemo(
    () => [currentUser?.id, currentUser?.authUserId].filter((id): id is string => Boolean(id)),
    [currentUser?.authUserId, currentUser?.id],
  );

  const ids = useMemo(
    () =>
      new Set([
        ...userIds.flatMap((userId) => state.scheduleEventIds[userId] ?? []),
        ...state.rsvps
          .filter((item) => userIds.includes(item.userId))
          .map((item) => item.eventId),
      ]),
    [state.rsvps, state.scheduleEventIds, userIds],
  );

  const events = useMemo(
    () =>
      state.events
        .filter((event) => {
          const eventDate = new Date(event.date);
          const now = new Date();
          const dayDelta = Math.abs(eventDate.getTime() - now.getTime()) / 86_400_000;
          const inRange =
            range === "Day"
              ? eventDate.toDateString() === now.toDateString()
              : range === "Week"
              ? dayDelta <= 7
              : dayDelta <= 31;
          return (
            ids.has(event.id) &&
            inRange &&
            (status === "All" || effectiveEventStatus(event) === status)
          );
        })
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [ids, range, state.events, status],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Personal agenda</div>
            <h1 className="page-heading">My Schedule</h1>
            <p className="page-description">
              Keep RSVP sessions and saved study clinics together in one personal agenda.
            </p>
          </div>
          <button className="primary-button" onClick={() => onNavigate?.("events")}>
            <CalendarDays size={15} /> Browse sessions
          </button>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 demo-card">
          <div className="flex gap-2" role="tablist">
            {(["Day", "Week", "Month"] as Range[]).map((item) => (
              <button
                className={`filter-chip ${range === item ? "is-active" : ""}`}
                key={item}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="compact-field min-w-40">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {["All", "Upcoming", "Live", "Completed"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          {events.length ? (
            events.map((event) => {
              const rsvped = state.rsvps.some(
                (item) => userIds.includes(item.userId) && item.eventId === event.id,
              );
              const isSaved = userIds.some((uid) =>
                (state.scheduleEventIds[uid] ?? []).includes(event.id),
              );
              const attendance = state.attendance.find(
                (item) => userIds.includes(item.userId) && item.eventId === event.id,
              );

              return (
                <article className="schedule-card" key={event.id}>
                  <div className="schedule-date">
                    <span>
                      {new Date(event.date)
                        .toLocaleDateString(undefined, { month: "short" })
                        .toUpperCase()}
                    </span>
                    <strong>{new Date(event.date).getDate()}</strong>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2>{event.title}</h2>
                      <StatusBadge status={effectiveEventStatus(event)} />
                      {rsvped && <StatusBadge status="RSVP confirmed" />}
                      {attendance && (
                        <StatusBadge status={`Attendance ${attendance.status}`} />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6F6F6F]">
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} />
                        {formatDateTime(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="secondary-button"
                      onClick={() => onNavigate?.("events")}
                    >
                      View details
                    </button>
                    {isSaved && (
                      <button
                        className="secondary-button"
                        onClick={() => void toggleSchedule(event.id)}
                      >
                        Remove save
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              icon={<CalendarDays size={18} />}
              title="Nothing scheduled"
              body={`No ${status.toLowerCase()} sessions are in your ${range.toLowerCase()} agenda.`}
              actionLabel="Find a session"
              onAction={() => onNavigate?.("events")}
            />
          )}
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-[#6F6F6F]">
          <CheckCircle2 size={14} /> RSVP sessions are added automatically; other sessions can be saved manually.
        </div>
      </div>
    </div>
  );
}
