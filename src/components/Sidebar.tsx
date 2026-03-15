"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";

type MenuItem = {
  icon: string;
  label: string;
  href: string;
};

export default function Sidebar({ items, collapsed: initialCollapsed }: { items: MenuItem[]; collapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed ?? false);
  const pathname = usePathname();

  return (
    <aside className={`sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
      <div className="flex flex-col h-full py-4">
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mb-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all"
        >
          {collapsed ? "»" : "«"}
        </button>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 px-2">
          {items.map((item) => {
            const isActive = pathname.endsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
