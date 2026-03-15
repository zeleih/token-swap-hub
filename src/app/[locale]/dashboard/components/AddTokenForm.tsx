"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTokenAction } from "@/actions/token";

export default function AddTokenForm({
  title,
  platformLabel,
  apiKeyLabel,
  submitText,
  validatingText,
  tokenAddedText,
}: {
  title: string;
  platformLabel: string;
  apiKeyLabel: string;
  submitText: string;
  validatingText: string;
  tokenAddedText: string;
}) {
  const [state, action, isPending] = useActionState(addTokenAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">{title}</h3>
      
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
             <option value="openai">OpenAI (api.openai.com)</option>
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {isPending ? validatingText : submitText}
        </button>
      </form>
    </div>
  );
}
