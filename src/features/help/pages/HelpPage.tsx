import { useState } from "react";
import { BookOpen, LifeBuoy, Mail, QrCode, Search, ShieldCheck } from "lucide-react";

const articles = [
  { title: "How do I RSVP to a session?", category: "Sessions", body: "Open Events, choose a session, and select RSVP to session. Full or completed sessions cannot accept new reservations." },
  { title: "How does attendance check-in work?", category: "Attendance", body: "Open Attendance during a clinic. Scan the facilitator QR code or enter the attendance code. An administrator must approve the record before points are awarded." },
  { title: "QR scanning guide", category: "Attendance", body: "Allow camera access when prompted, point the camera at the facilitator QR code, and keep the code centered. Manual code entry is always available as a fallback." },
  { title: "How do I submit study notes?", category: "Notes", body: "Open My Notes, add the title, subject, description, tags, and a supported local file. Submit it for administrator review." },
  { title: "What happens when a note is rejected?", category: "Notes", body: "The rejection reason appears in My Notes. Edit the metadata or file, then resubmit the note for review." },
  { title: "Why is account setup required?", category: "Account", body: "The backup email and password stay only in this browser until the school account service is connected. They do not provide server-verified security." },
];
export function HelpPage() {
  const [query, setQuery] = useState("");
  const items = articles.filter((item) => !query || `${item.title} ${item.body} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8"><div className="section-kicker">Guides and assistance</div><h1 className="page-heading">Help & Support</h1><p className="page-description">Quick answers for the most important Tutorial Clinic workflows.</p><label className="search-field mt-6 max-w-xl"><Search size={15} /><span className="sr-only">Search help articles</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help articles" /></label><div className="mt-5 grid gap-3 md:grid-cols-2">{items.map((item) => <article key={item.title} className="help-card"><span>{icon(item.category)}</span><div><div className="section-kicker">{item.category}</div><h2>{item.title}</h2><p>{item.body}</p></div></article>)}</div><section className="mt-6 rounded-xl bg-[#1C1C1C] p-5 text-white"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Need more help?</h2><p className="mt-1 text-sm text-white/70">Contact support will be enabled once the school support process is connected.</p></div><button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1C1C1C]" disabled><Mail size={15} className="mr-2 inline" />support@tutorialclinic.edu</button></div></section></div></div>;
}
function icon(category: string) { if (category === "Attendance") return <QrCode />; if (category === "Notes") return <BookOpen />; if (category === "Account") return <ShieldCheck />; return <LifeBuoy />; }
