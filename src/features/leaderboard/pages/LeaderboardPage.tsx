import { useMemo } from "react";
import { Trophy, Crown } from "lucide-react";
import { leaderboard, currentUser } from "../../../mock";
import type { YearLevel } from "../../../types/common";

const FILTERS: ("All" | YearLevel)[] = ["All", "Freshman", "Sophomore", "Junior", "Senior"];

export function LeaderboardPage({
  filter,
  onFilterChange,
}: {
  filter: "All" | YearLevel;
  onFilterChange: (f: "All" | YearLevel) => void;
}) {
  const setFilter = onFilterChange;

  const ranked = useMemo(() => {
    const list = leaderboard
      .filter((l) => filter === "All" || l.yearLevel === filter)
      .sort((a, b) => b.points - a.points);

    return list.map((l, i) => ({ ...l, rank: i + 1 }));
  }, [filter]);

  const me = ranked.find((r) => r.id === "u5" || r.name === currentUser.name);

  const podium = [ranked[1], ranked[0], ranked[2]].filter(
    (r): r is (typeof ranked)[number] => Boolean(r),
  );

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full shrink-0 px-4 py-5 lg:w-[310px]" style={{ background: "#FFFFFF" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Leaderboard</h1>
        <p className="mt-2" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
          Friendly competition across the program. Earn points by attending sessions and sharing approved notes.
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5 lg:flex-col">
          {FILTERS.map((y) => (
            <button
              key={y}
              onClick={() => setFilter(y)}
              className="relative py-2 pl-4 pr-3 rounded-md text-left"
              style={{
                fontSize: 14,
                fontWeight: filter === y ? 700 : 500,
                color: "#1C1C1C",
              }}
            >
              {filter === y && (
                <span className="absolute left-0 inset-y-0 w-[3px] rounded-full" style={{ background: "#1C1C1C" }} />
              )}
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 bg-white overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>
                Top Participants
              </h1>
              <div className="mt-2" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
                #{filter.toLowerCase()} #all-time
              </div>
            </div>
            <Trophy size={28} color="#F5A623" strokeWidth={1.75} />
          </div>

          <div className="mt-10 grid grid-cols-1 items-end gap-8 pt-10 sm:grid-cols-3 sm:gap-4">
            {podium.map((r) => {
              const isFirst = r.rank === 1;
              const avatarSize = isFirst ? 104 : 80;

              return (
                <div
                  key={r.id}
                  className="flex flex-col items-center"
                  style={{ marginTop: isFirst ? -36 : 0 }}
                >
                  <div className="relative">
                    {isFirst && (
                      <Crown
                        size={32}
                        color="#F5A623"
                        fill="#F5A623"
                        strokeWidth={1.5}
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{ top: -40 }}
                      />
                    )}
                    <div
                      className="rounded-full flex items-center justify-center overflow-hidden"
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        background: "#FAF8F2",
                        color: "#1C1C1C",
                        fontSize: isFirst ? 34 : 26,
                        fontWeight: 700,
                        border: "3px solid #F5A623",
                      }}
                    >
                      {r.name[0]}
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center"
                      style={{
                        bottom: -12,
                        width: 26,
                        height: 26,
                        background: "#F5A623",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        border: "3px solid #fff",
                      }}
                    >
                      {r.rank}
                    </div>
                  </div>
                  <div className="mt-5 text-center">
                    <div style={{ fontSize: isFirst ? 16 : 14, fontWeight: 700, color: "#1C1C1C" }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#6F6F6F" }}>{r.yearLevel}</div>
                    <div className="mt-1" style={{ fontSize: isFirst ? 20 : 16, fontWeight: 700, color: "#F5A623" }}>
                      {r.points} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="mt-8" style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Full ranking</h3>
          <ul className="mt-3 divide-y" style={{ borderColor: "#F0EFE9" }}>
            {ranked.map((r) => {
              const isMe = r.name === currentUser.name;

              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 px-3 rounded-xl" style={{ background: isMe ? "#3A3A3A" : "transparent", border: "none", outline: "none", boxShadow: "none" }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-7 text-center" style={{ fontSize: 13, fontWeight: 700, color: isMe ? "#FFFFFF" : r.rank <= 3 ? "#F5A623" : "#6F6F6F" }}>
                      {r.rank}
                    </span>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isMe ? "#FFFFFF" : "#FAF8F2", color: "#1C1C1C", fontSize: 13, fontWeight: 700 }}>
                      {r.name[0]}
                    </span>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? "#FFFFFF" : "#1C1C1C" }}>
                        {r.name} {isMe && <span style={{ color: "#F5A623", fontWeight: 500 }}>- you</span>}
                      </div>
                      <div style={{ fontSize: 12, color: isMe ? "rgba(255,255,255,0.68)" : "#6F6F6F" }}>{r.yearLevel}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isMe ? "#FFFFFF" : "#1C1C1C" }}>{r.points} pts</div>
                </li>
              );
            })}
          </ul>

          {me && (
            <div className="sticky bottom-4 mt-6 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "#F5A623" }}>
              <div style={{ fontSize: 13, color: "#fff" }}>
                You're ranked <span style={{ fontWeight: 700 }}>#{me.rank}</span> in {filter === "All" ? "the program" : filter + "s"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{me.points} pts</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
