"use client";

import { useState, useTransition } from "react";
import { deleteTokenAction, toggleTokenAction } from "@/actions/token";
import HelpHint from "./HelpHint";

type TokenItem = {
  id: string;
  key: string;
  provider: string;
  providerLabel: string;
  status: string;
  totalUsedTokens: number;
  usedCredits: number;
  creditLimit: number | null;
  customProviderName: string | null;
  customBaseUrl: string | null;
  customModelsConfig: string | null;
  allowedUsers: string | null;
};

const PAGE_SIZE = 6;

function formatMillions(value: number) {
  return `${(value / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} M`;
}

function formatCredits(value: number) {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} pts`;
}

function getCustomModelCount(config: string | null) {
  if (!config) return 0;
  try {
    const parsed = JSON.parse(config);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function TokenList({
  tokens,
  noTokensText,
  contributedText,
  revokeText,
  confirmRevokeText,
  pauseText,
  resumeText,
  creditLimitText,
  unlimitedText,
  directedBadge,
  providerFilterLabel,
  statusFilterLabel,
  allProvidersText,
  allStatusesText,
  prevPageText,
  nextPageText,
  pageLabelText,
  modelsText,
  helpTexts,
}: {
  tokens: TokenItem[];
  noTokensText: string;
  contributedText: string;
  revokeText: string;
  confirmRevokeText: string;
  pauseText: string;
  resumeText: string;
  creditLimitText: string;
  unlimitedText: string;
  directedBadge: string;
  providerFilterLabel: string;
  statusFilterLabel: string;
  allProvidersText: string;
  allStatusesText: string;
  prevPageText: string;
  nextPageText: string;
  pageLabelText: string;
  modelsText: string;
  helpTexts: {
    providerFilter: string;
    statusFilter: string;
    contributed: string;
    creditLimit: string;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const providers = Array.from(new Set(tokens.map((token) => token.providerLabel))).sort((a, b) =>
    a.localeCompare(b)
  );

  const filteredTokens = tokens.filter((token) => {
    const providerMatched = providerFilter === "all" || token.providerLabel === providerFilter;
    const statusMatched = statusFilter === "all" || token.status === statusFilter;
    return providerMatched && statusMatched;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTokens.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTokens = filteredTokens.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = (id: string) => {
    if (window.confirm(confirmRevokeText)) {
      startTransition(async () => {
        await deleteTokenAction(id);
      });
    }
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleTokenAction(id);
    });
  };

  if (tokens.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{noTokensText}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[180px] flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span>{providerFilterLabel}</span>
            <HelpHint text={helpTexts.providerFilter} />
          </span>
          <select
            value={providerFilter}
            onChange={(event) => {
              setProviderFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
          >
            <option value="all">{allProvidersText}</option>
            {providers.map((providerLabel) => (
              <option key={providerLabel} value={providerLabel}>
                {providerLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[180px] flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span>{statusFilterLabel}</span>
            <HelpHint text={helpTexts.statusFilter} />
          </span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
          >
            <option value="all">{allStatusesText}</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="FROZEN">FROZEN</option>
          </select>
        </label>
      </div>

      {filteredTokens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          {noTokensText}
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {paginatedTokens.map((token) => {
              const isActive = token.status === "ACTIVE";
              const isPaused = token.status === "PAUSED";
              const limit = token.creditLimit;
              const usedTokens = token.totalUsedTokens;
              const usedCredits = token.usedCredits;
              const customModelCount = getCustomModelCount(token.customModelsConfig);

              return (
                <li key={token.id} className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isActive
                    ? "border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-black/20"
                    : isPaused
                      ? "border-amber-200 bg-amber-50/50 opacity-80 dark:border-amber-500/20 dark:bg-amber-900/5"
                      : "border-red-200 bg-red-50/50 opacity-70 dark:border-red-500/20 dark:bg-red-900/5"
                }`}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {token.providerLabel}
                        </span>
                        {token.provider !== "openai" && token.provider === "custom" && (
                          <span className="rounded bg-zinc-200/70 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                            Custom
                          </span>
                        )}
                        {token.allowedUsers && (
                          <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                            [{directedBadge}]
                          </span>
                        )}
                      </div>
                      <p className="mt-2 w-36 truncate font-mono text-sm text-zinc-800 dark:text-zinc-200">
                        ...{token.key.slice(-6)}
                      </p>
                      {token.provider === "custom" && (
                        <p className="mt-1 max-w-[14rem] truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {token.customBaseUrl} · {customModelCount} {modelsText}
                        </p>
                      )}
                    </div>

                    <span className={`rounded-full px-2 py-1 text-xs ${
                      isActive ? "bg-emerald-500/10 text-emerald-600"
                      : isPaused ? "bg-amber-500/10 text-amber-600"
                      : "bg-red-500/10 text-red-600"
                    }`}>
                      {token.status}
                    </span>
                  </div>

                  <div className="mb-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <span>{contributedText}</span>
                        <HelpHint text={helpTexts.contributed} />
                      </span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {formatMillions(usedTokens || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <span>{creditLimitText}</span>
                        <HelpHint text={helpTexts.creditLimit} />
                      </span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {limit !== null
                          ? `${formatCredits(usedCredits)} / ${formatCredits(limit)}`
                          : unlimitedText}
                      </span>
                    </div>
                    {limit !== null && (
                      <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-white/10">
                        <div
                          className={`h-1.5 rounded-full transition-all ${usedCredits >= limit ? "bg-red-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(100, (usedCredits / limit) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-white/5">
                    <button
                      type="button"
                      disabled={isPending || (!isActive && !isPaused)}
                      onClick={() => handleToggle(token.id)}
                      className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        isActive
                          ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      }`}
                    >
                      {isActive ? pauseText : resumeText}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(token.id)}
                      className="text-xs font-medium text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      {revokeText}
                    </button>
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
              {prevPageText}
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {pageLabelText.replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {nextPageText}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
