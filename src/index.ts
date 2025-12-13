import type { ESLint, Linter } from "eslint";
import type { Except } from "type-fest";

import { name, version } from "../package.json" with { type: "json" };
import { RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS } from "./constants";
import requireResolveForDynamicExternalCSS from "./rules/require-resolve-for-dynamic-external-css";
import { compat } from "./utils";

const rules = {
  [RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS]: compat(requireResolveForDynamicExternalCSS),
} as const;

type Plugin = Except<ESLint.Plugin, "configs"> & {
  configs: {
    recommended: Linter.Config | Linter.Config[];
    strict: Linter.Config | Linter.Config[];
  };
};

const plugin: Plugin = {
  // @ts-expect-error shareable configs will be set later
  configs: {},
  meta: {
    name,
    version,
  },
  name,
  rules,
  version,
};

const baseConfig = {
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
} as const satisfies Linter.Config;

Object.assign(plugin.configs, {
  recommended: {
    ...baseConfig,
    plugins: {
      "styled-jsx": plugin,
    },
    rules: {
      [`styled-jsx/${RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS}`]: "error",
    },
  },
  strict: {
    ...baseConfig,
    plugins: {
      "styled-jsx": plugin,
    },
    rules: {
      [`styled-jsx/${RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS}`]: "error",
    },
  },
} satisfies Plugin["configs"]);

export default plugin;
