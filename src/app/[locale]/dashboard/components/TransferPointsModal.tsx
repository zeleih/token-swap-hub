"use client";

import { useActionState } from "react";
import { transferPointsAction } from "@/actions/user";

export default function TransferPointsModal({
  texts,
  onClose,
}: {
  texts: {
    title: string; toUsername: string; toUsernamePlaceholder: string;
    amount: string; amountPlaceholder: string;
    confirm: string; confirmPlaceholder: string;
    doTransfer: string; transferring: string; close: string;
  };
  onClose: () => void;
}) {
  const [state, action, isPending] = useActionState(transferPointsAction, undefined);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{texts.title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-xl">✕</button>
        </div>

        <form action={action} className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/30 border border-red-500/20 rounded-xl">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="p-3 text-sm text-emerald-200 bg-emerald-900/30 border border-emerald-500/20 rounded-xl">
              {state.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{texts.toUsername}</label>
            <input
              name="toUsername"
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50"
              placeholder={texts.toUsernamePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{texts.amount}</label>
            <input
              name="amount"
              type="number"
              min="1"
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50"
              placeholder={texts.amountPlaceholder}
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <label className="block text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">{texts.confirm}</label>
            <input
              name="confirmation"
              required
              className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-amber-500/50 font-mono"
              placeholder={texts.confirmPlaceholder}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {isPending ? texts.transferring : texts.doTransfer}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
            >
              {texts.close}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
