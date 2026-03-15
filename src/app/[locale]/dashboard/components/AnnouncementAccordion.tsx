import type { AnnouncementDisplayItem } from "@/lib/announcement";

export default function AnnouncementAccordion({
  announcements,
  emptyText,
  publishedAtLabel,
  dateFormatter,
}: {
  announcements: AnnouncementDisplayItem[];
  emptyText: string;
  publishedAtLabel: string;
  dateFormatter: Intl.DateTimeFormat;
}) {
  if (announcements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement, index) => (
        <details
          key={announcement.id}
          open={index === 0}
          className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-colors open:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:open:border-blue-500/40"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-white">
                {announcement.title}
              </h2>
              {announcement.publishedAt && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {publishedAtLabel}: {dateFormatter.format(announcement.publishedAt)}
                </p>
              )}
            </div>
            <span className="text-sm text-zinc-400 transition-transform group-open:rotate-180">⌄</span>
          </summary>

          <div className="border-t border-zinc-100 px-5 py-5 dark:border-white/10">
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {announcement.content}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
