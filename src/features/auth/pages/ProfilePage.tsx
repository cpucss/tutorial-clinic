import { BookOpen, CalendarCheck, Trophy, UserRound } from "lucide-react";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { TabKey } from "../../../components/layout/Sidebar";
import { getUserPoints, useAppData } from "../../../context/AppDataContext";
import { formatDateTime } from "../../../utils/format";

export function ProfilePage({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const { state, currentUser, currentPoints } = useAppData();
  if (!currentUser) return null;

  const attendance = state.attendance.filter((item) => item.userId === currentUser.id);
  const notes = state.notes.filter((item) => item.uploaderId === currentUser.id);
  const ranking = state.users
    .filter((user) => user.role !== "admin" && user.active)
    .map((user) => ({ user, points: getUserPoints(state, user.id) }))
    .sort((a, b) => b.points - a.points);
  const rank = ranking.findIndex((item) => item.user.id === currentUser.id) + 1;
  const rsvps = state.rsvps
    .filter((item) => item.userId === currentUser.id)
    .map((item) => state.events.find((event) => event.id === item.eventId))
    .filter(Boolean);

  // Show student ID as display name if no real name has been set yet
  const displayName = currentUser.name === "Verified Student" || !currentUser.name ? currentUser.studentId : currentUser.name;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

        <section className="profile-hero">
          <div className="profile-avatar"><UserRound /></div>
          <div className="min-w-0 flex-1">
            <div className="section-kicker">
              {currentUser.role === "admin" ? "Admin profile" : "Student profile"}
            </div>
            <h1>{displayName}</h1>
            <p className="mt-1 text-sm text-[#6F6F6F]">
              BS Computer Science • {currentUser.yearLevel ?? "Year level not assigned"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={currentUser.role} />
              <StatusBadge status={currentUser.active ? "Active" : "Inactive"} />
            </div>
          </div>
          <button className="secondary-button" onClick={() => onNavigate?.("settings")}>Edit profile</button>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {currentUser.role !== "admin" && (
            <Stat icon={<Trophy />} label="Total points" value={currentPoints} />
          )}
          <Stat icon={<Trophy />} label="Leaderboard rank" value={currentUser.role === "admin" ? "-" : `#${rank}`} />
          <Stat icon={<CalendarCheck />} label={currentUser.role === "admin" ? "Attendance approvals" : "Approved attendance"} value={currentUser.role === "admin" ? state.attendance.filter(a => a.status === "Pending").length : attendance.filter((item) => item.status === "Approved").length} />
          <Stat icon={<BookOpen />} label={currentUser.role === "admin" ? "Notes (Disabled)" : "Approved notes"} value={currentUser.role === "admin" ? "-" : notes.filter((item) => item.status === "Approved").length} />
        </section>

        <section className="mt-5 grid items-start gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-5 demo-card">
            <h2 className="text-lg font-bold">Profile information</h2>
            <dl className="detail-list">
              <div><dt>Student ID</dt><dd>{currentUser.studentId}</dd></div>
              <div><dt>Program</dt><dd>BS Computer Science</dd></div>
              <div><dt>Year Level</dt><dd>{currentUser.yearLevel ?? "Year level not assigned"}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl bg-white p-5 demo-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Upcoming RSVPs</h2>
              <button className="secondary-button" onClick={() => onNavigate?.("schedule")}>My Schedule</button>
            </div>
            {rsvps.length ? (
              <ul className="mt-4 grid gap-2">
                {rsvps.slice(0, 4).map((event) => event && (
                  <li className="history-row" key={event.id}>
                    <div>
                      <strong>{event.title}</strong>
                      <small>{formatDateTime(event.date)}</small>
                    </div>
                    <StatusBadge status={event.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState title="No session RSVPs" body="Reserve a session from Events to build your schedule." />
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 demo-card">
      <div className="flex items-center justify-between text-[#F5A623]">
        <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        <strong className="text-2xl text-[#1C1C1C]">{value}</strong>
      </div>
      <div className="mt-3 text-xs font-bold text-[#6F6F6F]">{label}</div>
    </div>
  );
}
