import { Link } from "@/i18n/routing";

export default function AnnouncementPanel({
  title,
  content,
  label,
  editLabel,
  showEditLink,
}: {
  title: string;
  content: string;
  label: string;
  editLabel: string;
  showEditLink: boolean;
}) {
  return (
    <section className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm dark:border-blue-500/20 dark:from-blue-950/20 dark:via-zinc-950 dark:to-emerald-950/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📢</span>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{label}</h2>
        </div>
        {showEditLink && (
          <Link
            href="/dashboard/admin"
            className="rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
          >
            {editLabel}
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
        <h3 className="mb-2 text-base font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
        <p className="whitespace-pre-line text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {content}
        </p>
      </div>
    </section>
  );
}
