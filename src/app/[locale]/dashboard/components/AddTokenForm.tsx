"use client";

import { useActionState, useState } from "react";
import { addTokenAction } from "@/actions/token";
import { serializeCustomModelsConfig } from "@/lib/custom-models";
import type { FormState } from "@/lib/form-state";

type CustomModelDraft = {
  id: string;
  name: string;
  inputPricePerM: string;
  outputPricePerM: string;
};

function createEmptyModel(): CustomModelDraft {
  return {
    id: "",
    name: "",
    inputPricePerM: "",
    outputPricePerM: "",
  };
}

export default function AddTokenForm({
  title,
  platformLabel,
  apiKeyLabel,
  submitText,
  validatingText,
  tokenAddedText,
  creditLimitLabel,
  creditLimitPlaceholder,
  allowedUsersLabel,
  allowedUsersPlaceholder,
  allowedUsersTip,
  customBaseUrlLabel,
  customBaseUrlPlaceholder,
  customModelsTitle,
  customModelsTip,
  customModelIdLabel,
  customModelNameLabel,
  customInputPriceLabel,
  customOutputPriceLabel,
  addModelText,
  removeModelText,
}: {
  title: string;
  platformLabel: string;
  apiKeyLabel: string;
  submitText: string;
  validatingText: string;
  tokenAddedText: string;
  creditLimitLabel: string;
  creditLimitPlaceholder: string;
  allowedUsersLabel: string;
  allowedUsersPlaceholder: string;
  allowedUsersTip: string;
  customBaseUrlLabel: string;
  customBaseUrlPlaceholder: string;
  customModelsTitle: string;
  customModelsTip: string;
  customModelIdLabel: string;
  customModelNameLabel: string;
  customInputPriceLabel: string;
  customOutputPriceLabel: string;
  addModelText: string;
  removeModelText: string;
}) {
  const [state, action, isPending] = useActionState(addTokenAction, undefined);
  const formResetKey = state?.resetToken || "initial";

  return (
    <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">{title}</h3>

      <FormBody
        key={formResetKey}
        action={action}
        state={state}
        isPending={isPending}
        platformLabel={platformLabel}
        apiKeyLabel={apiKeyLabel}
        submitText={submitText}
        validatingText={validatingText}
        tokenAddedText={tokenAddedText}
        creditLimitLabel={creditLimitLabel}
        creditLimitPlaceholder={creditLimitPlaceholder}
        allowedUsersLabel={allowedUsersLabel}
        allowedUsersPlaceholder={allowedUsersPlaceholder}
        allowedUsersTip={allowedUsersTip}
        customBaseUrlLabel={customBaseUrlLabel}
        customBaseUrlPlaceholder={customBaseUrlPlaceholder}
        customModelsTitle={customModelsTitle}
        customModelsTip={customModelsTip}
        customModelIdLabel={customModelIdLabel}
        customModelNameLabel={customModelNameLabel}
        customInputPriceLabel={customInputPriceLabel}
        customOutputPriceLabel={customOutputPriceLabel}
        addModelText={addModelText}
        removeModelText={removeModelText}
      />
    </div>
  );
}

function FormBody({
  action,
  state,
  isPending,
  platformLabel,
  apiKeyLabel,
  submitText,
  validatingText,
  tokenAddedText,
  creditLimitLabel,
  creditLimitPlaceholder,
  allowedUsersLabel,
  allowedUsersPlaceholder,
  allowedUsersTip,
  customBaseUrlLabel,
  customBaseUrlPlaceholder,
  customModelsTitle,
  customModelsTip,
  customModelIdLabel,
  customModelNameLabel,
  customInputPriceLabel,
  customOutputPriceLabel,
  addModelText,
  removeModelText,
}: {
  action: (formData: FormData) => void;
  state: FormState | undefined;
  isPending: boolean;
  platformLabel: string;
  apiKeyLabel: string;
  submitText: string;
  validatingText: string;
  tokenAddedText: string;
  creditLimitLabel: string;
  creditLimitPlaceholder: string;
  allowedUsersLabel: string;
  allowedUsersPlaceholder: string;
  allowedUsersTip: string;
  customBaseUrlLabel: string;
  customBaseUrlPlaceholder: string;
  customModelsTitle: string;
  customModelsTip: string;
  customModelIdLabel: string;
  customModelNameLabel: string;
  customInputPriceLabel: string;
  customOutputPriceLabel: string;
  addModelText: string;
  removeModelText: string;
}) {
  const [provider, setProvider] = useState<"openai" | "custom">("openai");
  const [customModels, setCustomModels] = useState<CustomModelDraft[]>([createEmptyModel()]);

  const serializedCustomModels = serializeCustomModelsConfig(
    customModels
      .map((model) => ({
        id: model.id.trim(),
        name: model.name.trim(),
        inputPricePerM: Number(model.inputPricePerM),
        outputPricePerM: Number(model.outputPricePerM),
      }))
      .filter((model) =>
        model.id &&
        model.name &&
        Number.isFinite(model.inputPricePerM) &&
        model.inputPricePerM >= 0 &&
        Number.isFinite(model.outputPricePerM) &&
        model.outputPricePerM >= 0
      )
  );

  return (
      <form action={action} className="space-y-4">
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
          <select
            name="provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value as "openai" | "custom")}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50"
          >
            <option value="openai">OpenAI (GPT)</option>
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

        {provider === "custom" && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{customBaseUrlLabel}</label>
              <input
                name="customBaseUrl"
                required
                type="url"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
                placeholder={customBaseUrlPlaceholder}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-black/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{customModelsTitle}</h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{customModelsTip}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomModels((models) => [...models, createEmptyModel()])}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  {addModelText}
                </button>
              </div>

              <input type="hidden" name="customModelsConfig" value={provider === "custom" ? serializedCustomModels : ""} />

              <div className="space-y-3">
                {customModels.map((model, index) => (
                  <div key={index} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-black/30">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{customModelIdLabel}</label>
                        <input
                          type="text"
                          value={model.id}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCustomModels((models) =>
                              models.map((current, currentIndex) => currentIndex === index ? { ...current, id: value } : current)
                            );
                          }}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/40 dark:text-white"
                          placeholder="gpt-4o-mini"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{customModelNameLabel}</label>
                        <input
                          type="text"
                          value={model.name}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCustomModels((models) =>
                              models.map((current, currentIndex) => currentIndex === index ? { ...current, name: value } : current)
                            );
                          }}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/40 dark:text-white"
                          placeholder="GPT-4o mini"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{customInputPriceLabel}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={model.inputPricePerM}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCustomModels((models) =>
                              models.map((current, currentIndex) => currentIndex === index ? { ...current, inputPricePerM: value } : current)
                            );
                          }}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/40 dark:text-white"
                          placeholder="0.15"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{customOutputPriceLabel}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={model.outputPricePerM}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCustomModels((models) =>
                              models.map((current, currentIndex) => currentIndex === index ? { ...current, outputPricePerM: value } : current)
                            );
                          }}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/40 dark:text-white"
                          placeholder="0.60"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCustomModels((models) => models.length === 1 ? [createEmptyModel()] : models.filter((_, currentIndex) => currentIndex !== index))}
                        className="text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        {removeModelText}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {provider !== "custom" && (
          <>
            <input type="hidden" name="customBaseUrl" value="" />
            <input type="hidden" name="customModelsConfig" value="" />
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{creditLimitLabel}</label>
          <div className="relative">
            <input
              name="creditLimit"
              type="number"
              min="1"
              step="1"
              className="w-full px-4 py-3 pr-16 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
              placeholder={creditLimitPlaceholder}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
              pts
            </span>
          </div>
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
  );
}
