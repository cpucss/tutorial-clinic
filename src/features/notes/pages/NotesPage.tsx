import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Upload,
  Search,
  ChevronDown,
  Star,
  ArrowLeft,
  GitFork,
  BookOpen,
  MessageSquare,
  Send,
  ChevronRight,
} from "lucide-react";

import { notes as seedNotes, currentUser } from "../../../mock";
import { EmptyState } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import type { YearLevel } from "../../../types/common";
import type { NoteItem } from "../../../types/note";

type Mode = { kind: "explore" } | { kind: "repo"; noteId: string };
type SortKey = "trending" | "recent" | "downloaded";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recent" },
  { key: "downloaded", label: "Most downloaded" },
];

const YEARS: ("All" | YearLevel)[] = ["All", "Freshman", "Sophomore", "Junior", "Senior"];

type DiscussionPost = {
  id: string;
  noteId: string;
  author: string;
  body: string;
  createdAt: string;
};

const AVATAR_PALETTE = ["#F5A623", "#1C1C1C", "#C7D9C0", "#E8D9B8", "#6F6F6F"];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function NotesPage({
  onBreadcrumbChange,
  onNotify,
}: {
  onBreadcrumbChange?: (b: string) => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const [notes, setNotes] = useState<NoteItem[]>(seedNotes as NoteItem[]);
  const [subject, setSubject] = useState<string>("__all");
  const [subjectQ, setSubjectQ] = useState("");
  const [year, setYear] = useState<"All" | YearLevel>("All");
  const [sort, setSort] = useState<SortKey>("trending");
  const [yearOpen, setYearOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "explore" });
  const [showUpload, setShowUpload] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const approved = useMemo(() => notes.filter((n) => n.status === "Approved"), [notes]);

  useEffect(() => {
    if (!onBreadcrumbChange) return;

    const subjectLabel = subject === "__all" ? "All notes" : subject;

    if (mode.kind === "repo") {
      const note = approved.find((n) => n.id === mode.noteId);
      onBreadcrumbChange(`${subjectLabel} / ${note?.title ?? ""}`);
    } else {
      onBreadcrumbChange(subjectLabel);
    }
  }, [subject, mode, approved, onBreadcrumbChange]);

  const subjects = useMemo(() => {
    const counts = new Map<string, number>();

    approved.forEach((n) => counts.set(n.subject, (counts.get(n.subject) ?? 0) + 1));

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [approved]);

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => s.name.toLowerCase().includes(subjectQ.toLowerCase())),
    [subjects, subjectQ],
  );

  const feed = useMemo(() => {
    const base = approved.filter((n) => {
      if (subject !== "__all" && n.subject !== subject) return false;
      if (year !== "All" && n.yearLevel !== year) return false;
      return true;
    });

    const stars = (n: NoteItem) => n.stars ?? 0;

    if (sort === "recent") return [...base].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    if (sort === "downloaded") return [...base].sort((a, b) => b.downloads - a.downloads);

    return [...base].sort((a, b) => stars(b) + b.downloads * 0.3 - (stars(a) + a.downloads * 0.3));
  }, [approved, subject, year, sort]);

  const repoNote =
    mode.kind === "repo"
      ? approved.find((n) => n.id === mode.noteId) ?? feed[0]
      : undefined;

  function toggleStar(id: string) {
    setStarred((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handleUpload(form: {
    title: string;
    subject: string;
    year: YearLevel;
    description: string;
    fileName: string;
  }) {
    const newNote: NoteItem = {
      id: "n-" + Date.now(),
      title: form.title,
      subject: form.subject,
      yearLevel: form.year,
      uploader: currentUser.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
      fileType: form.fileName.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF",
      downloads: 0,
      stars: 0,
      description: form.description,
    };

    setNotes((n) => [newNote, ...n]);
    setShowUpload(false);
    onNotify?.({
      tone: "success",
      title: "Upload sent for review",
      description: "Admins will approve useful files before points are credited.",
    });
  }

  const activeSubjectName = subject === "__all" ? "All notes" : subject;

  const subjectDescription =
    subject === "__all"
      ? "Browse every approved note shared by Tutorial Clinic seniors."
      : `Shared notes for ${subject}.`;

  return (
    <div className="flex h-full">
      <SubjectBrowser
        subjects={filteredSubjects}
        totalCount={approved.length}
        active={subject}
        onSelect={(s) => {
          setSubject(s);
          setMode({ kind: "explore" });
        }}
        query={subjectQ}
        onQuery={setSubjectQ}
      />

      <div className="flex-1 bg-white overflow-y-auto">
        {showUpload ? (
          <UploadForm
            defaultSubject={subject === "__all" ? "CS101 - Programming I" : subject}
            onCancel={() => setShowUpload(false)}
            onSubmit={handleUpload}
          />
        ) : mode.kind === "repo" && repoNote ? (
          <RepoView
            note={repoNote}
            starred={starred.has(repoNote.id)}
            onToggleStar={() => toggleStar(repoNote.id)}
            onBack={() => setMode({ kind: "explore" })}
            allNotes={approved}
          />
        ) : (
          <ExploreFeed
            subjectName={activeSubjectName}
            description={subjectDescription}
            notes={feed}
            sort={sort}
            onSort={setSort}
            year={year}
            onYearChange={setYear}
            yearOpen={yearOpen}
            onYearOpenChange={setYearOpen}
            starred={starred}
            onToggleStar={toggleStar}
            onOpen={(id) => setMode({ kind: "repo", noteId: id })}
            onShareClick={() => setShowUpload(true)}
          />
        )}
      </div>
    </div>
  );
}

function SubjectBrowser({
  subjects,
  totalCount,
  active,
  onSelect,
  query,
  onQuery,
}: {
  subjects: { name: string; count: number }[];
  totalCount: number;
  active: string;
  onSelect: (s: string) => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  return (
    <div className="w-[310px] shrink-0 px-4 py-5 flex flex-col" style={{ background: "#FFFFFF" }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Subjects</h1>
      <p className="mt-2" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
        Browse notes by the course they belong to.
      </p>

      <div className="relative mt-4 mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search subjects..."
          className="w-full h-9 rounded-full bg-white pl-8 pr-3 outline-none"
          style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        />
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto">
        <SubjectRow
          label="All notes"
          sub="Every approved note"
          count={totalCount}
          active={active === "__all"}
          onClick={() => onSelect("__all")}
        />

        {subjects.map((s) => {
          const [code, ...rest] = s.name.split("-").map((p) => p.trim());
          const name = rest.join(" - ");

          return (
            <SubjectRow
              key={s.name}
              label={code}
              sub={name}
              count={s.count}
              active={active === s.name}
              onClick={() => onSelect(s.name)}
            />
          );
        })}

        {subjects.length === 0 && (
          <div className="flex items-center justify-center" style={{ height: 120, fontSize: 13, color: "#6F6F6F" }}>
            No subjects match.
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectRow({
  label,
  sub,
  count,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-between gap-2 py-2 pl-4 pr-3 rounded-md text-left"
    >
      {active && <span className="absolute left-0 inset-y-0 w-[3px] rounded-full" style={{ background: "#1C1C1C" }} />}

      <div className="min-w-0">
        <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: "#1C1C1C" }}>{label}</div>
        <div className="truncate" style={{ fontSize: 12, color: "#6F6F6F" }}>{sub}</div>
      </div>

      <span style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{count}</span>
    </button>
  );
}

function ExploreFeed({
  subjectName,
  description,
  notes,
  sort,
  onSort,
  year,
  onYearChange,
  yearOpen,
  onYearOpenChange,
  starred,
  onToggleStar,
  onOpen,
  onShareClick,
}: {
  subjectName: string;
  description: string;
  notes: NoteItem[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  year: "All" | YearLevel;
  onYearChange: (y: "All" | YearLevel) => void;
  yearOpen: boolean;
  onYearOpenChange: (v: boolean) => void;
  starred: Set<string>;
  onToggleStar: (id: string) => void;
  onOpen: (id: string) => void;
  onShareClick: () => void;
}) {
  const contributors = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const n of notes) {
      if (!seen.has(n.uploader)) {
        seen.add(n.uploader);
        out.push(n.uploader);
        if (out.length === 5) break;
      }
    }

    return out;
  }, [notes]);

  return (
    <div className="px-10 py-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div style={{ fontSize: 12, color: "#6F6F6F" }}>Notes Library</div>
          <h1 className="mt-1" style={{ fontSize: 32, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>
            {subjectName}
          </h1>
          <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {contributors.length > 0 && (
            <div className="flex -space-x-2">
              {contributors.map((name) => (
                <div
                  key={name}
                  title={name}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: avatarColor(name), color: "#fff", fontSize: 12, fontWeight: 700, border: "2px solid #fff" }}
                >
                  {name[0]}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onShareClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full"
            style={{ background: "#F5A623", color: "#fff", fontSize: 13, fontWeight: 500 }}
          >
            <Upload size={14} /> Share notes
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => onSort(s.key)}
            className="px-3 py-1 rounded-full"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: sort === s.key ? "#1C1C1C" : "#F8F8F8",
              color: sort === s.key ? "#fff" : "#1C1C1C",
            }}
          >
            {s.label}
          </button>
        ))}

        <div className="relative ml-auto">
          <button
            onClick={() => onYearOpenChange(!yearOpen)}
            className="flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ fontSize: 12, fontWeight: 500, background: "#F8F8F8", color: "#1C1C1C" }}
          >
            {year}
            <ChevronDown size={12} />
          </button>

          {yearOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl py-1.5 z-10"
              style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 140 }}
            >
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    onYearChange(y);
                    onYearOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-1.5"
                  style={{
                    fontSize: 13,
                    color: "#1C1C1C",
                    fontWeight: year === y ? 700 : 400,
                    background: year === y ? "#FAF8F2" : "transparent",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {notes.map((n) => (
          <NoteRepoCard
            key={n.id}
            note={n}
            starred={starred.has(n.id)}
            onToggleStar={() => onToggleStar(n.id)}
            onOpen={() => onOpen(n.id)}
          />
        ))}

        {notes.length === 0 && (
          <div className="col-span-2">
            <EmptyState
              icon={<Upload size={18} />}
              title="No notes match this view"
              body="Change the filters or share the first approved note for this subject."
              actionLabel="Share notes"
              onAction={onShareClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NoteRepoCard({
  note,
  starred,
  onToggleStar,
  onOpen,
}: {
  note: NoteItem;
  starred: boolean;
  onToggleStar: () => void;
  onOpen: () => void;
}) {
  const stars = (note.stars ?? 0) + (starred ? 1 : 0);

  return (
    <div className="rounded-xl p-4 flex flex-col" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="text-left min-w-0">
          <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#6F6F6F" }}>
            <BookOpen size={12} />
            <span className="truncate">{note.subject.split("-")[0].trim()}</span>
          </div>

          <div className="mt-1" style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.4 }}>
            {note.title}
          </div>
        </button>

        <button
          onClick={onToggleStar}
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: starred ? "#F5A623" : "#F8F8F8", color: starred ? "#fff" : "#1C1C1C", fontSize: 11, fontWeight: 500 }}
        >
          <Star size={12} fill={starred ? "#fff" : "transparent"} />
          {stars}
        </button>
      </div>

      <button onClick={onOpen} className="text-left flex-1">
        <p
          className="mt-2"
          style={{
            fontSize: 13,
            color: "#6F6F6F",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {note.description ?? "No description provided."}
        </p>
      </button>

      <div className="mt-3 flex items-center justify-between" style={{ fontSize: 12, color: "#6F6F6F" }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "#F5A623", display: "inline-block" }} />
            {note.fileType}
          </span>

          <span className="flex items-center gap-1">
            <Download size={12} /> {note.downloads}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: avatarColor(note.uploader), color: "#fff", fontSize: 10, fontWeight: 700 }}
          >
            {note.uploader[0]}
          </span>
          <span>{note.uploader}</span>
        </div>
      </div>
    </div>
  );
}

function RepoView({
  note,
  starred,
  onToggleStar,
  onBack,
  allNotes,
}: {
  note: NoteItem;
  starred: boolean;
  onToggleStar: () => void;
  onBack: () => void;
  allNotes: NoteItem[];
}) {
  const [tab, setTab] = useState<"notes" | "discussion">("notes");
  const [discussionText, setDiscussionText] = useState("");
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);

  const stars = (note.stars ?? 0) + (starred ? 1 : 0);
  const subjectCode = note.subject.split("-")[0].trim();

  const contributors = useMemo(() => {
    const counts = new Map<string, number>();

    allNotes
      .filter((n) => n.subject === note.subject)
      .forEach((n) => counts.set(n.uploader, (counts.get(n.uploader) ?? 0) + 1));

    if (!counts.has(note.uploader)) counts.set(note.uploader, 1);

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allNotes, note]);

  const fileSize = note.fileType === "PPTX" ? "4.2 MB" : note.fileType === "DOCX" ? "812 KB" : "1.1 MB";
  const visiblePosts = discussionPosts.filter((post) => post.noteId === note.id);

  function addDiscussionPost() {
    const body = discussionText.trim();
    if (!body) return;

    setDiscussionPosts((posts) => [
      {
        id: `${note.id}-${Date.now()}`,
        noteId: note.id,
        author: currentUser.name,
        body,
        createdAt: new Date().toISOString(),
      },
      ...posts,
    ]);

    setDiscussionText("");
  }

  return (
    <div className="px-10 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#6F6F6F" }}>
        <ArrowLeft size={14} /> Back to {note.subject}
      </button>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5" style={{ fontSize: 14, color: "#6F6F6F" }}>
            <span>{subjectCode}</span>
            <ChevronRight size={14} />
            <span style={{ color: "#1C1C1C", fontWeight: 700 }}>{note.title}</span>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
            <span>#{note.yearLevel.toLowerCase()}</span>
            <span>#{subjectCode.toLowerCase()}</span>
            <span>#approved</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleStar}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{
              background: starred ? "#F5A623" : "#fff",
              color: starred ? "#fff" : "#1C1C1C",
              fontSize: 13,
              fontWeight: 500,
              boxShadow: starred ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <Star size={14} fill={starred ? "#fff" : "transparent"} />
            {starred ? "Starred" : "Star"} - {stars}
          </button>

          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full"
            style={{ background: "#F5A623", color: "#fff", fontSize: 13, fontWeight: 500 }}
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap" style={{ fontSize: 13, color: "#6F6F6F" }}>
        <span className="flex items-center gap-1"><Star size={12} /> {stars} stars</span>
        <span>-</span>
        <span className="flex items-center gap-1"><Download size={12} /> {note.downloads} downloads</span>
        <span>-</span>
        <span className="flex items-center gap-1"><GitFork size={12} /> {contributors.length} contributors</span>
        <span>-</span>
        <span>updated {note.uploadedAt}</span>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {[
          { key: "notes" as const, label: "Notes", icon: <FileText size={14} /> },
          { key: "discussion" as const, label: "Discussion", icon: <MessageSquare size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: tab === t.key ? "#1C1C1C" : "#F8F8F8",
              color: tab === t.key ? "#fff" : "#1C1C1C",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_220px] gap-6 items-start">
        <div>
          {tab === "notes" && (
            <>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #F0EFE9" }}>
                <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#FAF8F2", fontSize: 12, color: "#6F6F6F" }}>
                  <span style={{ fontWeight: 500, color: "#1C1C1C" }}>{note.uploader}</span>
                  <span>latest upload</span>
                  <span className="ml-auto">{note.uploadedAt}</span>
                </div>

                <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#FFFFFF" }}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F5A623", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                    {note.fileType}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate" style={{ fontSize: 14, fontWeight: 500, color: "#1C1C1C" }}>
                      {note.title}.{note.fileType.toLowerCase()}
                    </div>
                    <div style={{ fontSize: 12, color: "#6F6F6F" }}>{fileSize} - {note.downloads} downloads</div>
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}>
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl p-5" style={{ background: "#FAF8F2" }}>
                <div className="flex items-center gap-2" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>
                  <BookOpen size={14} />
                  README
                </div>

                <h3 className="mt-2" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>{note.title}</h3>

                <p className="mt-2" style={{ fontSize: 14, color: "#1C1C1C", lineHeight: 1.65 }}>
                  {note.description ?? "No description provided."}
                </p>

                <p className="mt-3" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.65 }}>
                  Shared by <strong style={{ color: "#1C1C1C", fontWeight: 500 }}>{note.uploader}</strong> on {note.uploadedAt}.
                  Reviewed and approved by an admin; available to {note.yearLevel} students and above.
                </p>
              </div>
            </>
          )}

          {tab === "discussion" && (
            <div>
              <div className="rounded-xl p-4" style={{ background: "#FAF8F2" }}>
                <div className="flex items-start gap-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: avatarColor(currentUser.name), color: "#fff", fontSize: 12, fontWeight: 700 }}
                  >
                    {currentUser.name[0]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <textarea
                      value={discussionText}
                      onChange={(e) => setDiscussionText(e.target.value)}
                      className="w-full min-h-[92px] resize-none rounded-md bg-white px-3 py-2 outline-none"
                      style={{ fontSize: 14, color: "#1C1C1C", lineHeight: 1.55, border: "1px solid #F0EFE9" }}
                      placeholder="Ask a question or add context for this note."
                    />

                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={addDiscussionPost}
                        disabled={!discussionText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                        style={{
                          background: discussionText.trim() ? "#F5A623" : "#CACACA",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        <Send size={13} /> Add discussion
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {visiblePosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: avatarColor(post.author), color: "#fff", fontSize: 12, fontWeight: 700 }}
                    >
                      {post.author[0]}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C" }}>{post.author}</span>
                        <span style={{ fontSize: 12, color: "#6F6F6F" }}>
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <p className="mt-1" style={{ fontSize: 14, color: "#1C1C1C", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {post.body}
                      </p>
                    </div>
                  </div>
                ))}

                {visiblePosts.length === 0 && (
                  <div className="rounded-xl p-8 text-center" style={{ background: "#FAF8F2", fontSize: 13, color: "#6F6F6F" }}>
                    No discussion yet. Be the first to leave a note.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-xl p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#BBBBBB" }}>CONTRIBUTORS</div>

          <ul className="mt-3 flex flex-col gap-3">
            {contributors.map((c) => (
              <li key={c.name} className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: avatarColor(c.name), color: "#fff", fontSize: 12, fontWeight: 700 }}
                >
                  {c.name[0]}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 500, color: "#1C1C1C" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#6F6F6F" }}>{c.count} note{c.count === 1 ? "" : "s"}</div>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function UploadForm({
  defaultSubject,
  onCancel,
  onSubmit,
}: {
  defaultSubject: string;
  onCancel: () => void;
  onSubmit: (f: { title: string; subject: string; year: YearLevel; description: string; fileName: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState("");
  const [year, setYear] = useState<YearLevel>("Freshman");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (/\.(mp4|mov|avi|mkv|webm)$/i.test(f.name)) {
      setErr("Video files are not supported.");
      setFileName("");
      return;
    }

    setErr("");
    setFileName(f.name);
  }

  return (
    <div className="px-10 py-8 max-w-2xl">
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1C1C1C" }}>Share notes</h1>
      <p className="mt-3" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
        Submissions go into the moderation queue. Points are credited only after admin approval.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 rounded-md bg-white px-3 outline-none"
            style={{ fontSize: 14, border: "1px solid #F0EFE9" }}
            placeholder="e.g. Recursion patterns cheat sheet"
          />
        </Field>

        <Field label="Description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-10 rounded-md bg-white px-3 outline-none"
            style={{ fontSize: 14, border: "1px solid #F0EFE9" }}
            placeholder="One sentence summary of what's inside."
          />
        </Field>

        <Field label="Subject">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-10 rounded-md bg-white px-3 outline-none"
            style={{ fontSize: 14, border: "1px solid #F0EFE9" }}
          >
            <option>CS101 - Programming I</option>
            <option>CS150 - Algorithms</option>
            <option>CS220 - Databases</option>
            <option>CS301 - Operating Systems</option>
            <option>CS401 - Compilers</option>
          </select>
        </Field>

        <Field label="For year level">
          <div className="flex gap-2">
            {(["Freshman", "Sophomore", "Junior", "Senior"] as YearLevel[]).map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  background: year === y ? "#F5A623" : "#fff",
                  color: year === y ? "#fff" : "#1C1C1C",
                  border: year === y ? "none" : "1px solid #F0EFE9",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </Field>

        <Field label="File">
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt,.jpg,.png,.pptx,.ppt,.xlsx,.xls"
            onChange={handleFile}
            style={{ fontSize: 13 }}
          />
          {fileName && <div className="mt-1" style={{ fontSize: 12, color: "#6F6F6F" }}>Selected: {fileName}</div>}
          {err && <div className="mt-1" style={{ fontSize: 12, color: "#d4183d" }}>{err}</div>}
        </Field>

        <div className="flex gap-2 pt-2">
          <button
            disabled={!title || !fileName}
            onClick={() => onSubmit({ title, subject, year, description, fileName })}
            className="px-5 py-2.5 rounded-full"
            style={{ background: !title || !fileName ? "#CACACA" : "#F5A623", color: "#fff", fontSize: 13, fontWeight: 500 }}
          >
            Submit for review
          </button>

          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full"
            style={{ background: "#fff", color: "#1C1C1C", fontSize: 13, fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}
