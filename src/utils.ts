import type { AnyRuleModule } from "@typescript-eslint/utils/ts-eslint";
import type { Rule } from "eslint";

import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://github.com/sushichan044/eslint-plugin-styled-jsx/blob/main/rules/${ruleName}.ts`,
);

/** typescript-eslint の提供するルールの型と ESLint 本体のルールの型を合わせる */
export function compat(rule: AnyRuleModule): Rule.RuleModule {
  return rule as unknown as Rule.RuleModule;
}
