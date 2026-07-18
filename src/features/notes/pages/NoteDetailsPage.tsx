import { BookOpen, Download, FileText, Star } from "lucide-react";

import { notes } from "../../../mock";
import type { NoteItem } from "../../../types/note";

export function NoteDetailsPage({ noteId = "n1" }: { noteId?: string }) {
  const note = notes.find((item) => item.id === noteId) ?? notes[0];

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="px-10 py-8 max-w-4xl">
        <div style={{ fontSize: 12, color: "#6F6F6F" }}>Notes Library / Details</div>
        <div className="mt-2 flex items-start justify-between gap-6">
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>{note.title}</h1>
            <div className="mt-3 flex gap-2 flex-wrap" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
              <span>#{note.yearLevel.toLowerCase()}</span>
              <span>#{note.subject.split(" ")[0].toLowerCase()}</span>
              <span>#{note.status.toLowerCase()}</span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
            <Download size={14} /> Download
          </button>
        </div>

        <section className="mt-6 grid grid-cols-[1fr_240px] gap-5 items-start">
          <main>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #F0EFE9" }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#FAF8F2", fontSize: 12, color: "#6F6F6F" }}>
                <span style={{ fontWeight: 500, color: "#1C1C1C" }}>{note.uploader}</span>
                <span>latest upload</span>
                <span className="ml-auto">{note.uploadedAt}</span>
              </div>
              <div className="px-4 py-4 flex items-center gap-3" style={{ background: "#FFFFFF" }}>
                <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 11, fontWeight: 700 }}>
                  {note.fileType}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>
                    {note.title}.{note.fileType.toLowerCase()}
                  </div>
                  <div style={{ fontSize: 12, color: "#6F6F6F" }}>{note.downloads} downloads</div>
                </div>
              </div>
            </div>

            <article className="mt-5 rounded-xl p-5" style={{ background: "#FAF8F2" }}>
              <div className="flex items-center gap-2" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>
                <BookOpen size={14} />
                README
              </div>
              <h2 className="mt-2" style={{ fontSize: 22, fontWeight: 700, color: "#1C1C1C" }}>{note.title}</h2>
              <p className="mt-2" style={{ fontSize: 14, color: "#1C1C1C", lineHeight: 1.65 }}>
                {note.description ?? "No description provided."}
              </p>
              <p className="mt-3" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.65 }}>
                This material is filed under {note.subject} and is intended for {note.yearLevel} students.
              </p>
            </article>
          </main>

          <aside className="rounded-xl p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Meta note={note} />
          </aside>
        </section>
      </div>
    </div>
  );
}

function Meta({ note }: { note: NoteItem }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#BBBBBB" }}>FILE INFO</div>
      <div className="mt-3 grid gap-3">
        <Row icon={<FileText size={14} />} label="Type" value={note.fileType} />
        <Row icon={<Download size={14} />} label="Downloads" value={note.downloads} />
        <Row icon={<Star size={14} />} label="Stars" value={note.stars ?? 0} />
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "#F5A623" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#6F6F6F" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C" }}>{value}</div>
      </div>
    </div>
  );
}
