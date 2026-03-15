"use client";

import { useActionState } from "react";
import { updateAnnouncementAction } from "@/actions/admin";

export default function AnnouncementEditor({
  texts,
  initialValues,
}: {
  texts: {
    sectionTitle: string;
    sectionTip: string;
    zhTitle: string;
    zhContent: string;
    enTitle: string;
    enContent: string;
    save: string;
    saving: string;
    saved: string;
  };
  initialValues: {
    announcementTitleZh: string;
    announcementContentZh: string;
    announcementTitleEn: string;
    announcementContentEn: string;
  };
}) {
  const [state, action, isPending] = useActionState(updateAnnouncementAction, undefined);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{texts.sectionTitle}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{texts.sectionTip}</p>
      </div>

      <form action={action} className="space-y-5">
        {state?.error && (
          <div className="rounded-xl border border-red-500/20 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
            {texts.saved}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{texts.zhTitle}</span>
            <input
              name="announcementTitleZh"
              defaultValue={initialValues.announcementTitleZh}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{texts.enTitle}</span>
            <input
              name="announcementTitleEn"
              defaultValue={initialValues.announcementTitleEn}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
          </label>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{texts.zhContent}</span>
            <textarea
              name="announcementContentZh"
              defaultValue={initialValues.announcementContentZh}
              rows={12}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{texts.enContent}</span>
            <textarea
              name="announcementContentEn"
              defaultValue={initialValues.announcementContentEn}
              rows={12}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? texts.saving : texts.save}
        </button>
      </form>
    </section>
  );
}
