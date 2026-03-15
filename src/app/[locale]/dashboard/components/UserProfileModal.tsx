"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/actions/user";

export default function UserProfileModal({
  user,
  texts,
  onClose,
}: {
  user: { displayName: string | null; showOnLeaderboard: boolean };
  texts: { title: string; displayName: string; displayNamePlaceholder: string; showOnLeaderboard: string; save: string; saving: string; saved: string; close: string };
  onClose: () => void;
}) {
  const [state, action, isPending] = useActionState(updateProfileAction, undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{texts.title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-xl">✕</button>
        </div>

        <form action={action} className="space-y-4">
          {state?.success && (
            <div className="p-3 text-sm text-emerald-200 bg-emerald-900/30 border border-emerald-500/20 rounded-xl">
              {texts.saved}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{texts.displayName}</label>
            <input
              name="displayName"
              defaultValue={user.displayName || ""}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50"
              placeholder={texts.displayNamePlaceholder}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="showOnLeaderboard"
              type="checkbox"
              defaultChecked={user.showOnLeaderboard}
              className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500/50"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{texts.showOnLeaderboard}</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {isPending ? texts.saving : texts.save}
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
