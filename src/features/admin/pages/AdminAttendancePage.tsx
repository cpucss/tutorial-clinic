import { Download, Search } from "lucide-react";

import { leaderboard } from "../../../mock";
import { StatusBadge } from "../../../components/common/Feedback";

const rows = leaderboard.slice(0, 8).map((student, index) => ({
  ...student,
  studentId: `2024-${String(index + 421).padStart(5, "0")}`,
  status: index % 4 === 0 ? "Absent" : index % 3 === 0 ? "Pending" : "Present",
  time: index % 4 === 0 ? "-" : `2:${String(10 + index * 4).padStart(2, "0")} PM`,
}));

export function AdminAttendancePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Attendance management</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Session attendance</h1>
          </div>
          <button className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
            <Download size={14} /> Export List
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[310px_1fr] gap-5">
          <aside className="rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <label style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>Session selector</label>
            <select className="mt-2 h-10 w-full rounded-md bg-white px-3 outline-none" style={{ border: "1px solid #F0EFE9", color: "#1C1C1C", fontSize: 13 }}>
              <option>Database Design Clinic</option>
              <option>Intro to Big-O</option>
              <option>Operating Systems Office Hour</option>
            </select>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Action label="Mark Present" primary />
              <Action label="Mark Absent" />
              <Action label="Approve Attendance" wide />
            </div>
          </aside>

          <main className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="p-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Attendance table</h2>
              <div className="relative w-full sm:w-[260px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
                <input placeholder="Search student" className="h-9 w-full rounded-full bg-white pl-8 pr-3 outline-none" style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead style={{ background: "#FAF8F2" }}>
                  <tr>
                    {["Student name", "Student ID", "Status", "Check-in time", ""].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={{ borderTop: "1px solid #F0EFE9" }}>
                      <td className="px-5 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{row.name}</td>
                      <td className="px-5 py-3" style={{ fontSize: 13, color: "#6F6F6F" }}>{row.studentId}</td>
                      <td className="px-5 py-3"><Status label={row.status} /></td>
                      <td className="px-5 py-3" style={{ fontSize: 13, color: "#1C1C1C" }}>{row.time}</td>
                      <td className="px-5 py-3 text-right">
                        <button className="rounded-full px-3 py-1" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Status({ label }: { label: string }) {
  return <StatusBadge status={label} />;
}

function Action({ label, primary = false, wide = false }: { label: string; primary?: boolean; wide?: boolean }) {
  return (
    <button className={wide ? "col-span-2 rounded-full px-4 py-2" : "rounded-full px-4 py-2"} style={{ background: primary ? "#F5A623" : "#F8F8F8", color: primary ? "#FFFFFF" : "#1C1C1C", fontSize: 13, fontWeight: 500 }}>
      {label}
    </button>
  );
}
