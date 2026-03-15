const PROVIDERS: Record<string, { baseUrl: string; prefix?: string }> = {
  openai: { baseUrl: "https://api.openai.com/v1", prefix: "sk-" },
  custom: { baseUrl: "" },
};

export const AVAILABLE_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI (GPT)" },
  { value: "custom", label: "自定义 / Custom" },
];

export function getProviderBaseUrl(provider: string, customBaseUrl?: string | null): string {
  if (provider === "custom") {
    return (customBaseUrl || "").trim().replace(/\/+$/, "");
  }

  return PROVIDERS[provider]?.baseUrl || "";
}
