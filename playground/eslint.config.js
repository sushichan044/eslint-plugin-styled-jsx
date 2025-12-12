// @ts-check

import react from "@virtual-live-lab/eslint-config/presets/react";
import importAccess from "eslint-plugin-import-access/flat-config";
import styledJsx from "eslint-plugin-styled-jsx";
import { defineConfig } from "eslint/config";

export default defineConfig(
  react,
  {
    extends: [styledJsx.configs.recommended],
    name: "@repo/eslint-config/styled-jsx/plugin",
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
