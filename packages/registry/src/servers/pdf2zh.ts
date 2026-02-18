import type { RegistryEntryType } from "@getmcp/core";

export const pdf2zh: RegistryEntryType = {
  id: "pdf2zh",
  name: "PDF Math Translate",
  description:
    "Translate PDF scientific papers while preserving formatting, formulas, and layout. Supports multiple translation services and languages",
  config: {
    command: "uvx",
    args: ["pdf2zh", "--mcp"],
    env: {},
    transport: "stdio",
  },
  package: "pdf2zh",
  runtime: "python",
  repository: "https://github.com/PDFMathTranslate/PDFMathTranslate",
  homepage: "https://github.com/PDFMathTranslate/PDFMathTranslate",
  author: "PDFMathTranslate",
  categories: ["documentation", "utilities"],
  requiredEnvVars: [],
};
