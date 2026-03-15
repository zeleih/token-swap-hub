import { CircleHelp } from "lucide-react";

export default function HelpHint({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      <span
        tabIndex={0}
        role="button"
        aria-label={text}
        title={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-zinc-400 outline-none transition-colors hover:text-zinc-600 focus-visible:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-200 dark:focus-visible:text-zinc-200"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[11px] font-normal normal-case leading-5 tracking-normal text-zinc-600 shadow-xl group-hover:block group-focus-within:block dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
        {text}
      </span>
    </span>
  );
}
