import { CircleHelp } from "lucide-react";

export default function HelpHint({
  text,
  className = "",
  side = "top",
}: {
  text: string;
  className?: string;
  side?: "top" | "bottom";
}) {
  const bubbleClassName =
    side === "bottom"
      ? "absolute top-full left-1/2 z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[11px] font-normal normal-case leading-5 tracking-normal text-zinc-600 opacity-0 shadow-xl transition-all duration-75 ease-out group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:translate-y-1 group-focus-within:opacity-100 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
      : "absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[11px] font-normal normal-case leading-5 tracking-normal text-zinc-600 opacity-0 shadow-xl transition-all duration-75 ease-out group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300";

  return (
    <span className={`group relative inline-flex ${className}`}>
      <span
        tabIndex={0}
        role="button"
        aria-label={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-zinc-400 outline-none transition-colors hover:text-zinc-600 focus-visible:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-200 dark:focus-visible:text-zinc-200"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </span>
      <span className={`pointer-events-none ${bubbleClassName}`}>
        {text}
      </span>
    </span>
  );
}
