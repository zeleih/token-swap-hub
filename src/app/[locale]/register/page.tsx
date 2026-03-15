"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const [state, action, isPending] = useActionState(registerAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black dark:bg-zinc-950 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
      
      <div className="z-10 w-full max-w-sm p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">{t("registerTitle")}</h2>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">{t("back")}</Link>
        </div>

        <form action={action} className="space-y-6">
          {state?.error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/30 border border-red-500/20 rounded-xl">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("inviteCode")}</label>
            <input
              name="inviteCode"
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-zinc-600"
              placeholder={t("invitePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("email")}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-zinc-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("password")}</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-zinc-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            {isPending ? t("loading_register") : t("submit")}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-white hover:underline decoration-white/30 underline-offset-4">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
