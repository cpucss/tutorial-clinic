import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Search, X } from "lucide-react";
import { ConfirmDialog, EmptyState, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { getUserPoints, useAppData } from "../../../context/AppDataContext";
import type { DemoUser } from "../../../types/app";
import type { YearLevel } from "../../../types/common";
import { downloadCsv, formatDateTime } from "../../../utils/format";

export function AdminStudentsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, saveUser } = useAppData();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("All");
  const [access, setAccess] = useState("Active");
  const [editor, setEditor] = useState<DemoUser | null>(null);
  const [profile, setProfile] = useState<DemoUser | null>(null);
  const [pointsUser, setPointsUser] = useState<DemoUser | null>(null);
  const [deactivate, setDeactivate] = useState<DemoUser | null>(null);

  const students = useMemo(
    () =>
      state.users
        .filter(
          (user) =>
            user.role !== "admin" &&
            (!query || `${user.name} ${user.studentId} ${user.email}`.toLowerCase().includes(query.toLowerCase())) &&
            (year === "All" || user.yearLevel === year) &&
            (access === "All" || (access === "Active" ? user.active : !user.active))
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [access, query, state.users, year]
  );

  function exportRows() {
    downloadCsv(
      "tutorial-clinic-students.csv",
      students.map((user) => ({
        student_id: user.studentId,
        name: user.name,
        year: user.yearLevel,
        section: user.section,
        email: user.email,
        role: user.role,
        active: user.active,
        points: getUserPoints(state, user.id),
        attendance_records: state.attendance.filter((item) => item.userId === user.id).length,
        note_uploads: state.notes.filter((item) => item.uploaderId === user.id).length,
      }))
    );
    onNotify?.({ tone: "success", title: "Student CSV exported", description: `${students.length} visible students were included.` });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="section-kicker">Student management</div>
            <h1 className="page-heading">Students</h1>
            <p className="page-description">Manage student academic profiles, year levels, sections, and access privileges.</p>
          </div>
          <div className="flex gap-2">
            <button className="secondary-button" onClick={exportRows}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-3 rounded-xl bg-white p-4 demo-card md:grid-cols-[1fr_180px_180px]">
          <label className="search-field">
            <Search size={15} />
            <span className="sr-only">Search students</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student or ID" />
          </label>
          <Filter label="Year" value={year} onChange={setYear} options={["All", "Freshman", "Sophomore", "Junior", "Senior"]} />
          <Filter label="Access" value={access} onChange={setAccess} options={["All", "Active", "Inactive"]} />
        </section>

        <section className="mt-5 overflow-hidden rounded-xl bg-white demo-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Year Level</th>
                  <th>Section</th>
                  <th>Program</th>
                  <th>Role</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((user) => {
                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <small>{user.studentId}</small>
                        {!user.active && <StatusBadge status="Inactive" />}
                      </td>
                      <td>{user.yearLevel}</td>
                      <td>{user.section}</td>
                      <td>{user.program}</td>
                      <td>
                        <span className="capitalize">{user.role}</span>
                      </td>
                      <td>
                        <strong>{getUserPoints(state, user.id)}</strong>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => setProfile(user)}>
                            <Eye size={14} /> Profile
                          </button>
                          <button onClick={() => setEditor(user)}>
                            <Pencil size={14} /> Edit
                          </button>
                          {user.active ? (
                            <button className="danger-text" onClick={() => setDeactivate(user)}>
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                const result = await saveUser({ ...user, active: true });
                                onNotify?.({
                                  tone: result.ok ? "success" : "error",
                                  title: result.ok ? "Student reactivated" : "Failed to reactivate",
                                  description: result.ok ? `${user.name}'s account access was restored.` : result.message,
                                });
                              }}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!students.length && (
            <div className="p-5">
              <EmptyState title="No students found" body="Change the search or student filters." />
            </div>
          )}
        </section>
      </div>

      {editor && <StudentEditor user={editor} onClose={() => setEditor(null)} onNotify={onNotify} />}
      {profile && (
        <StudentProfile
          user={profile}
          onClose={() => setProfile(null)}
          onAdjust={() => {
            setProfile(null);
            setPointsUser(profile);
          }}
        />
      )}
      {pointsUser && <PointAdjuster user={pointsUser} onClose={() => setPointsUser(null)} onNotify={onNotify} />}
      <ConfirmDialog
        open={Boolean(deactivate)}
        title="Deactivate this student?"
        body={`${deactivate?.name ?? "This student"} will no longer be able to sign in, but their records remain available for reporting.`}
        confirmLabel="Deactivate student"
        cancelLabel="Keep active"
        tone="error"
        onCancel={() => setDeactivate(null)}
        onConfirm={async () => {
          if (deactivate) {
            const result = await saveUser({ ...deactivate, active: false });
            onNotify?.({
              tone: result.ok ? "warning" : "error",
              title: result.ok ? "Student deactivated" : "Failed to deactivate",
              description: result.ok ? `${deactivate.name}'s account access was disabled.` : result.message,
            });
          }
          setDeactivate(null);
        }}
      />
    </div>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="compact-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function StudentEditor({ user, onClose, onNotify }: { user: DemoUser; onClose: () => void; onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { saveUser } = useAppData();
  const [name, setName] = useState(user.name);
  const [yearLevel, setYearLevel] = useState<YearLevel>(user.yearLevel);
  const [section, setSection] = useState(user.section);
  const [program, setProgram] = useState(user.program);
  const [role, setRole] = useState<"student" | "contributor">(user.role === "contributor" ? "contributor" : "student");
  const [active, setActive] = useState(user.active);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) {
      setError("Enter a valid name.");
      return;
    }
    const result = await saveUser({
      ...user,
      name: name.trim(),
      yearLevel,
      section: section.trim(),
      program: program.trim(),
      role,
      active,
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onNotify?.({ tone: "success", title: "Student profile updated", description: `${name.trim()}'s profile was saved.` });
    onClose();
  }

  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div className="entity-editor-dialog" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <div className="section-kicker">Edit student profile</div>
            <h2>{user.name}</h2>
            <p className="text-xs text-muted-foreground">{user.studentId} • {user.email}</p>
          </div>
          <button className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        {error && <InlineNotice tone="error" title="Student not saved">{error}</InlineNotice>}
        <div className="entity-form-grid">
          <label className="form-field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Year level</span>
            <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value as YearLevel)}>
              {["Freshman", "Sophomore", "Junior", "Senior"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <input value={section} onChange={(e) => setSection(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Program</span>
            <input value={program} onChange={(e) => setProgram(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as "student" | "contributor")}>
              <option value="student">Student</option>
              <option value="contributor">Contributor</option>
            </select>
          </label>
          <label className="check-chip self-end">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active account
          </label>
        </div>
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={submit}>
            Save profile
          </button>
        </footer>
      </div>
    </div>
  );
}

function StudentProfile({ user, onClose, onAdjust }: { user: DemoUser; onClose: () => void; onAdjust: () => void }) {
  const { state } = useAppData();
  const transactions = state.points.filter((item) => item.userId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div className="entity-detail-dialog" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <div className="section-kicker">Student profile</div>
            <h2>{user.name}</h2>
            <p>{user.studentId}</p>
          </div>
          <button className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <dl className="detail-list">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Program</dt>
            <dd>{user.program}</dd>
          </div>
          <div>
            <dt>Year and section</dt>
            <dd>
              {user.yearLevel} - {user.section}
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd className="capitalize">{user.role}</dd>
          </div>
          <div>
            <dt>Points</dt>
            <dd>{getUserPoints(state, user.id)}</dd>
          </div>
          <div>
            <dt>Account setup</dt>
            <dd>{user.accountSetup.completed ? "Completed" : "Pending first login"}</dd>
          </div>
        </dl>
        <h3 className="mt-5 font-bold">Recent point history</h3>
        <ul className="mt-2 grid gap-2">
          {transactions.slice(0, 5).map((item) => (
            <li className="history-row" key={item.id}>
              <span>
                {item.reason}
                <small>{formatDateTime(item.createdAt)}</small>
              </span>
              <strong>
                {item.points > 0 ? "+" : ""}
                {item.points}
              </strong>
            </li>
          ))}
        </ul>
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button className="primary-button" onClick={onAdjust}>
            Adjust points
          </button>
        </footer>
      </div>
    </div>
  );
}

function PointAdjuster({ user, onClose, onNotify }: { user: DemoUser; onClose: () => void; onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, adjustPoints } = useAppData();
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const transactions = state.points.filter((item) => item.userId === user.id && item.relatedType === "Adjustment").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  async function save() {
    const result = await adjustPoints(user.id, points, reason);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onNotify?.({ tone: "success", title: "Points adjusted", description: `${points > 0 ? "+" : ""}${points} points were recorded for ${user.name}.` });
    onClose();
  }
  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div className="entity-detail-dialog" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <div className="section-kicker">Point adjustment</div>
            <h2>{user.name}</h2>
            <p>Current balance: {getUserPoints(state, user.id)}</p>
          </div>
          <button className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        {error && <InlineNotice tone="error" title="Adjustment not saved">{error}</InlineNotice>}
        <div className="entity-form-grid mt-5">
          <label className="form-field">
            <span>Points (use a negative value to deduct)</span>
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </label>
          <label className="form-field md:col-span-2">
            <span>Reason</span>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </div>
        {transactions.length > 0 && (
          <>
            <h3 className="mt-5 font-bold">Adjustment history</h3>
            <ul className="mt-2 grid gap-2">
              {transactions.slice(0, 4).map((item) => (
                <li className="history-row" key={item.id}>
                  <span>
                    {item.reason}
                    <small>{formatDateTime(item.createdAt)}</small>
                  </span>
                  <strong>
                    {item.points > 0 ? "+" : ""}
                    {item.points}
                  </strong>
                </li>
              ))}
            </ul>
          </>
        )}
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={save}>
            Record adjustment
          </button>
        </footer>
      </div>
    </div>
  );
}
