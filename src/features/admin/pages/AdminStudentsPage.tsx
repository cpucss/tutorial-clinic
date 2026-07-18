import { useState } from "react";
import { Download, Search, UserPlus } from "lucide-react";

import { currentUser, leaderboard, notes } from "../../../mock";
import { ConfirmDialog } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";

const seedStudents = leaderboard.map((student, index) => ({
  ...student,
  studentId: student.name === currentUser.name ? currentUser.studentId : `2024-${String(410 + index).padStart(5, "0")}`,
  email: `${student.name.toLowerCase().replace(/\s+/g, ".")}@school.edu`,
  uploads: notes.filter((note) => note.uploader === student.name).length,
  attendance: 62 + ((index * 7) % 34),
}));

export function AdminStudentsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const [students, setStudents] = useState(seedStudents);
  const [removeTarget, setRemoveTarget] = useState<(typeof seedStudents)[number] | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Student management</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Students and points
            </h1>
            <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
              Review profiles, point totals, attendance activity, and approved note contributions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="motion-button flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 13, fontWeight: 500 }}>
              <Download size={14} /> Export
            </button>
            <button
              className="motion-button flex items-center gap-1.5 rounded-full px-4 py-2"
              style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}
              onClick={() => onNotify?.({ tone: "info", title: "Add student form", description: "Connect this action to registration or CSV import." })}
            >
              <UserPlus size={14} /> Add Student
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Stat label="Students" value={students.length} />
          <Stat label="Avg attendance" value={`${Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length)}%`} />
          <Stat label="Total points" value={students.reduce((sum, s) => sum + s.points, 0)} />
          <Stat label="Note uploads" value={students.reduce((sum, s) => sum + s.uploads, 0)} />
        </div>

        <div className="mt-5 rounded-xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="p-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Student roster</h2>
            <div className="relative w-full sm:w-[280px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
              <input placeholder="Search student" className="h-9 w-full rounded-full bg-white pl-8 pr-3 outline-none" style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead style={{ background: "#FAF8F2" }}>
                <tr>
                  {["Student", "Year", "Attendance", "Uploads", "Points", ""].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderTop: "1px solid #F0EFE9" }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: "#FAF8F2", color: "#1C1C1C", fontSize: 13, fontWeight: 700 }}>
                          {student.name[0]}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{student.name}</div>
                          <div style={{ fontSize: 12, color: "#6F6F6F" }}>{student.studentId} - {student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ fontSize: 13, color: "#1C1C1C" }}>{student.yearLevel}</td>
                    <td className="px-5 py-3">
                      <div className="w-[120px] h-2 rounded-full overflow-hidden" style={{ background: "#F0EFE9" }}>
                        <div className="h-full rounded-full" style={{ width: `${student.attendance}%`, background: "#F5A623" }} />
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ fontSize: 13, color: "#6F6F6F" }}>{student.uploads}</td>
                    <td className="px-5 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{student.points}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="motion-button rounded-full px-3 py-1"
                          style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}
                          onClick={() => onNotify?.({ tone: "success", title: "Point adjustment opened", description: `${student.name} is ready for admin review.` })}
                        >
                          Adjust Points
                        </button>
                        <button
                          className="motion-button rounded-full px-3 py-1"
                          style={{ background: "#FFF1F1", color: "#6E1C1C", fontSize: 12, fontWeight: 700 }}
                          onClick={() => setRemoveTarget(student)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove this student?"
        body={`${removeTarget?.name ?? "This student"} will be removed from the visible roster. A real backend should archive the account instead of deleting records.`}
        confirmLabel="Remove student"
        cancelLabel="Keep student"
        tone="error"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            setStudents((items) => items.filter((student) => student.id !== removeTarget.id));
            onNotify?.({ tone: "warning", title: "Student removed", description: `${removeTarget.name} left the local roster.` });
          }
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 12, color: "#6F6F6F" }}>{label}</div>
      <div className="mt-2" style={{ fontSize: 28, fontWeight: 700, color: "#1C1C1C", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
