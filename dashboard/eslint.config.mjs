import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const reactHooksPlugin = nextVitals[0].plugins["react-hooks"];
const reactPlugin = nextVitals[0].plugins["react"];
const tsPlugin = nextTs[0].plugins["@typescript-eslint"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
      react: reactPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Existing dashboard code still has broad typing debt. Keep it visible
      // without blocking production deploy gates while TypeScript build stays green.
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
