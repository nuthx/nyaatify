import { parserConfig } from "@/lib/core/parser/config";

// Import the dynamic module
export async function dynamicImport(type) {
  const currentConfig = parserConfig.find(c => c.type === type);
  const parserModule = await import(`@/lib/core/parser/${currentConfig.parser}`);
  return { currentConfig, parserModule };
}
