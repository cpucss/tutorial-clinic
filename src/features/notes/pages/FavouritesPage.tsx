import { Download, Star } from "lucide-react";
import { notes } from "../../../mock";
import { EmptyState } from "../../../components/common/Feedback";

export function FavouritesPage() {
  const favourites = notes
    .filter((note) => note.status === "Approved")
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, 3);

  return (
    <div className="flex h-full flex-col bg-white lg:flex-row">
      <div className="w-full shrink-0 px-4 py-6 lg:w-[310px]" style={{ background: "#FFFFFF" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Favourites</h1>
        <p className="mt-2" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
          Notes you want to keep close for quick review.
        </p>
      </div>

      <div className="min-w-0 flex-1 bg-white overflow-y-auto">
        <div className="max-w-3xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8 lg:pl-12">
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>Saved notes</h1>
          <div className="mt-3" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
            #quick-access #study-list
          </div>

          {favourites.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<Star size={18} />}
                title="No saved notes yet"
                body="Star notes from the library and they will appear here for quick review."
              />
            </div>
          ) : (
            <ul className="mt-6 grid gap-2">
              {favourites.map((note) => (
                <li key={note.id} className="rounded-xl p-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center" style={{ background: "#FAF8F2" }}>
                  <div className="min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{note.title}</div>
                    <div className="mt-0.5" style={{ fontSize: 12, color: "#6F6F6F" }}>
                      {note.subject} - {note.yearLevel}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0" style={{ fontSize: 12, color: "#6F6F6F" }}>
                    <span className="flex items-center gap-1">
                      <Star size={13} color="#F5A623" fill="#F5A623" strokeWidth={1.75} />
                      {note.stars ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download size={13} color="#6F6F6F" strokeWidth={1.75} />
                      {note.downloads}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
