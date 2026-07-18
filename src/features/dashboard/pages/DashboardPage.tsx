import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Trophy,
  User,
} from "lucide-react";

import { currentUser, events, leaderboard, notes } from "../../../mock";
import type { TabKey } from "../../../components/layout/Sidebar";

const activity = [
  { label: "Attendance confirmed", meta: "Database Design Clinic / +40 pts" },
  { label: "Note awaiting review", meta: "ER diagram practice set" },
  { label: "Rank updated", meta: "You moved into the Junior top 5" },
];

export function DashboardPage({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const approvedNotes = notes.filter((note) => note.status === "Approved");
  const myNotes = notes.filter((note) => note.uploader === currentUser.name);
  const sorted = [...leaderboard].sort((a, b) => b.points - a.points);
  const rank = sorted.findIndex((entry) => entry.name === currentUser.name) + 1 || 5;
  const upcoming = events
    .filter((event) => new Date(event.date) >= new Date())
    .slice(0, 3);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <section className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-5">
          <div className="motion-card rounded-xl p-6" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Student home</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Welcome back, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="mt-3 max-w-xl" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
              Track your Tutorial Clinic points, check upcoming sessions, and jump back into notes or profile updates.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <InfoPill label="Student ID" value={currentUser.studentId} />
              <InfoPill label="Year level" value={currentUser.yearLevel} />
              <InfoPill label="Email" value={currentUser.email} />
            </div>
          </div>

          <div className="motion-card dark-card rounded-xl p-5 flex flex-col justify-between" style={{ background: "#1C1C1C" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)" }}>Current standing</div>
              <div className="mt-2" style={{ fontSize: 44, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>
                #{rank}
              </div>
              <div className="mt-2" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
                {currentUser.points} total points
              </div>
            </div>
            <button
              onClick={() => onNavigate?.("leaderboard")}
              className="motion-button mt-6 flex items-center justify-between rounded-full px-4 py-2"
              style={{ background: "#FFFFFF", color: "#1C1C1C", fontSize: 13, fontWeight: 500 }}
            >
              View Leaderboard
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <MetricCard icon={<Trophy size={18} />} label="Total points" value={currentUser.points.toString()} detail="+40 from last session" />
          <MetricCard icon={<ClipboardCheck size={18} />} label="Attendance count" value="8" detail="3 sessions this month" />
          <MetricCard icon={<BookOpen size={18} />} label="Notes contributed" value={myNotes.length.toString()} detail={`${approvedNotes.length} approved notes in library`} />
        </section>

        <section className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
          <Panel title="Upcoming tutorial sessions" action="View Events" onAction={() => onNavigate?.("events")}>
            <div className="flex flex-col gap-3">
              {(upcoming.length ? upcoming : events.slice(0, 3)).map((event) => {
                const date = new Date(event.date);
                return (
                  <div key={event.id} className="motion-card nested-card rounded-xl p-4" style={{ background: "#FAF8F2" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1C" }}>{event.title}</div>
                        <div className="mt-1" style={{ fontSize: 12, color: "#6F6F6F" }}>
                          {event.venue} / {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                      <span className="rounded-full px-2.5 py-1" style={{ background: "#FFFFFF", color: "#F5A623", fontSize: 11, fontWeight: 700 }}>
                        {event.rsvps}/{event.capacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Recent activity">
            <div className="flex flex-col gap-3">
              {activity.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: "#F5A623" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#6F6F6F" }}>{item.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <QuickButton icon={<Calendar size={16} />} label="View Events" onClick={() => onNavigate?.("events")} />
          <QuickButton icon={<BookOpen size={16} />} label="View Notes" onClick={() => onNavigate?.("notes")} />
          <QuickButton icon={<Trophy size={16} />} label="View Leaderboard" onClick={() => onNavigate?.("leaderboard")} />
          <QuickButton icon={<User size={16} />} label="View Profile" onClick={() => onNavigate?.("profile")} />
        </section>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="motion-card nested-card rounded-xl px-4 py-3" style={{ background: "#FAF8F2" }}>
      <div style={{ fontSize: 11, color: "#6F6F6F" }}>{label}</div>
      <div className="mt-1 truncate" style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C" }}>{value}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="motion-card rounded-xl p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between">
        <span style={{ color: "#F5A623" }}>{icon}</span>
        <Bell size={15} color="#6F6F6F" />
      </div>
      <div className="mt-4" style={{ fontSize: 28, fontWeight: 700, color: "#1C1C1C", lineHeight: 1 }}>{value}</div>
      <div className="mt-2" style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#6F6F6F" }}>{detail}</div>
    </div>
  );
}

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <div className="motion-card rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>{title}</h2>
        {action && (
          <button onClick={onAction} className="motion-button rounded-full px-3 py-1" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}>
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function QuickButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="motion-card motion-button rounded-xl p-4 text-left flex items-center justify-between" style={{ background: "#FFFFFF", color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <span className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: "#F5A623" }}>{icon}</span>
        {label}
      </span>
      <ChevronRight size={14} color="#6F6F6F" />
    </button>
  );
}
