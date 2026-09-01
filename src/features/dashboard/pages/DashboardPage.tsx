import { Bell, BookOpen, Calendar, ChevronRight, ClipboardCheck, Megaphone, QrCode, Star, Trophy } from "lucide-react";

import type { TabKey } from "../../../components/layout/Sidebar";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import { getRsvpCount, getUserPoints, useAppData } from "../../../context/AppDataContext";
import { formatDateTime, relativeTime } from "../../../utils/format";

export function DashboardPage({
  onNavigate,
  onOpenQr,
}: {
  onNavigate?: (tab: TabKey) => void;
  onOpenQr?: () => void;
}) {
  const { state, currentUser, currentPoints, unreadCount, allLeaderboardItems, leaderboardItems } = useAppData();
  if (!currentUser) return null;
  const isStudent = currentUser.role !== "admin";
  const accountUserId = currentUser.authUserId ?? currentUser.id;

  const approvedAttendance = state.attendance.filter(
    (record) => (record.userId === currentUser.id || record.userId === accountUserId) && record.status === "Approved"
  );
  const attendanceTotal = state.attendance.filter(
    (record) => (record.userId === currentUser.id || record.userId === accountUserId) && record.status !== "Rejected"
  ).length;
  const attendanceRate = attendanceTotal ? Math.round((approvedAttendance.length / attendanceTotal) * 100) : 0;
  const myNotes = state.notes.filter(
    (note) => note.uploaderId === currentUser.id || note.uploaderId === accountUserId
  );
  const approvedNotes = myNotes.filter((note) => note.status === "Approved").length;
  const pendingNotes = myNotes.filter((note) => note.status === "Pending").length;

  const rankList = allLeaderboardItems.length > 0 ? allLeaderboardItems : leaderboardItems;
  const userRankItem = rankList.find(
    (item) => item.id === accountUserId || item.id === currentUser.id
  );
  const rank = userRankItem?.rank;

  const scheduledIds = new Set([
    ...(state.scheduleEventIds[currentUser.id] ?? []),
    ...(accountUserId ? state.scheduleEventIds[accountUserId] ?? [] : []),
    ...state.rsvps
      .filter((item) => item.userId === currentUser.id || item.userId === accountUserId)
      .map((item) => item.eventId),
  ]);
  const upcoming = state.events
    .filter((event) => scheduledIds.has(event.id) && new Date(event.endDate) > new Date() && event.status !== "Cancelled")
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 3);
  const recentNotifications = state.notifications
    .filter((item) => item.userId === currentUser.id || item.userId === accountUserId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 4);
  const announcement = state.announcements
    .filter((item) => item.audience === "All" || item.audience === currentUser.yearLevel)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.publishedAt) - +new Date(a.publishedAt))[0];

  const getFirstName = (fullName: string): string => {
    if (!fullName) return "Student";
    if (fullName.includes(",")) {
      const parts = fullName.split(",");
      if (parts[1]) {
        return parts[1].trim().split(" ")[0];
      }
    }
    return fullName.trim().split(" ")[0];
  };

  const getGreeting = () => {
    const firstName = getFirstName(currentUser.name);
    if (currentUser.role === "admin") {
      return `Welcome, Admin ${firstName}!`;
    }
    return `Welcome back, ${firstName}!`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
          <div className="motion-card rounded-xl bg-white p-6 demo-card">
            <div className="section-kicker">
              {currentUser.role === "admin" ? "Admin dashboard" : "Student dashboard"}
            </div>
            <h1 className="page-heading mt-1">{getGreeting()}</h1>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="Student ID" value={currentUser.studentId} />
              <Info label="Year Level" value={currentUser.yearLevel ?? "Not set"} />
            </dl>
          </div>
          <div className="motion-card rounded-xl p-5 text-white" style={{ background: "#1C1C1C" }}>
            <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12 }}>Current standing</div>
            <div className="mt-3 flex items-end justify-between"><strong style={{ fontSize: 46 }}>#{rank || "-"}</strong><Trophy color="#F5A623" size={28} /></div>
            <div style={{ color: "#F5A623", fontSize: 14, fontWeight: 800 }}>{currentPoints} points</div>
            <button className="motion-button mt-6 flex w-full items-center justify-between rounded-full bg-white px-4 py-2 text-sm font-bold text-black" onClick={() => onNavigate?.("leaderboard")}>View leaderboard <ChevronRight size={15} /></button>
          </div>
        </section>

        {isStudent && (
          <section className="mt-5">
            <div className="motion-card flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-r from-[#1C1C1C] to-[#2D2D2D] p-5 text-white shadow-sm sm:flex-row sm:items-center demo-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F5A623]">
                  <QrCode size={26} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Generate My QR</h2>
                  <p className="text-xs text-white/70">
                    Generate a secure five-minute QR for an administrator to scan.
                  </p>
                </div>
              </div>
              <button
                className="motion-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-black shadow-sm transition hover:bg-[#E59819] shrink-0"
                type="button"
                onClick={onOpenQr ?? (() => onNavigate?.("attendance-history"))}
              >
                <QrCode size={16} /> Generate My QR
              </button>
            </div>
          </section>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Trophy />} label="Total points" value={String(currentPoints)} detail="View full point history" onClick={() => onNavigate?.("points-history")} />
          <Metric icon={<ClipboardCheck />} label="Attendance" value={`${attendanceRate}%`} detail={`${approvedAttendance.length} approved sessions`} onClick={() => onNavigate?.("attendance-history")} />
          <Metric icon={<BookOpen />} label="Approved notes" value={String(approvedNotes)} detail={`${pendingNotes} awaiting review`} onClick={() => onNavigate?.("my-notes")} />
          <Metric icon={<Bell />} label="Unread updates" value={String(unreadCount)} detail="Open notification inbox" onClick={() => onNavigate?.("notifications")} />
        </section>

        <section className="mt-5 grid items-start gap-5 xl:grid-cols-[1fr_340px]">
          <Panel title="Upcoming schedule" action="Open My Schedule" onAction={() => onNavigate?.("schedule")}>
            {upcoming.length ? <div className="grid gap-3">{upcoming.map((event) => <button key={event.id} className="nested-card rounded-xl bg-[#FAF8F2] p-4 text-left" onClick={() => onNavigate?.("events")}><div className="flex justify-between gap-3"><div><div className="font-bold text-[#1C1C1C]">{event.title}</div><div className="mt-1 text-xs text-[#6F6F6F]">{formatDateTime(event.date)} - {event.venue}</div></div><StatusBadge status={`${getRsvpCount(state, event.id)}/${event.capacity} going`} /></div></button>)}</div> : <EmptyState title="Your schedule is open" body="RSVP to a session or add one from Events to see it here." actionLabel="Browse sessions" onAction={() => onNavigate?.("events")} />}
          </Panel>
          <div className="grid gap-5">
            {announcement && <Panel title="Important announcement" action="View all" onAction={() => onNavigate?.("announcements")}><div className="flex gap-3"><Megaphone size={18} color="#F5A623" /><div><div className="font-bold text-sm">{announcement.title}</div><p className="mt-1 text-xs leading-relaxed text-[#6F6F6F]">{announcement.body}</p></div></div></Panel>}
            <Panel title="Recent activity" action="Notifications" onAction={() => onNavigate?.("notifications")}>
              {recentNotifications.length ? <ul className="grid gap-3">{recentNotifications.map((item) => <li key={item.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F5A623]" /><div><div className="text-sm font-bold">{item.title}</div><div className="text-xs text-[#6F6F6F]">{relativeTime(item.createdAt)}</div></div></li>)}</ul> : <EmptyState title="No recent activity" body="Your latest account activity will appear here." />}
            </Panel>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Quick icon={<Calendar />} label="Browse Sessions" onClick={() => onNavigate?.("events")} />
          <Quick icon={<Star />} label="My Schedule" onClick={() => onNavigate?.("schedule")} />
          <Quick icon={<QrCode />} label={isStudent ? "Generate My QR" : "Attendance Review"} onClick={isStudent ? (onOpenQr ?? (() => onNavigate?.("attendance-history"))) : () => onNavigate?.("admin-attendance")} />
          <Quick icon={<BookOpen />} label="Upload Notes" onClick={() => onNavigate?.("my-notes")} />
          <Quick icon={<Trophy />} label="Leaderboard" onClick={() => onNavigate?.("leaderboard")} />
          <Quick icon={<Bell />} label="Notifications" onClick={() => onNavigate?.("notifications")} />
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#FAF8F2] px-4 py-3"><dt className="text-[11px] text-[#6F6F6F]">{label}</dt><dd className="mt-1 truncate text-sm font-bold">{value}</dd></div>; }
function Metric({ icon, label, value, detail, onClick }: { icon: React.ReactNode; label: string; value: string; detail: string; onClick: () => void }) { return <button className="motion-card rounded-xl bg-white p-4 text-left demo-card" onClick={onClick}><div className="flex items-center justify-between text-[#F5A623]"><span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span><strong className="text-2xl text-[#1C1C1C]">{value}</strong></div><div className="mt-3 text-sm font-bold">{label}</div><div className="text-xs text-[#6F6F6F]">{detail}</div></button>; }
function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="rounded-xl bg-white p-5 demo-card"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2>{action && <button className="secondary-button" onClick={onAction}>{action}</button>}</div>{children}</section>; }
function Quick({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button className="motion-button flex items-center justify-between rounded-xl bg-white p-4 text-left text-sm font-bold demo-card" onClick={onClick}><span className="flex items-center gap-2 text-[#1C1C1C]"><span className="text-[#F5A623] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</span><ChevronRight size={14} /></button>; }
