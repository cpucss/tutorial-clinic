import { useState } from "react";
import { Eye, Search, Star } from "lucide-react";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { DemoNote } from "../../../types/app";
import { NotePreviewModal } from "../components/NotePreviewModal";

export function FavouritesPage() {
  const { state, currentUser, toggleFavourite } = useAppData();
  const [query, setQuery] = useState(""); const [preview, setPreview] = useState<DemoNote | null>(null);
  const ids = new Set(state.favouriteNoteIds[currentUser?.id ?? ""] ?? []); const notes = state.notes.filter((note) => ids.has(note.id) && note.status === "Approved" && (!query || `${note.title} ${note.description}`.toLowerCase().includes(query.toLowerCase())));
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8"><div className="section-kicker">Personal study list</div><h1 className="page-heading">Favourites</h1><p className="page-description">Only notes you personally save from the library appear here.</p><label className="search-field mt-6 max-w-xl"><Search size={15} /><span className="sr-only">Search favourite notes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search favourites" /></label>{notes.length ? <div className="mt-5 grid gap-3">{notes.map((note) => { const subject = state.subjects.find((item) => item.id === note.subjectId); return <article key={note.id} className="history-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{note.title}</h2><StatusBadge status={subject?.code ?? "Subject"} /></div><p className="mt-1 text-sm text-[#6F6F6F]">{note.description}</p></div><div className="flex gap-2"><button className="secondary-button" onClick={() => setPreview(note)}><Eye size={14} /> Preview</button><button className="secondary-button" onClick={() => toggleFavourite(note.id)}><Star size={14} fill="#F5A623" color="#F5A623" /> Remove</button></div></article>; })}</div> : <div className="mt-5"><EmptyState icon={<Star size={18} />} title="No favourite notes found" body={query ? "Try another search." : "Save approved notes from the Notes Library for quick access."} /></div>}</div><NotePreviewModal note={preview} onClose={() => setPreview(null)} /></div>;
}
