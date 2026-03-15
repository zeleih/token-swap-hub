"use client";

import { useState } from "react";

type UsageLogType = "usage" | "provided" | "directedUsage" | "directedProvided";
type UsageLogFilter = "all" | UsageLogType;

type UsageLogItem = {
  id: string;
  type: UsageLogType;
  provider: string;
  model: string;
  inputTokens: string;
  outputTokens: string;
  totalTokens: string;
  unitPrice: string;
  costUsd: string;
  creditDelta: string;
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
  providerFilterLabel: string;
  allProvidersText: string;
  timeHeader: string;
  typeHeader: string;
  providerHeader: string;
  modelHeader: string;
  tokensHeader: string;
  priceHeader: string;
  costHeader: string;
  pointsHeader: string;
  statusHeader: string;
};

const PAGE_SIZE = 10;

const badgeStyles: Record<UsageLogType, string> = {
  usage: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  provided: "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  directedUsage: "border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  directedProvided: "border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
};

export default function UsageLogPanel({
  logs,
  texts,
}: {
  logs: UsageLogItem[];
  texts: UsageLogTexts;
}) {
  const [activeFilter, setActiveFilter] = useState<UsageLogFilter>("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filterOptions: Array<{ value: UsageLogFilter; label: string }> = [
    { value: "all", label: texts.all },
    { value: "usage", label: texts.usage },
    { value: "provided", label: texts.provided },
    { value: "directedUsage", label: texts.directedUsage },
    { value: "directedProvided", label: texts.directedProvided },
  ];

  const providers = Array.from(new Set(logs.map((log) => log.provider))).sort();

  const filteredLogs = logs.filter((log) => {
    const typeMatched = activeFilter === "all" || log.type === activeFilter;
    const providerMatched = providerFilter === "all" || log.provider === providerFilter;
    return typeMatched && providerMatched;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (logs.length === 0) {
    return <p className="text-sm text-zinc-500">{texts.noLogs}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const count = option.value === "all"
              ? logs.length
              : logs.filter((log) => log.type === option.value).length;
            const isActive = activeFilter === option.value;

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
                    ? option.value === "all"
                      ? "border border-zinc-400/30 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : badgeStyles[option.value]
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                }`}
              >
                <span>{option.label}</span>
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[11px] dark:bg-white/10">{count}</span>
              </button>
            );
          })}
        </div>

        <label className="ml-auto flex min-w-[180px] flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{texts.providerFilterLabel}</span>
          <select
            value={providerFilter}
            onChange={(event) => {
              setProviderFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
          >
            <option value="all">{texts.allProvidersText}</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          {texts.noLogsForFilter}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <div className="hidden min-w-[980px] grid-cols-[88px_96px_84px_minmax(0,1.2fr)_148px_168px_92px_96px_78px] gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 md:grid">
              <span>{texts.timeHeader}</span>
              <span>{texts.typeHeader}</span>
              <span>{texts.providerHeader}</span>
              <span>{texts.modelHeader}</span>
              <span>{texts.tokensHeader}</span>
              <span>{texts.priceHeader}</span>
              <span>{texts.costHeader}</span>
              <span>{texts.pointsHeader}</span>
              <span>{texts.statusHeader}</span>
            </div>

            <ul className="divide-y divide-zinc-200 dark:divide-white/10">
              {paginatedLogs.map((log) => (
                <li key={log.id} className="px-3 py-2.5">
                  <div className="grid gap-2 md:min-w-[980px] md:grid-cols-[88px_96px_84px_minmax(0,1.2fr)_148px_168px_92px_96px_78px] md:items-center">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.timeHeader}</p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-200">{log.createdAtLabel}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.typeHeader}</p>
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium ${badgeStyles[log.type]}`}>
                        {filterOptions.find((option) => option.value === log.type)?.label}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.providerHeader}</p>
                      <span className="inline-flex whitespace-nowrap rounded bg-blue-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        {log.provider}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.modelHeader}</p>
                      <p className="truncate text-xs text-zinc-700 dark:text-zinc-200">{log.model}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.tokensHeader}</p>
                      <p className="whitespace-nowrap text-xs text-zinc-700 dark:text-zinc-200">
                        I {log.inputTokens} / O {log.outputTokens} / T {log.totalTokens}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.priceHeader}</p>
                      <p className="truncate whitespace-nowrap text-xs text-zinc-700 dark:text-zinc-200">{log.unitPrice}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.costHeader}</p>
                      <p className="whitespace-nowrap text-xs text-zinc-700 dark:text-zinc-200">{log.costUsd}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.pointsHeader}</p>
                      <p className={`whitespace-nowrap text-xs font-medium ${
                        log.creditDelta.startsWith("-")
                          ? "text-red-500"
                          : log.creditDelta.startsWith("+")
                            ? "text-emerald-500"
                            : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        {log.creditDelta}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 md:hidden">{texts.statusHeader}</p>
                      <span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

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
