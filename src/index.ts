import type { ESLint, Linter } from "eslint";
import type { Except } from "type-fest";

import { name, version } from "../package.json" with { type: "json" };
import { RULE_NO_DYNAMIC_EXTERNAL_STYLE_EXCEPT_RESOLVE_TAG } from "./constants";
import noDynamicExternalStyleExceptResolveTag from "./rules/no-dynamic-external-style-except-resolve-tag";
import { compat } from "./utils";

const rules = {
  [RULE_NO_DYNAMIC_EXTERNAL_STYLE_EXCEPT_RESOLVE_TAG]: compat(
    noDynamicExternalStyleExceptResolveTag,
  ),
} as const;

type Plugin = Except<ESLint.Plugin, "configs"> & {
  configs: {
    recommended: Linter.Config | Linter.Config[];
  };
};

// @ts-expect-error recommended config will be assigned later
const plugin: Plugin = {
  meta: {
    name,
    version,
  },
  name,
  rules,
  version,
};

Object.assign(plugin, {
  configs: {
    recommended: {
      plugins: {
        "styled-jsx": plugin,
      },
      rules: {
        [`styled-jsx/${RULE_NO_DYNAMIC_EXTERNAL_STYLE_EXCEPT_RESOLVE_TAG}`]: "error",
      },
    },
  },
} satisfies Plugin);

export default plugin;
