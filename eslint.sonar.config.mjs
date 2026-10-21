import sonarjs from "eslint-plugin-sonarjs";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "lib/generated/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docs/**",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  {
    ...sonarjs.configs.recommended,
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
  },
];
