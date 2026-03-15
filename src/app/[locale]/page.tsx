import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Home() {
  const t = useTranslations("Index");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black dark:bg-zinc-950 font-sans">
      {/* Background Gradients & Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/20 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-purple-500/20 blur-[120px]"></div>

      {/* Main Glassmorphism Card */}
      <main className="z-10 flex w-full max-w-2xl flex-col items-center text-center p-12 backdrop-blur-xl bg-white/5 dark:bg-black/40 border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl transition-all hover:bg-white/10 dark:hover:bg-white/5">
        
        {/* Language Switcher Mockup */}
        <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" locale="zh" className="hover:text-white transition-colors">中文</Link>
          <span>/</span>
          <Link href="/" locale="en" className="hover:text-white transition-colors">En</Link>
        </div>

        <div className="mb-8 p-4 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
          <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 drop-shadow-sm">
          {t("title")}
        </h1>
        
        <p className="max-w-md text-lg text-zinc-400 mb-10 leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center px-8 py-3.5 text-sm font-medium text-black bg-white rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center px-8 py-3.5 text-sm font-medium text-white border border-white/20 rounded-full hover:bg-white/10 transition-all backdrop-blur-md"
          >
            {t("register")}
          </Link>
        </div>

      </main>
    </div>
  );
}
