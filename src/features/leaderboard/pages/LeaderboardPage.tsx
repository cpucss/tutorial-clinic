import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Crown, RefreshCw, Search, Trophy } from "lucide-react";
import { EmptyState } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { YearLevel } from "../../../types/common";
import { relativeTime } from "../../../utils/format";

export function LeaderboardPage() {
  const {
    currentUser,
    leaderboardYearLevel,
    leaderboardItems,
    leaderboardLoading,
    leaderboardError,
    loadLeaderboard,
    refreshLeaderboard,
    leaderboardUpdatedAt,
  } = useAppData();

  const [query, setQuery] = useState("");
  const accountUserId = currentUser?.authUserId ?? currentUser?.id;

  useEffect(() => {
    void loadLeaderboard(leaderboardYearLevel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return leaderboardItems.filter((item) => {
      if (!query.trim()) return true;
      return item.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [leaderboardItems, query]);

  const podium = [filtered[1], filtered[0], filtered[2]].filter(Boolean);
  const me = filtered.find((item) => item.id === accountUserId);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Contribution standings</div>
            <h1 className="page-heading">Leaderboard</h1>
            <p className="page-description">
              Verified ranking calculated authoritatively from confirmed tutorial attendance, note reviews, and awarded points.
            </p>
          </div>
          {leaderboardUpdatedAt && (
            <div className="flex items-center gap-2 text-xs text-[#6F6F6F]">
              <span>Updated {relativeTime(leaderboardUpdatedAt)}</span>
              <button
                className="secondary-button !py-1 !px-2 text-xs"
                onClick={() => void refreshLeaderboard()}
                disabled={leaderboardLoading}
                aria-label="Refresh standings"
              >
                <RefreshCw size={12} className={leaderboardLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          )}
        </header>

        <section className="mt-6 flex flex-col gap-3 rounded-xl bg-white p-4 demo-card sm:flex-row">
          <label className="search-field flex-1">
            <Search size={15} />
            <span className="sr-only">Search leaderboard</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["All", "Freshman", "Sophomore", "Junior", "Senior"] as const).map((item) => (
              <button
                key={item}
                className={`filter-chip ${leaderboardYearLevel === item ? "is-active" : ""}`}
                onClick={() => void loadLeaderboard(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {leaderboardError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center demo-card">
            <AlertCircle className="mx-auto text-red-500" size={28} />
            <h2 className="mt-2 text-base font-bold text-red-900">Could not load standings</h2>
            <p className="mt-1 text-sm text-red-700">{leaderboardError}</p>
            <button
              className="primary-button mt-4 mx-auto"
              onClick={() => void refreshLeaderboard()}
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : leaderboardLoading && leaderboardItems.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
            <p className="mt-3 text-sm text-[#6F6F6F]">Loading official standings...</p>
          </div>
        ) : filtered.length ? (
          <>
            <section className="leader-podium">
              {podium.map((item) => (
                <article className={item.rank === 1 ? "is-first" : ""} key={item.id}>
                  {item.rank === 1 && <Crown className="crown" />}
                  <div className="podium-avatar">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span className="podium-rank">{item.rank}</span>
                  <h2>{item.name}</h2>
                  <p>{item.yearLevel}</p>
                  <strong>{item.points} pts</strong>
                </article>
              ))}
            </section>

            <section className="mt-8 rounded-xl bg-white p-5 demo-card">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Full ranking</h2>
                <Trophy size={20} color="#F5A623" />
              </div>
              <ul className="mt-4">
                {filtered.map((item) => (
                  <li
                    className={`leader-row ${item.id === accountUserId ? "is-me" : ""}`}
                    key={item.id}
                  >
                    <span>{item.rank}</span>
                    <div className="leader-initials">{item.name[0]}</div>
                    <div className="flex-1">
                      <strong>
                        {item.name}
                        {item.id === accountUserId && " - you"}
                      </strong>
                      <small>{item.yearLevel}</small>
                    </div>
                    <strong>{item.points} pts</strong>
                  </li>
                ))}
              </ul>
            </section>

            {me && (
              <div className="sticky-summary">
                You are ranked <strong>#{me.rank}</strong> in{" "}
                {leaderboardYearLevel === "All" ? "the program" : leaderboardYearLevel} with{" "}
                <strong>{me.points} points</strong>.
              </div>
            )}
          </>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="No students found"
              body="Try another year level or search term."
            />
          </div>
        )}
      </div>
    </div>
  );
}
