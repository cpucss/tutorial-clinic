import { useMemo, useState } from "react";
import { CalendarX, Clock, MapPin, Users, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { events } from "../../../mock";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { YearLevel } from "../../../types/common";
import type { EventItem } from "../../../types/data";

const YEARS: ("All" | YearLevel)[] = ["All", "Freshman", "Sophomore", "Junior", "Senior"];

export function EventsPage({
  rsvped,
  onToggleRsvp,
  onShowQr,
  year,
  onYearChange,
}: {
  rsvped: Set<string>;
  onToggleRsvp: (id: string) => void;
  onShowQr: (id: string) => void;
  year: "All" | YearLevel;
  onYearChange: (y: "All" | YearLevel) => void;
}) {
  const setYear = onYearChange;
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selected, setSelected] = useState<string>(events[0].id);
  const [yearOpen, setYearOpen] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const isUpcoming = new Date(e.date) >= now;
      if (tab === "upcoming" && !isUpcoming) return false;
      if (tab === "past" && isUpcoming) return false;
      if (year !== "All" && !e.yearLevels.includes(year)) return false;
      return true;
    });
  }, [year, tab]);

  const current = filtered.find((e) => e.id === selected) ?? filtered[0];

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full shrink-0 px-4 py-5 flex flex-col min-h-0 lg:h-full lg:w-[310px]" style={{ background: "#FFFFFF" }}>
        <div className="flex items-end justify-between mb-3">
          <span style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Events</span>
          <span style={{ fontSize: 12, color: "#6F6F6F" }}>{filtered.length} sessions</span>
        </div>

        <div className="flex gap-2 mb-4 items-center">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="motion-button px-3 py-1 rounded-full"
              style={{
                fontSize: 12,
                fontWeight: 500,
                background: tab === t ? "#1C1C1C" : "#F8F8F8",
                color: tab === t ? "#fff" : "#1C1C1C",
              }}
            >
              {t === "upcoming" ? "Upcoming" : "Past"}
            </button>
          ))}

          <div className="relative ml-auto">
            <button
              onClick={() => setYearOpen((o) => !o)}
              className="motion-button flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ fontSize: 12, fontWeight: 500, background: "#F8F8F8", color: "#1C1C1C" }}
            >
              {year}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {yearOpen && (
              <motion.div
                className="absolute right-0 top-full mt-1 rounded-xl py-1.5 z-10"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 140 }}
              >
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => { setYear(y); setYearOpen(false); }}
                    className="dropdown-option w-full text-left px-3 py-1.5"
                    style={{ fontSize: 13, color: "#1C1C1C", fontWeight: year === y ? 700 : 400, background: year === y ? "#FAF8F2" : "transparent" }}
                  >
                    {y}
                  </button>
                ))}
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex max-h-[34dvh] flex-col gap-2.5 overflow-y-auto pr-1 lg:max-h-none">
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              selected={e.id === selected}
              rsvped={rsvped.has(e.id)}
              onSelect={() => setSelected(e.id)}
            />
          ))}
          {filtered.length === 0 && (
            <EmptyState
              icon={<CalendarX size={18} />}
              title="No sessions in this view"
              body="Change the year filter or switch between upcoming and past sessions."
            />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 bg-white">
        {current && (
          <EventDetail
            event={current}
            rsvped={rsvped.has(current.id)}
            onRsvp={() => onToggleRsvp(current.id)}
            onShowQr={() => onShowQr(current.id)}
          />
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  selected,
  rsvped,
  onSelect,
}: {
  event: EventItem;
  selected: boolean;
  rsvped: boolean;
  onSelect: () => void;
}) {
  const bg = selected ? "#F5A623" : "#F8F8F8";
  const textPri = selected ? "#FFFFFF" : "#1C1C1C";
  const textSec = selected ? "rgba(255,255,255,0.85)" : "#6F6F6F";
  const tagColor = selected ? "#FFFFFF" : "#F5A623";
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <motion.button
      onClick={onSelect}
      className="event-card motion-card text-left rounded-xl p-4"
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 31 }}
      style={{ background: bg }}
    >
      <div className="flex items-start justify-between gap-2">
        <div style={{ fontSize: 15, fontWeight: 700, color: textPri, lineHeight: 1.4 }}>{event.title}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={selected ? "#fff" : rsvped ? "#1C1C1C" : "transparent"} stroke={selected ? "#fff" : rsvped ? "#1C1C1C" : "#6F6F6F"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11.48 3.5a.58.58 0 0 1 1.04 0l2.31 4.68a.58.58 0 0 0 .44.32l5.16.75a.58.58 0 0 1 .32.99l-3.74 3.64a.58.58 0 0 0-.17.51l.88 5.14a.58.58 0 0 1-.84.61l-4.62-2.43a.58.58 0 0 0-.54 0L7.1 20.14a.58.58 0 0 1-.84-.61l.88-5.14a.58.58 0 0 0-.17-.51l-3.74-3.64a.58.58 0 0 1 .32-.99l5.16-.75a.58.58 0 0 0 .44-.32l2.31-4.68Z" /></svg>
      </div>
      <div className="mt-1.5" style={{ fontSize: 13, color: textSec, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        with {event.speaker} - {event.topics.join(", ")}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span style={{ fontSize: 12, color: textSec }}>{dateStr} - {timeStr}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: selected ? "#FFFFFF" : "#1C1C1C" }}>
          {event.yearLevels.map((y) => `#${y.toLowerCase()}`).join(" ")}
        </span>
      </div>
    </motion.button>
  );
}

const ATTENDEES = [
  { name: "Liam Park", year: "Senior", color: "#F5A623" },
  { name: "Nadia Cruz", year: "Senior", color: "#1C1C1C" },
  { name: "Marco Lin", year: "Junior", color: "#C7D9C0" },
  { name: "Devon Reyes", year: "Sophomore", color: "#E8D9B8" },
  { name: "Priya Shah", year: "Sophomore", color: "#6F6F6F" },
  { name: "Sam Okafor", year: "Freshman", color: "#F5A623" },
];

function EventDetail({
  event,
  rsvped,
  onRsvp,
  onShowQr,
}: {
  event: EventItem;
  rsvped: boolean;
  onRsvp: () => void;
  onShowQr: () => void;
}) {
  const d = new Date(event.date);
  const attendees = ATTENDEES.slice(0, Math.min(ATTENDEES.length, Math.max(3, event.rsvps % ATTENDEES.length || 4)));
  return (
    <motion.div
      key={event.id}
      className="overflow-y-auto h-full"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full h-[220px] overflow-hidden" style={{ background: "#F4EFE3" }}>
        <Illustration />
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div style={{ fontSize: 12, color: "#6F6F6F" }}>
          {d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>{event.title}</div>
        <div className="mt-3 flex gap-2 flex-wrap" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
          <StatusBadge status={event.rsvps >= event.capacity ? "Full" : new Date(event.date) >= new Date() ? "Upcoming" : "Completed"} />
          {event.yearLevels.map((y) => <span key={y}>#{y.toLowerCase()}</span>)}
          {event.topics.map((t) => <span key={t}>#{t.toLowerCase().replace(/\s+/g, "-")}</span>)}
        </div>

        <p className="mt-5" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
          {event.speaker} ({event.speakerRole}) is leading this Tutorial Clinic session. Bring your laptop, your half-finished code, and your toughest questions for a guided, peer-supported study hour.
        </p>

        <div className="mt-8" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Session details</div>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
          <DetailRow icon={<Clock size={16} color="#1C1C1C" strokeWidth={1.75} />} label={d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", weekday: "short" })} />
          <DetailRow icon={<MapPin size={16} color="#1C1C1C" strokeWidth={1.75} />} label={event.venue} />
          <DetailRow icon={<Users size={16} color="#1C1C1C" strokeWidth={1.75} />} label={`${event.rsvps}/${event.capacity} slots filled`} />
          <DetailRow icon={<Check size={16} color="#1C1C1C" strokeWidth={1.75} />} label={`Open to ${event.yearLevels.join(" & ")}`} />
        </ul>

        <div className="mt-8" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>What you'll cover</div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          {event.topics.map((t) => (
            <label key={t} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#F5A623" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fff" }} />
              </span>
              <span style={{ fontSize: 14, color: "#1C1C1C" }}>{t}</span>
            </label>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Who's attending</span>
          <span style={{ fontSize: 12, color: "#6F6F6F" }}>{event.rsvps} going</span>
        </div>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <div className="flex -space-x-2">
            {attendees.map((a) => (
              <div key={a.name} title={`${a.name} - ${a.year}`} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: a.color, color: "#fff", fontSize: 12, fontWeight: 700, border: "2px solid #fff" }}>
                {a.name[0]}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F4F1E8", color: "#1C1C1C", fontSize: 11, fontWeight: 700, border: "2px solid #fff" }}>
              +{Math.max(0, event.rsvps - attendees.length)}
            </div>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          {attendees.map((a) => (
            <li key={a.name} className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: a.color, color: "#fff", fontSize: 11, fontWeight: 700 }}>{a.name[0]}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1C1C1C" }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "#6F6F6F" }}>{a.year}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={onRsvp}
            className="motion-button px-5 py-2.5 rounded-full"
            style={{
              background: rsvped ? "#1C1C1C" : "#F5A623",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {rsvped ? "Cancel RSVP" : "RSVP to this session"}
          </button>
          {rsvped && (
            <button
              onClick={onShowQr}
              className="motion-button px-5 py-2.5 rounded-full"
              style={{ background: "#fff", color: "#1C1C1C", fontSize: 13, fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              Show my QR code
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {icon}
      <span style={{ fontSize: 14, color: "#1C1C1C" }}>{label}</span>
    </li>
  );
}

function Illustration() {
  return (
    <svg className="hero-illustration" viewBox="0 0 800 220" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="220" fill="#F4EFE3" />
      <circle cx="120" cy="70" r="40" fill="#E8D9B8" />
      <circle cx="680" cy="50" r="28" fill="#F5A623" opacity="0.3" />
      <rect x="560" y="80" width="140" height="120" fill="#C7D9C0" />
      <rect x="40" y="160" width="720" height="10" fill="#E0DACB" />
      <rect x="300" y="100" width="180" height="6" fill="#F5A623" />
      <circle cx="400" cy="135" r="18" fill="#1C1C1C" />
      <rect x="382" y="150" width="36" height="40" rx="8" fill="#F5A623" />
      <circle cx="220" cy="180" r="6" fill="#1C1C1C" opacity="0.4" />
      <circle cx="600" cy="180" r="6" fill="#1C1C1C" opacity="0.4" />
    </svg>
  );
}
