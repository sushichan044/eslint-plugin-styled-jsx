import type { TSESTree } from "@typescript-eslint/utils";
import type { AnyRuleModule } from "@typescript-eslint/utils/ts-eslint";
import type { Rule } from "eslint";

import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://github.com/sushichan044/eslint-plugin-styled-jsx/blob/main/rules/${ruleName}.ts`,
);

export function compat(rule: AnyRuleModule): Rule.RuleModule {
  return rule as unknown as Rule.RuleModule;
}

/**
 * Extract import declarations for a specific module from the given program.
 *
 * @example
 * ```ts
 * const imports = extractModuleImports(program, "styled-jsx/css");
 * ```
 */
export function extractModuleImports(
  program: Readonly<TSESTree.Program>,
  moduleRequest: Readonly<string>,
): TSESTree.ImportDeclaration[] {
  const imports: TSESTree.ImportDeclaration[] = [];

  for (const topStmt of program.body) {
    if (
      topStmt.type === AST_NODE_TYPES.ImportDeclaration &&
      topStmt.source.value === moduleRequest
    ) {
      imports.push(topStmt);
    }
  }

  return imports;
}
