import { getTranslations } from "next-intl/server";

export default async function ToolsPage() {
  const t = await getTranslations("Dashboard");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🔧</span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("toolsTitle")}</h1>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">{t("toolsSubtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coming soon cards */}
          {[
            { icon: "📊", title: "额度管理 / Quota Manager" },
            { icon: "🔗", title: "多平台监控 / Multi-Platform" },
            { icon: "📈", title: "消费分析 / Analytics" },
            { icon: "⚙️", title: "更多功能 / More..." },
          ].map((item, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 text-center opacity-50"
            >
              <span className="text-2xl block mb-2">{item.icon}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
