export type CustomModelConfig = {
  id: string;
  name: string;
  inputPricePerM: number;
  outputPricePerM: number;
};

export function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function parseCustomModelsConfig(value: string | null | undefined): CustomModelConfig[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        id: typeof item?.id === "string" ? item.id.trim() : "",
        name: typeof item?.name === "string" ? item.name.trim() : "",
        inputPricePerM: Number(item?.inputPricePerM),
        outputPricePerM: Number(item?.outputPricePerM),
      }))
      .filter((item) =>
        item.id &&
        item.name &&
        Number.isFinite(item.inputPricePerM) &&
        item.inputPricePerM >= 0 &&
        Number.isFinite(item.outputPricePerM) &&
        item.outputPricePerM >= 0
      );
  } catch {
    return [];
  }
}

export function serializeCustomModelsConfig(models: CustomModelConfig[]) {
  return JSON.stringify(models);
}

export function findCustomModelConfig(models: CustomModelConfig[], modelId: string | null | undefined) {
  const normalizedModelId = (modelId || "").trim().toLowerCase();

  return models.find((model) => {
    const currentId = model.id.toLowerCase();
    return currentId === normalizedModelId || normalizedModelId.startsWith(currentId);
  }) || null;
}
