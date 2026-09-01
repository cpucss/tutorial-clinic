import { useMemo, useState } from "react";
import { BookOpen, Calendar, CheckCircle2, Clock, Filter, Layers, Search, Sparkles } from "lucide-react";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { TabKey } from "../../../components/layout/Sidebar";
import type { SemesterTerm, Subject } from "../../../types/app";
import type { YearLevel } from "../../../types/common";

export function SubjectsPage({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const { state, currentUser } = useAppData();
  const studentYear = currentUser?.yearLevel ?? null;

  const [selectedYear, setSelectedYear] = useState<"All" | YearLevel>(
    studentYear ?? "All"
  );
  const [selectedSemester, setSelectedSemester] = useState<"All" | SemesterTerm>("All");
  const [selectedTrack, setSelectedTrack] = useState<string>("All");
  const [query, setQuery] = useState("");

  const activeSubjects = useMemo(() => {
    return state.subjects.filter((s) => s.active);
  }, [state.subjects]);

  const filteredSubjects = useMemo(() => {
    return activeSubjects.filter((subject) => {
      // Year level filter
      if (selectedYear !== "All" && subject.yearLevel !== selectedYear) {
        return false;
      }
      // Semester filter
      if (selectedSemester !== "All" && subject.semester !== selectedSemester) {
        return false;
      }
      // Elective track filter
      if (selectedTrack !== "All") {
        if (selectedTrack === "Core" && subject.isElective) return false;
        if (selectedTrack !== "Core" && subject.specialization !== selectedTrack) return false;
      }
      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const codeMatch = subject.code.toLowerCase().includes(q);
        const nameMatch = subject.name.toLowerCase().includes(q);
        const prereqMatch = (subject.prerequisites || []).some((p) => p.toLowerCase().includes(q));
        const specMatch = (subject.specialization || "").toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !prereqMatch && !specMatch) return false;
      }
      return true;
    });
  }, [activeSubjects, query, selectedSemester, selectedTrack, selectedYear]);

  // Group by semester when viewing a specific year or all
  const semesterGroups = useMemo(() => {
    const semesters: SemesterTerm[] = ["1st Semester", "2nd Semester", "Summer"];
    const groups: { semester: SemesterTerm; items: Subject[]; totalUnits: number }[] = [];

    for (const sem of semesters) {
      const items = filteredSubjects.filter((s) => s.semester === sem);
      if (items.length > 0) {
        const totalUnits = items.reduce((sum, s) => sum + (s.creditUnits || 0), 0);
        groups.push({ semester: sem, items, totalUnits });
      }
    }

    const unassigned = filteredSubjects.filter((s) => !s.semester);
    if (unassigned.length > 0) {
      groups.push({
        semester: "1st Semester",
        items: unassigned,
        totalUnits: unassigned.reduce((sum, s) => sum + (s.creditUnits || 0), 0),
      });
    }

    return groups;
  }, [filteredSubjects]);

  const tracks = ["All", "Core", "Software Development", "Data Science", "Cybersecurity"];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Curriculum & Academic Catalog</div>
            <h1 className="page-heading">BSCS Subjects</h1>
            <p className="page-description">
              Official BS Computer Science curriculum catalog effective AY 2024–2025. Explore tutorial subjects, credit units, and prerequisites.
            </p>
          </div>
          {studentYear && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FAF8F2] border border-[#EBE6DC] px-3.5 py-2 text-xs text-[#6F6F6F]">
              <Sparkles size={14} className="text-[#D97706]" />
              <span>
                Your current standing: <strong className="text-[#1A1A1A]">{studentYear}</strong>
              </span>
            </div>
          )}
        </header>

        {!studentYear && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>Notice:</strong> Your account does not have a verified year level assigned yet. You are browsing the complete 4-year curriculum catalog.
          </div>
        )}

        {/* Filter Controls */}
        <section className="mt-6 flex flex-col gap-3 rounded-xl bg-white p-4 demo-card">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="search-field flex-1">
              <Search size={15} />
              <span className="sr-only">Search curriculum</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject code, title, prerequisite, or track"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="compact-field">
                <span>Semester</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as "All" | SemesterTerm)}
                >
                  <option value="All">All semesters</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer Term</option>
                </select>
              </label>
              <label className="compact-field">
                <span>Specialization</span>
                <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}>
                  {tracks.map((t) => (
                    <option key={t} value={t}>
                      {t === "All" ? "All tracks" : t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0ECE1]">
            <span className="text-xs font-semibold text-[#6F6F6F] mr-1">Year Level:</span>
            {(["All", "Freshman", "Sophomore", "Junior", "Senior"] as const).map((year) => (
              <button
                key={year}
                className={`filter-chip ${selectedYear === year ? "is-active" : ""}`}
                onClick={() => setSelectedYear(year)}
              >
                {year === "All" ? "All Years" : year}
              </button>
            ))}
          </div>
        </section>

        {/* Catalog Content Grouped by Semester */}
        {semesterGroups.length > 0 ? (
          <div className="mt-6 space-y-8">
            {semesterGroups.map((group) => (
              <section key={group.semester} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-[#D97706]" />
                    <h2 className="text-base font-bold text-[#1A1A1A]">{group.semester}</h2>
                    <span className="text-xs text-[#6F6F6F]">({group.items.length} subjects)</span>
                  </div>
                  <span className="text-xs font-bold text-[#9A5D0B] bg-[#FFFBEB] px-2.5 py-1 rounded-md border border-[#FDE68A]">
                    {group.totalUnits} Total Units
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((subject) => {
                    const sessionCount = state.events.filter((e) => e.subjectId === subject.id).length;
                    const noteCount = state.notes.filter((n) => n.subjectId === subject.id && n.status === "Approved").length;

                    return (
                      <article
                        key={subject.id}
                        className="flex flex-col justify-between rounded-xl bg-white p-5 border border-[#EBE6DC] shadow-sm hover:border-[#D97706]/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#9A5D0B] bg-[#FAF5EB] px-2 py-0.5 rounded border border-[#EBE6DC]">
                              {subject.code}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {subject.yearLevel && (
                                <span className="text-[11px] font-medium text-[#6F6F6F] bg-[#F4F1EA] px-2 py-0.5 rounded">
                                  {subject.yearLevel}
                                </span>
                              )}
                              {subject.isElective && (
                                <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  {subject.specialization ? subject.specialization : "Elective"}
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="mt-2.5 text-sm font-bold text-[#1A1A1A] leading-snug">
                            {subject.name}
                          </h3>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6F6F6F] bg-[#FAF8F2] p-2.5 rounded-lg">
                            <div>
                              <span className="text-[11px] text-[#8C8C8C] block">Credit</span>
                              <strong>{subject.creditUnits || 3} Units</strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-[#8C8C8C] block">Hours</span>
                              <span>
                                {subject.lecHours || 0}h Lec / {subject.labHours || 0}h Lab
                              </span>
                            </div>
                          </div>

                          {subject.prerequisites && subject.prerequisites.length > 0 && (
                            <div className="mt-3 text-xs">
                              <span className="text-[11px] font-semibold text-[#8C8C8C] block">
                                Prerequisites:
                              </span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {subject.prerequisites.map((p) => (
                                  <span
                                    key={p}
                                    className="rounded bg-[#F4F1EA] px-1.5 py-0.5 text-[11px] text-[#4A4A4A]"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs text-[#6F6F6F]">
                          <span>
                            {sessionCount > 0 ? (
                              <strong className="text-[#D97706]">{sessionCount} clinic sessions</strong>
                            ) : (
                              "No active sessions"
                            )}
                          </span>
                          <span>{noteCount} notes</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              icon={<BookOpen size={24} className="text-[#D97706]" />}
              title="No subjects match your filters"
              body="Try changing the year level, semester, or search query."
            />
          </div>
        )}
      </div>
    </div>
  );
}
