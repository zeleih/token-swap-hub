// 支持的平台配置

const PROVIDERS: Record<string, { baseUrl: string; prefix?: string }> = {
  openai: { baseUrl: "https://api.openai.com/v1", prefix: "sk-" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", prefix: "sk-" },
  zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  moonshot: { baseUrl: "https://api.moonshot.cn/v1", prefix: "sk-" },
  qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", prefix: "sk-" },
  claude: { baseUrl: "https://api.anthropic.com/v1" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", prefix: "gsk_" },
  mistral: { baseUrl: "https://api.mistral.ai/v1" },
  custom: { baseUrl: "" },
};

export function getProviderBaseUrl(provider: string): string {
  return PROVIDERS[provider]?.baseUrl || "https://api.openai.com/v1";
}
