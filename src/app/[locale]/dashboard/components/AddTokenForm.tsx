"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTokenAction } from "@/actions/token";

export default function AddTokenForm({
  title,
  platformLabel,
  apiKeyLabel,
  submitText,
  validatingText,
  tokenAddedText,
  usageLimitLabel,
  usageLimitPlaceholder,
  allowedUsersLabel,
  allowedUsersPlaceholder,
  allowedUsersTip,
  oauthTab,
  manualTab,
  oauthComingSoon,
}: {
  title: string;
  platformLabel: string;
  apiKeyLabel: string;
  submitText: string;
  validatingText: string;
  tokenAddedText: string;
  usageLimitLabel: string;
  usageLimitPlaceholder: string;
  allowedUsersLabel: string;
  allowedUsersPlaceholder: string;
  allowedUsersTip: string;
  oauthTab: string;
  manualTab: string;
  oauthComingSoon: string;
}) {
  const [state, action, isPending] = useActionState(addTokenAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [tab, setTab] = useState<"manual" | "oauth">("manual");

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">{title}</h3>
      
      {/* Tab switch */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "manual" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent"}`}
        >
          {manualTab}
        </button>
        <button
          onClick={() => setTab("oauth")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "oauth" ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent"}`}
        >
          {oauthTab}
        </button>
      </div>

      {tab === "oauth" ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔐</div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{oauthComingSoon}</p>
        </div>
      ) : (
        <form action={action} ref={formRef} className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/30 border border-red-500/20 rounded-xl">
              {state.error}
            </div>
          )}
          
          {state?.success && (
            <div className="p-3 text-sm text-emerald-200 bg-emerald-900/30 border border-emerald-500/20 rounded-xl">
              {tokenAddedText}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{platformLabel}</label>
            <select name="provider" className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50">
              <option value="openai">OpenAI (GPT)</option>
              <option value="deepseek">DeepSeek (深度求索)</option>
              <option value="zhipu">智谱 GLM</option>
              <option value="moonshot">Moonshot (月之暗面)</option>
              <option value="qwen">通义千问 Qwen</option>
              <option value="claude">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
              <option value="grok">xAI Grok</option>
              <option value="mistral">Mistral AI</option>
              <option value="custom">自定义 / Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{apiKeyLabel}</label>
            <input
              name="key"
              required
              type="password"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{usageLimitLabel}</label>
            <input
              name="usageLimit"
              type="number"
              min="1"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
              placeholder={usageLimitPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{allowedUsersLabel}</label>
            <input
              name="allowedUsers"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
              placeholder={allowedUsersPlaceholder}
            />
            <p className="text-xs text-amber-500 mt-1">{allowedUsersTip}</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {isPending ? validatingText : submitText}
          </button>
        </form>
      )}
    </div>
  );
}
