import { useMemo } from "react";
import { CalendarCheck, FileText, BookmarkCheck } from "lucide-react";
import { currentUser, events, notes, leaderboard } from "../../../mock";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";

export function ProfilePage({ rsvped, attended, onShowQr, onCancelRsvp }: { rsvped: Set<string>; attended: Set<string>; onShowQr: (id: string) => void; onCancelRsvp: (id: string) => void }) {
  const myNotes = notes.filter((n) => n.uploader === currentUser.name);
  const rank = useMemo(() => {
    const sorted = [...leaderboard].sort((a, b) => b.points - a.points);
    return sorted.findIndex((l) => l.name === currentUser.name) + 1;
  }, []);
  const upcoming = events.filter((e) => rsvped.has(e.id));
  const history = events.filter((e) => attended.has(e.id));

  return (
    <div className="flex h-full flex-col bg-white lg:flex-row">
      <div className="w-full shrink-0 px-4 py-6 lg:w-[310px]" style={{ background: "#FFFFFF" }}>
        <div className="rounded-xl p-5" style={{ background: "#F5A623", color: "#fff" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#fff", color: "#F5A623", fontSize: 22, fontWeight: 700 }}>
            {currentUser.name[0]}
          </div>
          <div className="mt-3" style={{ fontSize: 18, fontWeight: 700 }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{currentUser.yearLevel} - ID ****{currentUser.studentId.slice(-4)}</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Total points" value={currentUser.points} />
          <Stat label="Leaderboard" value={`#${rank}`} />
          <Stat label="Sessions" value={history.length} />
          <Stat label="Notes shared" value={myNotes.filter((n) => n.status === "Approved").length} />
        </div>
      </div>

      <div className="min-w-0 flex-1 bg-white overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8 lg:pl-12">
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1C1C1C" }}>Hi {currentUser.name.split(" ")[0]}</h1>
          <div className="mt-3" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
            #{currentUser.yearLevel.toLowerCase()} #rank-{rank}
          </div>

          <Section title="My upcoming RSVPs" icon={<BookmarkCheck size={18} color="#F5A623" strokeWidth={1.75} />}>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming RSVPs" body="Head to Events and reserve a seat for a tutorial session." />
            ) : (
              <ul className="grid gap-2">
                {upcoming.map((e) => (
                  <li key={e.id} className="rounded-xl p-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center" style={{ background: "#FAF8F2" }}>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "#6F6F6F" }}>{new Date(e.date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} - {e.venue}</div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button onClick={() => onShowQr(e.id)} className="px-3 py-1.5 rounded-full" style={{ background: "#F5A623", color: "#fff", fontSize: 12, fontWeight: 500 }}>QR</button>
                      <button onClick={() => onCancelRsvp(e.id)} className="px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#1C1C1C", fontSize: 12, fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Cancel</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Attendance history" icon={<CalendarCheck size={18} color="#F5A623" strokeWidth={1.75} />}>
            {history.length === 0 ? (
              <EmptyState title="No confirmed attendance yet" body="Your approved QR scans will show up here after sessions." />
            ) : (
              <ul className="grid gap-2">
                {history.map((e) => (
                  <li key={e.id} className="rounded-xl p-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center" style={{ background: "#FAF8F2" }}>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "#6F6F6F" }}>{new Date(e.date).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#F5A623" }}>+40 pts</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My contributions" icon={<FileText size={18} color="#F5A623" strokeWidth={1.75} />}>
            {myNotes.length === 0 ? (
              <EmptyState title="No uploads yet" body="Shared files and their review status will appear here." />
            ) : (
              <ul className="grid gap-2">
                {myNotes.map((n) => (
                  <li key={n.id} className="rounded-xl p-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center" style={{ background: "#FAF8F2" }}>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "#6F6F6F" }}>{n.subject}</div>
                    </div>
                    <StatusBadge status={n.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 11, color: "#6F6F6F" }}>{label}</div>
      <div className="mt-1" style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1C" }}>{value}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        {icon}
        <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

