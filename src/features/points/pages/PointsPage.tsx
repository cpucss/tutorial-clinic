import { pointRules } from "../../../mock";

export function PointsPage() {
  return (
    <div className="flex h-full flex-col bg-white lg:flex-row">
      <div className="w-full shrink-0 px-4 py-5 lg:w-[310px]" style={{ background: "#FFFFFF" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Points</h1>
        <p className="mt-2" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
          Everything you do in Tutorial Clinic earns points. This page explains the rules in plain language.
        </p>
      </div>
      <div className="min-w-0 flex-1 bg-white overflow-y-auto">
        <div className="max-w-3xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8 lg:pl-12">
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>How points work</h1>
          <div className="mt-3 flex gap-2 flex-wrap" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
            <span>#transparency</span>
            <span>#fair-play</span>
          </div>

          <p className="mt-5" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
            Points reward two things: showing up to sessions, and sharing knowledge with younger students. The leaderboard reflects the total points you've earned across the academic year.
          </p>

          <h3 className="mt-8" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Earning points</h3>
          <ul className="mt-3 grid gap-2">
            {pointRules.map((r) => (
              <li key={r.action} className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#FAF8F2" }}>
                <span style={{ fontSize: 14, color: "#1C1C1C" }}>{r.action}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#F5A623" }}>{r.points}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Multipliers</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { t: "High-demand subject", d: "Notes for over-subscribed subjects earn a +20 bonus." },
              { t: "First contribution", d: "Your first approved upload of the term earns a +10 bonus." },
              { t: "Perfect attendance week", d: "RSVP and attend every session in a week for +30." },
              { t: "Peer-helper streak", d: "Three approved uploads in 30 days unlocks +25." },
            ].map((m) => (
              <div key={m.t} className="rounded-xl p-4" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{m.t}</div>
                <div className="mt-1" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>{m.d}</div>
              </div>
            ))}
          </div>

          <h3 className="mt-8" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Things to know</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            {[
              "Points reset every academic year",
              "Notes must be approved before points are awarded",
              "RSVP without scanning = no points",
              "Admins can adjust point values transparently",
            ].map((t) => (
              <label key={t} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#F5A623" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fff" }} />
                </span>
                <span style={{ fontSize: 14, color: "#1C1C1C" }}>{t}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
