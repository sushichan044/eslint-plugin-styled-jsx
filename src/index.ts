import type { ESLint, Linter } from "eslint";
import type { Except } from "type-fest";

import { name, version } from "../package.json" with { type: "json" };
import {
  RULE_NO_STYLED_JSX,
  RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS,
  RULE_VALIDATE_STYLED_JSX_BABEL,
} from "./constants";
import noStyledJSX from "./rules/no-styled-jsx";
import requireResolveForDynamicExternalCSS from "./rules/require-resolve-for-dynamic-external-css";
import validateStyledJsxBabel from "./rules/validate-styled-jsx-babel";
import { compat } from "./utils";

const rules = {
  [RULE_NO_STYLED_JSX]: compat(noStyledJSX),
  [RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS]: compat(requireResolveForDynamicExternalCSS),
  [RULE_VALIDATE_STYLED_JSX_BABEL]: compat(validateStyledJsxBabel),
} as const;

type Plugin = Except<ESLint.Plugin, "configs"> & {
  configs: {
    prohibit: Linter.Config | Linter.Config[];
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
  prohibit: {
    ...baseConfig,
    plugins: {
      "styled-jsx": plugin,
    },
    rules: {
      [`styled-jsx/${RULE_NO_STYLED_JSX}`]: "error",
    },
  },
  recommended: {
    ...baseConfig,
    plugins: {
      "styled-jsx": plugin,
    },
    rules: {
      [`styled-jsx/${RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS}`]: "error",
      [`styled-jsx/${RULE_VALIDATE_STYLED_JSX_BABEL}`]: "error",
    },
  },
  strict: {
    ...baseConfig,
    plugins: {
      "styled-jsx": plugin,
    },
    rules: {
      [`styled-jsx/${RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS}`]: "error",
      [`styled-jsx/${RULE_VALIDATE_STYLED_JSX_BABEL}`]: "error",
    },
  },
} satisfies Plugin["configs"]);

export default plugin;
