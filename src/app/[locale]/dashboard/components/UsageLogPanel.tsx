"use client";

import { useState } from "react";

type UsageLogType = "usage" | "provided" | "directedUsage" | "directedProvided";
type UsageLogFilter = "all" | UsageLogType;

type UsageLogItem = {
  id: string;
  type: UsageLogType;
  description: string;
  status: string;
  createdAtLabel: string;
};

type UsageLogTexts = {
  noLogs: string;
  noLogsForFilter: string;
  all: string;
  usage: string;
  provided: string;
  directedUsage: string;
  directedProvided: string;
  prevPage: string;
  nextPage: string;
  pageLabel: string;
};

const PAGE_SIZE = 6;

const badgeStyles: Record<UsageLogType, { badgeClass: string; dotClass: string }> = {
  usage: {
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  provided: {
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  directedUsage: {
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    dotClass: "bg-sky-500",
  },
  directedProvided: {
    badgeClass: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20",
    dotClass: "bg-fuchsia-500",
  },
};

export default function UsageLogPanel({
  logs,
  texts,
}: {
  logs: UsageLogItem[];
  texts: UsageLogTexts;
}) {
  const [activeFilter, setActiveFilter] = useState<UsageLogFilter>("all");
  const [page, setPage] = useState(1);

  const filterOptions: Array<{ value: UsageLogFilter; label: string; type?: UsageLogType }> = [
    { value: "all", label: texts.all },
    { value: "usage", label: texts.usage, type: "usage" },
    { value: "provided", label: texts.provided, type: "provided" },
    { value: "directedUsage", label: texts.directedUsage, type: "directedUsage" },
    { value: "directedProvided", label: texts.directedProvided, type: "directedProvided" },
  ];

  const filteredLogs = activeFilter === "all"
    ? logs
    : logs.filter((log) => log.type === activeFilter);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (logs.length === 0) {
    return <p className="text-sm text-zinc-500">{texts.noLogs}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const count = option.value === "all"
            ? logs.length
            : logs.filter((log) => log.type === option.value).length;
          const isActive = activeFilter === option.value;
          const style = option.type ? badgeStyles[option.type] : null;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setActiveFilter(option.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? style
                    ? style.badgeClass
                    : "border border-zinc-400/30 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {style && <span className={`h-2 w-2 rounded-full ${style.dotClass}`}></span>}
              <span>{option.label}</span>
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[11px] dark:bg-white/10">{count}</span>
            </button>
          );
        })}
      </div>

      {filteredLogs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          {texts.noLogsForFilter}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 dark:divide-white/10">
            {paginatedLogs.map((log) => {
              const style = badgeStyles[log.type];

              return (
                <li key={log.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dotClass}`}></span>
                      <span className="text-zinc-700 dark:text-zinc-200">{log.description}</span>
                    </div>
                    <p className="mt-1 pl-[18px] text-xs text-zinc-500 dark:text-zinc-400">{log.createdAtLabel}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${style.badgeClass}`}>
                      {filterOptions.find((option) => option.value === log.type)?.label}
                    </span>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-white/10">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {texts.prevPage}
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {texts.pageLabel.replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {texts.nextPage}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
