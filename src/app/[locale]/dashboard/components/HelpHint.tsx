"use client";

import { CircleHelp } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_MARGIN = 12;
const TOOLTIP_GAP = 10;

export default function HelpHint({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: -9999, left: -9999, opacity: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const left = Math.min(
        Math.max(triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2, VIEWPORT_MARGIN),
        window.innerWidth - tooltipRect.width - VIEWPORT_MARGIN,
      );
      const top = Math.max(VIEWPORT_MARGIN, triggerRect.top - tooltipRect.height - TOOLTIP_GAP);

      setPosition({ top, left, opacity: 1 });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <>
      <span
        className={`inline-flex ${className}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <span
          ref={triggerRef}
          tabIndex={0}
          role="button"
          aria-label={text}
          className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-zinc-400 outline-none transition-colors hover:text-zinc-600 focus-visible:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-200 dark:focus-visible:text-zinc-200"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </span>
      </span>

      {typeof window !== "undefined" && isOpen
        ? createPortal(
            <span
              ref={tooltipRef}
              className="pointer-events-none fixed z-[9999] w-64 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[11px] font-normal normal-case leading-5 tracking-normal text-zinc-600 shadow-2xl transition-opacity duration-75 ease-out dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                opacity: position.opacity,
              }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
