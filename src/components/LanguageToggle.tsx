"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.startsWith("/en") ? "en" : "zh";
  const targetLocale = currentLocale === "zh" ? "en" : "zh";

  const handleSwitch = () => {
    const newPath = pathname.replace(/^\/(zh|en)/, `/${targetLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={handleSwitch}
      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-xs font-bold text-zinc-600 dark:text-zinc-300"
      title={currentLocale === "zh" ? "Switch to English" : "切换为中文"}
    >
      {currentLocale === "zh" ? "EN" : "中"}
    </button>
  );
}
