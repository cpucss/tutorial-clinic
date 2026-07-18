import { useMemo, useState } from "react";
import { BookOpen, Eye, Search, Star, Tags } from "lucide-react";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { DemoNote } from "../../../types/app";
import { NotePreviewModal } from "../components/NotePreviewModal";

export function NotesPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, currentUser, toggleFavourite } = useAppData();
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("All");
  const [year, setYear] = useState("All");
  const [sort, setSort] = useState("Recent");
  const [preview, setPreview] = useState<DemoNote | null>(null);
  const favouriteIds = new Set(state.favouriteNoteIds[currentUser?.id ?? ""] ?? []);
  const notes = useMemo(() => state.notes.filter((note) => note.status === "Approved").filter((note) => {
    const subject = state.subjects.find((item) => item.id === note.subjectId);
    const uploader = state.users.find((item) => item.id === note.uploaderId);
    const haystack = `${note.title} ${note.description} ${note.tags.join(" ")} ${subject?.name} ${uploader?.name}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (subjectId === "All" || note.subjectId === subjectId) && (year === "All" || subject?.yearLevel === year);
  }).sort((a, b) => sort === "Popular" ? b.downloads - a.downloads : +new Date(b.updatedAt) - +new Date(a.updatedAt)), [query, sort, state.notes, state.subjects, state.users, subjectId, year]);
  function favourite(note: DemoNote) { const wasSaved = favouriteIds.has(note.id); const result = toggleFavourite(note.id); onNotify?.({ tone: result.ok ? "success" : "error", title: result.ok ? (wasSaved ? "Removed from favourites" : "Added to favourites") : "Unable to update favourites", description: result.ok ? "Your personal study list is saved on this device." : result.message }); }
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8"><div className="section-kicker">Shared resources</div><h1 className="page-heading">Notes Library</h1><p className="page-description">Browse administrator-approved study resources shared by Tutorial Clinic contributors.</p><section className="mt-6 grid gap-3 rounded-xl bg-white p-4 demo-card md:grid-cols-[1fr_180px_160px_140px]"><label className="search-field"><Search size={15} /><span className="sr-only">Search notes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, tags, or subjects" /></label><label className="compact-field"><span>Subject</span><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="All">All subjects</option>{state.subjects.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label className="compact-field"><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value)}>{["All", "Freshman", "Sophomore", "Junior", "Senior"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="compact-field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Recent</option><option>Popular</option></select></label></section>{notes.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{notes.map((note) => { const subject = state.subjects.find((item) => item.id === note.subjectId); const uploader = state.users.find((item) => item.id === note.uploaderId); const saved = favouriteIds.has(note.id); return <article key={note.id} className="note-card"><div className="flex items-start justify-between gap-3"><span className="note-card-icon"><BookOpen size={18} /></span><button className="icon-button rounded-full" aria-label={saved ? `Remove ${note.title} from favourites` : `Add ${note.title} to favourites`} onClick={() => favourite(note)}><Star size={17} fill={saved ? "#F5A623" : "none"} color={saved ? "#F5A623" : "#6F6F6F"} /></button></div><div className="mt-4"><StatusBadge status={subject?.code ?? "Subject"} /><h2>{note.title}</h2><p>{note.description}</p></div><div className="mt-4 flex flex-wrap gap-1.5">{note.tags.map((tag) => <span className="topic-chip" key={tag}><Tags size={11} />{tag}</span>)}</div><div className="note-card-footer"><span>{uploader?.name ?? "Unknown"} - {note.downloads} downloads</span><button className="secondary-button" onClick={() => setPreview(note)}><Eye size={14} /> Preview</button></div></article>; })}</div> : <div className="mt-5"><EmptyState icon={<BookOpen size={18} />} title="No approved notes found" body="Try clearing the search or selecting another subject." /></div>}</div><NotePreviewModal note={preview} onClose={() => setPreview(null)} /></div>;
}
