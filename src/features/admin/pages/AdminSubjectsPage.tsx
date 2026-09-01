import { useMemo, useState } from "react";
import { Download, Layers, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog, EmptyState, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { SemesterTerm, Subject } from "../../../types/app";
import type { YearLevel } from "../../../types/common";
import { downloadCsv } from "../../../utils/format";

export function AdminSubjectsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, deleteSubject } = useAppData();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("All");
  const [semester, setSemester] = useState("All");
  const [track, setTrack] = useState("All");
  const [status, setStatus] = useState("All");
  const [editor, setEditor] = useState<Subject | "new" | null>(null);
  const [remove, setRemove] = useState<Subject | null>(null);

  const subjects = useMemo(
    () =>
      state.subjects
        .filter(
          (subject) =>
            (!query || `${subject.code} ${subject.name} ${subject.coordinator}`.toLowerCase().includes(query.toLowerCase())) &&
            (year === "All" || subject.yearLevel === year) &&
            (semester === "All" || subject.semester === semester) &&
            (track === "All" || (track === "Core" ? !subject.isElective : subject.specialization === track)) &&
            (status === "All" || (status === "Active" ? subject.active : !subject.active))
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    [query, semester, state.subjects, status, track, year]
  );

  function exportCsv() {
    downloadCsv(
      "tutorial-clinic-subjects.csv",
      subjects.map((s) => ({
        code: s.code,
        name: s.name,
        year_level: s.yearLevel ?? "None",
        semester: s.semester ?? "None",
        credit_units: s.creditUnits || 3,
        lec_hours: s.lecHours || 0,
        lab_hours: s.labHours || 0,
        prerequisites: (s.prerequisites || []).join("; "),
        is_elective: s.isElective ? "Yes" : "No",
        specialization: s.specialization || "None",
        curriculum_version: s.curriculumVersion || "2024-2025",
        active: s.active ? "Active" : "Inactive",
        sessions_count: state.events.filter((e) => e.subjectId === s.id).length,
        notes_count: state.notes.filter((n) => n.subjectId === s.id).length,
      }))
    );
    onNotify?.({
      tone: "success",
      title: "Subjects exported",
      description: `${subjects.length} subjects exported to CSV.`,
    });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Curriculum management</div>
            <h1 className="page-heading">Subjects Catalog</h1>
            <p className="page-description">
              Manage official BSCS curriculum subjects, unit weightings, prerequisites, and elective tracks.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="secondary-button" onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </button>
            <button className="primary-button" onClick={() => setEditor("new")}>
              <Plus size={15} /> Add subject
            </button>
          </div>
        </header>

        {/* Filter Controls */}
        <section className="mt-6 grid gap-3 rounded-xl bg-white p-4 demo-card md:grid-cols-[1fr_150px_150px_150px_130px]">
          <label className="search-field">
            <Search size={15} />
            <span className="sr-only">Search subjects</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, or coordinator"
            />
          </label>
          <label className="compact-field">
            <span>Year</span>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {["All", "Freshman", "Sophomore", "Junior", "Senior"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span>Semester</span>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {["All", "1st Semester", "2nd Semester", "Summer"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span>Track</span>
            <select value={track} onChange={(e) => setTrack(e.target.value)}>
              {["All", "Core", "Software Development", "Data Science", "Cybersecurity"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {["All", "Active", "Inactive"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </section>

        {/* Data Table */}
        <section className="mt-5 overflow-hidden rounded-xl bg-white demo-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Title</th>
                  <th>Year & Semester</th>
                  <th>Units & Hours</th>
                  <th>Prerequisites</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const sessions = state.events.filter((event) => event.subjectId === subject.id).length;
                  const notes = state.notes.filter((note) => note.subjectId === subject.id).length;
                  return (
                    <tr key={subject.id}>
                      <td>
                        <strong className="text-[#9A5D0B] font-mono">{subject.code}</strong>
                        {subject.isElective && (
                          <span className="block text-[11px] text-purple-700 font-medium">
                            {subject.specialization || "Elective"}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{subject.name}</strong>
                        {!subject.active && <StatusBadge status="Inactive" />}
                      </td>
                      <td>
                        <div>{subject.yearLevel ?? "Unassigned"}</div>
                        <small className="text-[#6F6F6F]">{subject.semester ?? "-"}</small>
                      </td>
                      <td>
                        <div>{subject.creditUnits || 3} Units</div>
                        <small className="text-[#6F6F6F]">
                          {subject.lecHours || 0}h Lec / {subject.labHours || 0}h Lab
                        </small>
                      </td>
                      <td>
                        {subject.prerequisites && subject.prerequisites.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {subject.prerequisites.map((p) => (
                              <span key={p} className="bg-[#F4F1EA] text-[11px] px-1.5 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#8C8C8C] text-xs">None</span>
                        )}
                      </td>
                      <td>
                        {sessions} sessions
                        <small className="block text-[#6F6F6F]">{notes} notes</small>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => setEditor(subject)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="danger-text" onClick={() => setRemove(subject)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!subjects.length && (
            <div className="p-5">
              <EmptyState title="No subjects found" body="Change the filters or add a subject." />
            </div>
          )}
        </section>
      </div>

      {editor && (
        <SubjectEditor
          subject={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onNotify={onNotify}
        />
      )}

      <ConfirmDialog
        open={Boolean(remove)}
        title="Delete this subject?"
        body={`${remove?.code ?? "This subject"} can only be deleted when no clinic session or study note references it.`}
        confirmLabel="Delete subject"
        cancelLabel="Keep subject"
        tone="error"
        onCancel={() => setRemove(null)}
        onConfirm={async () => {
          if (remove) {
            const result = await deleteSubject(remove.id);
            onNotify?.({
              tone: result.ok ? "warning" : "error",
              title: result.ok ? "Subject deleted" : "Subject cannot be deleted",
              description: result.ok
                ? `${remove.code} was removed.`
                : result.message,
            });
          }
          setRemove(null);
        }}
      />
    </div>
  );
}

function SubjectEditor({
  subject,
  onClose,
  onNotify,
}: {
  subject?: Subject;
  onClose: () => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { saveSubject } = useAppData();
  const [code, setCode] = useState(subject?.code ?? "");
  const [name, setName] = useState(subject?.name ?? "");
  const [yearLevel, setYearLevel] = useState<YearLevel | "None">(subject?.yearLevel ?? "Freshman");
  const [semester, setSemester] = useState<SemesterTerm | "None">(subject?.semester ?? "1st Semester");
  const [creditUnits, setCreditUnits] = useState<number>(subject?.creditUnits ?? 3);
  const [lecHours, setLecHours] = useState<number>(subject?.lecHours ?? 2);
  const [labHours, setLabHours] = useState<number>(subject?.labHours ?? 3);
  const [prereqText, setPrereqText] = useState<string>((subject?.prerequisites || []).join(", "));
  const [isElective, setIsElective] = useState<boolean>(subject?.isElective ?? false);
  const [specialization, setSpecialization] = useState<string>(subject?.specialization ?? "");
  const [coordinator, setCoordinator] = useState(subject?.coordinator ?? "TBD");
  const [active, setActive] = useState(subject?.active ?? true);
  const [error, setError] = useState("");

  async function submit() {
    if (!code.trim() || !name.trim()) {
      setError("Subject code and name are required.");
      return;
    }

    const prerequisites = prereqText
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const result = await saveSubject({
      ...subject,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      yearLevel: yearLevel === "None" ? null : yearLevel,
      semester: semester === "None" ? null : semester,
      creditUnits: Number(creditUnits),
      lecHours: Number(lecHours),
      labHours: Number(labHours),
      prerequisites,
      isElective,
      specialization: isElective ? specialization.trim() || null : null,
      coordinator: coordinator.trim() || "TBD",
      active,
    });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    onNotify?.({
      tone: "success",
      title: subject ? "Subject updated" : "Subject added",
      description: `${code.toUpperCase()} is available throughout the application.`,
    });
    onClose();
  }

  return (
    <div className="confirm-overlay" onMouseDown={onClose}>
      <div
        className="entity-detail-dialog !max-w-2xl"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <div className="section-kicker">{subject ? "Edit subject" : "New subject"}</div>
            <h2>{subject?.code ?? "Add curriculum subject"}</h2>
          </div>
          <button className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        {error && <InlineNotice tone="error" title="Subject not saved">{error}</InlineNotice>}

        <div className="entity-form-grid mt-5">
          <label className="form-field">
            <span>Subject code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CCS 1001" />
          </label>
          <label className="form-field">
            <span>Year level</span>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value as YearLevel | "None")}
            >
              <option value="None">None (Unassigned)</option>
              {["Freshman", "Sophomore", "Junior", "Senior"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="form-field md:col-span-2">
            <span>Subject name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Official descriptive title" />
          </label>

          <label className="form-field">
            <span>Semester</span>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as SemesterTerm | "None")}
            >
              <option value="None">None</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer Term</option>
            </select>
          </label>
          <label className="form-field">
            <span>Credit Units</span>
            <input
              type="number"
              min="0"
              max="12"
              value={creditUnits}
              onChange={(e) => setCreditUnits(Number(e.target.value))}
            />
          </label>

          <label className="form-field">
            <span>Lecture Hours / Week</span>
            <input
              type="number"
              min="0"
              max="10"
              value={lecHours}
              onChange={(e) => setLecHours(Number(e.target.value))}
            />
          </label>
          <label className="form-field">
            <span>Lab Hours / Week</span>
            <input
              type="number"
              min="0"
              max="10"
              value={labHours}
              onChange={(e) => setLabHours(Number(e.target.value))}
            />
          </label>

          <label className="form-field md:col-span-2">
            <span>Prerequisites (comma separated codes)</span>
            <input
              value={prereqText}
              onChange={(e) => setPrereqText(e.target.value)}
              placeholder="e.g. CCS 1001, CCS 1400"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap gap-4 items-center bg-[#FAF8F2] p-3 rounded-lg border border-[#EBE6DC]">
            <label className="check-chip">
              <input
                type="checkbox"
                checked={isElective}
                onChange={(e) => setIsElective(e.target.checked)}
              />
              Professional Elective
            </label>

            {isElective && (
              <label className="compact-field flex-1">
                <span>Specialization Track</span>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="">General Elective</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </label>
            )}

            <label className="check-chip">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active in catalog
            </label>
          </div>
        </div>

        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={submit}>
            Save subject
          </button>
        </footer>
      </div>
    </div>
  );
}
