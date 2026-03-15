"use client";

import { useState, useEffect } from "react";
import { getLeaderboardData } from "@/actions/user";

type BoardEntry = { username: string; displayName: string | null; total: number };
type TabType = "contribution" | "consumption";
type RangeType = "day" | "week" | "month" | "year" | "all";

export default function LeaderboardModal({
  texts,
  onClose,
}: {
  texts: {
    title: string; contributionBoard: string; consumptionBoard: string; rank: string;
    user: string; tokens_count: string; noData: string;
    day: string; week: string; month: string; year: string; all: string; close: string;
  };
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabType>("contribution");
  const [range, setRange] = useState<RangeType>("all");
  const [data, setData] = useState<{ contributionBoard: BoardEntry[]; consumptionBoard: BoardEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboardData(range).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [range]);

  const ranges: { key: RangeType; label: string }[] = [
    { key: "day", label: texts.day },
    { key: "week", label: texts.week },
    { key: "month", label: texts.month },
    { key: "year", label: texts.year },
    { key: "all", label: texts.all },
  ];

  const board = tab === "contribution" ? data?.contributionBoard : data?.consumptionBoard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{texts.title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-xl">✕</button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("contribution")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "contribution" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent"}`}
          >
            {texts.contributionBoard}
          </button>
          <button
            onClick={() => setTab("consumption")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "consumption" ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent"}`}
          >
            {texts.consumptionBoard}
          </button>
        </div>

        {/* Range */}
        <div className="flex gap-1 mb-4 bg-zinc-100 dark:bg-black/30 rounded-lg p-1">
          {ranges.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${range === r.key ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-zinc-400 text-sm">Loading...</div>
        ) : !board || board.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">{texts.noData}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10">
                <th className="text-left py-2 text-zinc-500 font-medium w-12">{texts.rank}</th>
                <th className="text-left py-2 text-zinc-500 font-medium">{texts.user}</th>
                <th className="text-right py-2 text-zinc-500 font-medium">{texts.tokens_count}</th>
              </tr>
            </thead>
            <tbody>
              {board.map((entry, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-white/5">
                  <td className="py-3 text-zinc-900 dark:text-white font-semibold">
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </td>
                  <td className="py-3 text-zinc-700 dark:text-zinc-300">
                    {entry.displayName || entry.username}
                  </td>
                  <td className="py-3 text-right font-mono text-zinc-900 dark:text-white">
                    {entry.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
