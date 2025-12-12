// @ts-check

import ts from "@virtual-live-lab/eslint-config/presets/ts";
import eslintPlugin from "eslint-plugin-eslint-plugin";
import importAccess from "eslint-plugin-import-access/flat-config";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  ts,
  globalIgnores(["playground/**"]),
  {
    extends: [eslintPlugin.configs.recommended],
    files: ["src/rules/**/*.ts"],
    name: "@repo/eslint-config/eslint-plugin-eslint-plugin",
  },
  {
    name: "@repo/eslint-config/import-access/plugin",
    plugins: {
      // @ts-expect-error type mismatch between ESLint and typescript-eslint
      "import-access": importAccess,
    },
  },
  {
    files: ["**/*.ts"],
    name: "@repo/eslint-config/import-access/rules",
    rules: {
      "import-access/jsdoc": "error",
    },
  },
);
