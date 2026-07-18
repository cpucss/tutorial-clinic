import { BookOpen, CalendarDays, ClipboardCheck, GraduationCap, Users } from "lucide-react";

import { events, leaderboard, notes } from "../../../mock";
import type { TabKey } from "../../../components/layout/Sidebar";

const recentActivity = [
  "Nadia Cruz approved attendance for Database Design Clinic",
  "Aria Mendoza submitted ER diagram practice set",
  "Liam Park enabled attendance for Intro to Big-O",
];

export function AdminDashboardPage({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const pendingNotes = notes.filter((note) => note.status === "Pending");
  const totalSessions = events.length;
  const totalStudents = Math.max(leaderboard.length, 12);
  const attendanceRate = 84;
  const leaders = [...leaderboard].sort((a, b) => b.points - a.points).slice(0, 4);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col items-start justify-between gap-5 lg:flex-row">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Admin overview</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Tutorial Clinic control center
            </h1>
            <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
              Monitor students, sessions, attendance, notes, and subject activity from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <AdminButton label="Manage Sessions" onClick={() => onNavigate?.("admin-sessions")} />
            <AdminButton label="Manage Attendance" primary onClick={() => onNavigate?.("admin-attendance")} />
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Stat icon={<Users size={18} />} label="Total students" value={totalStudents.toString()} />
          <Stat icon={<CalendarDays size={18} />} label="Total sessions" value={totalSessions.toString()} />
          <Stat icon={<ClipboardCheck size={18} />} label="Attendance statistics" value={`${attendanceRate}%`} />
          <Stat icon={<BookOpen size={18} />} label="Pending notes" value={pendingNotes.length.toString()} />
        </section>

        <section className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Leaderboard preview</h2>
              <GraduationCap size={18} color="#F5A623" />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {leaders.map((student, index) => (
                <div key={student.id} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: index === 0 ? "#1C1C1C" : "#FAF8F2" }}>
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: index === 0 ? "#F5A623" : "#FFFFFF", color: index === 0 ? "#FFFFFF" : "#1C1C1C", fontSize: 12, fontWeight: 700 }}>
                      {index + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: index === 0 ? "#FFFFFF" : "#1C1C1C" }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: index === 0 ? "rgba(255,255,255,0.62)" : "#6F6F6F" }}>{student.yearLevel}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: index === 0 ? "#FFFFFF" : "#1C1C1C" }}>{student.points} pts</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Recent activity</h2>
            <div className="mt-4 flex flex-col gap-4">
              {recentActivity.map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: "#F5A623" }} />
                  <p style={{ fontSize: 13, color: "#1C1C1C", lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <AdminButton label="Review Notes" onClick={() => onNavigate?.("admin-notes")} />
              <AdminButton label="Manage Students" onClick={() => onNavigate?.("admin-students")} />
              <AdminButton label="Manage Subjects" onClick={() => onNavigate?.("admin-subjects")} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between">
        <span style={{ color: "#F5A623" }}>{icon}</span>
        <span className="h-2 w-2 rounded-full" style={{ background: "#F5A623" }} />
      </div>
      <div className="mt-4" style={{ fontSize: 28, fontWeight: 700, color: "#1C1C1C", lineHeight: 1 }}>{value}</div>
      <div className="mt-2" style={{ fontSize: 13, color: "#6F6F6F" }}>{label}</div>
    </div>
  );
}

function AdminButton({ label, primary = false, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="motion-button rounded-full px-4 py-2" style={{ background: primary ? "#F5A623" : "#F8F8F8", color: primary ? "#FFFFFF" : "#1C1C1C", fontSize: 13, fontWeight: 500 }}>
      {label}
    </button>
  );
}
