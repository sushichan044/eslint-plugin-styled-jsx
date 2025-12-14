import type { Scope, ScopeManager, Variable } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext, SourceCode } from "@typescript-eslint/utils/ts-eslint";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { walk } from "zimmerframe";

import type { StyledJSXModule } from "../styled-jsx";

import { tryTransformWithBabel } from "../babel";
import { RULE_VALIDATE_STYLED_JSX_BABEL } from "../constants";
import { prepareStyledJSXModule } from "../styled-jsx";
import { createRule, extractModuleImports } from "../utils";

type Options = [];
type MessageIds = "babelCompilationError";

function collectReferencedIdentifiers(node: TSESTree.TaggedTemplateExpression): Set<string> {
  const identifiers = new Set<string>();

  for (const expr of node.quasi.expressions) {
    walk(expr as TSESTree.Node, null, {
      Identifier(node) {
        identifiers.add(node.name);
      },
    });
  }

  return identifiers;
}

function findVariableInScope(name: string, scope: Scope | null | undefined): Variable | undefined {
  if (scope === null || scope === undefined) return undefined;

  const variable = scope.set.get(name);
  if (variable !== undefined) return variable;

  if (scope.upper === null) return undefined;
  return findVariableInScope(name, scope.upper);
}

function getScopeFromManager(scopeManager: ScopeManager | null, node: TSESTree.Node): Scope | null {
  if (scopeManager === null) return null;
  const acquired = scopeManager.acquire(node, true);
  if (acquired) return acquired;
  return scopeManager.globalScope ?? null;
}

function isStatementLike(node: TSESTree.Node): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.BlockStatement:
    case AST_NODE_TYPES.BreakStatement:
    case AST_NODE_TYPES.ContinueStatement:
    case AST_NODE_TYPES.DebuggerStatement:
    case AST_NODE_TYPES.DoWhileStatement:
    case AST_NODE_TYPES.EmptyStatement:
    case AST_NODE_TYPES.ExportAllDeclaration:
    case AST_NODE_TYPES.ExportDefaultDeclaration:
    case AST_NODE_TYPES.ExportNamedDeclaration:
    case AST_NODE_TYPES.ExpressionStatement:
    case AST_NODE_TYPES.ForInStatement:
    case AST_NODE_TYPES.ForOfStatement:
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.FunctionDeclaration:
    case AST_NODE_TYPES.IfStatement:
    case AST_NODE_TYPES.ImportDeclaration:
    case AST_NODE_TYPES.LabeledStatement:
    case AST_NODE_TYPES.ReturnStatement:
    case AST_NODE_TYPES.SwitchStatement:
    case AST_NODE_TYPES.ThrowStatement:
    case AST_NODE_TYPES.TryStatement:
    case AST_NODE_TYPES.VariableDeclaration:
    case AST_NODE_TYPES.WhileStatement:
    case AST_NODE_TYPES.WithStatement:
      return true;
    default:
      return node.type.endsWith("Statement");
  }
}

function getEnclosingStatement(node: TSESTree.Node): TSESTree.Node {
  let current: TSESTree.Node | null = node;

  while (current !== null && current.type !== AST_NODE_TYPES.Program) {
    if (isStatementLike(current)) {
      return current;
    }
    current = current.parent ?? null;
  }

  return node;
}

function collectVariableDeclarations(
  identifiers: Set<string>,
  node: TSESTree.Node,
  sourceCode: SourceCode,
  scopeManager: ScopeManager | null,
): TSESTree.Node[] {
  const declarations: TSESTree.Node[] = [];
  const scope = getScopeFromManager(scopeManager, node) ?? sourceCode.getScope(node);

  for (const name of identifiers) {
    const variable = findVariableInScope(name, scope);
    if (variable !== undefined) {
      for (const def of variable.defs) {
        declarations.push(getEnclosingStatement(def.node));
      }
    }
  }

  if (declarations.length < identifiers.size) {
    const keys = sourceCode.visitorKeys ?? {};
    const stack: TSESTree.Node[] = [sourceCode.ast as TSESTree.Node];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined) continue;

      if (
        current.type === AST_NODE_TYPES.FunctionDeclaration &&
        current.id &&
        identifiers.has(current.id.name)
      ) {
        declarations.push(getEnclosingStatement(current));
      }

      if (
        current.type === AST_NODE_TYPES.VariableDeclarator &&
        current.id.type === AST_NODE_TYPES.Identifier &&
        identifiers.has(current.id.name)
      ) {
        declarations.push(getEnclosingStatement(current));
      }

      const childKeys = keys[current.type] ?? [];
      for (const key of childKeys) {
        const value = (current as unknown as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          for (const child of value) {
            if (
              child !== null &&
              child !== undefined &&
              typeof (child as TSESTree.Node).type === "string"
            ) {
              stack.push(child as TSESTree.Node);
            }
          }
        } else if (
          value !== null &&
          value !== undefined &&
          typeof (value as TSESTree.Node).type === "string"
        ) {
          stack.push(value as TSESTree.Node);
        }
      }
    }
  }

  return declarations;
}

function addRangeLines(node: TSESTree.Node, lines: Set<number>): void {
  for (let i = node.loc.start.line; i <= node.loc.end.line; i++) {
    lines.add(i);
  }
}

function addBoundaryLines(node: TSESTree.Node, lines: Set<number>): void {
  lines.add(node.loc.start.line);
  lines.add(node.loc.end.line);
}

function isAncestorOf(ancestor: TSESTree.Node, descendant: TSESTree.Node): boolean {
  return ancestor.range[0] <= descendant.range[0] && ancestor.range[1] >= descendant.range[1];
}

function collectBranchExclusions(target: TSESTree.TaggedTemplateExpression): Set<number> {
  const excludedLines = new Set<number>();
  let child: TSESTree.Node | null = target;
  let parent = target.parent as TSESTree.Node | null;

  const excludeNode = (node: TSESTree.Node | null | undefined) => {
    if (node === null || node === undefined) return;
    if (node.type === AST_NODE_TYPES.BlockStatement && node.loc.end.line > node.loc.start.line) {
      for (let i = node.loc.start.line; i < node.loc.end.line; i++) {
        excludedLines.add(i);
      }
      return;
    }
    addRangeLines(node, excludedLines);
  };

  while (parent) {
    const currentChild = child ?? target;

    if (parent.type === AST_NODE_TYPES.IfStatement) {
      if (
        parent.consequent !== null &&
        parent.consequent !== undefined &&
        isAncestorOf(parent.consequent, currentChild)
      ) {
        excludeNode(parent.alternate);
      } else if (
        parent.alternate !== null &&
        parent.alternate !== undefined &&
        isAncestorOf(parent.alternate, currentChild)
      ) {
        excludeNode(parent.consequent);
      }
    }

    if (parent.type === AST_NODE_TYPES.ConditionalExpression) {
      if (
        parent.consequent !== null &&
        parent.consequent !== undefined &&
        isAncestorOf(parent.consequent, currentChild)
      ) {
        excludeNode(parent.alternate);
      } else if (
        parent.alternate !== null &&
        parent.alternate !== undefined &&
        isAncestorOf(parent.alternate, currentChild)
      ) {
        excludeNode(parent.consequent);
      }
    }

    if (parent.type === AST_NODE_TYPES.SwitchStatement) {
      const targetCase = parent.cases.find((switchCase) => isAncestorOf(switchCase, currentChild));
      for (const switchCase of parent.cases) {
        if (switchCase !== targetCase) {
          excludeNode(switchCase);
        }
      }
    }

    child = parent;
    parent = parent.parent as TSESTree.Node | null;
  }

  return excludedLines;
}

function collectStructuralLines(
  node: TSESTree.TaggedTemplateExpression,
  sourceCode: SourceCode,
): Set<number> {
  const lines = new Set<number>();
  const ancestors = sourceCode.getAncestors(node);

  for (const ancestor of ancestors) {
    if (ancestor.type === AST_NODE_TYPES.Program) continue;
    addBoundaryLines(ancestor, lines);
  }

  addRangeLines(node, lines);
  return lines;
}

export function buildMinimalCode(
  node: TSESTree.TaggedTemplateExpression,
  sourceCode: SourceCode,
  scopeManager: ScopeManager | null = sourceCode.scopeManager ?? null,
): string {
  const lines = sourceCode.lines;
  const requiredLines = collectStructuralLines(node, sourceCode);
  const excludedLines = collectBranchExclusions(node);

  const program = sourceCode.ast;
  const imports = extractModuleImports(program, "styled-jsx/css");
  for (const imp of imports) {
    addRangeLines(imp, requiredLines);
  }

  const identifiers = collectReferencedIdentifiers(node);
  const declarations = collectVariableDeclarations(identifiers, node, sourceCode, scopeManager);
  for (const declaration of declarations) {
    addRangeLines(declaration, requiredLines);
  }

  const resultLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const isRequired = requiredLines.has(lineNumber);
    const isExcluded = excludedLines.has(lineNumber);

    if (isRequired && !isExcluded) {
      resultLines.push(lines[i] ?? "");
    } else {
      resultLines.push("");
    }
  }

  return resultLines.join("\n");
}

function isErrorInNode(
  errorLoc: { column: number; line: number },
  node: TSESTree.TaggedTemplateExpression,
): boolean {
  const { column, line } = errorLoc;
  const nodeStart = node.loc.start;
  const nodeEnd = node.loc.end;

  if (line < nodeStart.line || line > nodeEnd.line) {
    return false;
  }

  if (line === nodeStart.line && column < nodeStart.column) {
    return false;
  }
  if (line === nodeEnd.line && column > nodeEnd.column) {
    return false;
  }

  return true;
}

export default createRule<Options, MessageIds>({
  create: (context: Readonly<RuleContext<MessageIds, Options>>) => {
    let styledJSXModule: StyledJSXModule | null = null;
    const sourceCode = context.sourceCode;

    return {
      Program: (node) => {
        styledJSXModule = prepareStyledJSXModule(node);
      },

      TaggedTemplateExpression(node) {
        if (styledJSXModule === null) return;
        const tag = styledJSXModule.resolveTag(node);
        if (tag === false) return;

        const code = buildMinimalCode(node, sourceCode, sourceCode.scopeManager);

        const babelResult = tryTransformWithBabel(code, context.filename ?? "unknown.ts");

        if (babelResult.isError) {
          const msg =
            babelResult.error instanceof Error
              ? babelResult.error.message
              : String(babelResult.error);
          const concise = msg.replaceAll(`${context.physicalFilename}: `, "");

          context.report({
            data: {
              message: concise,
            },
            messageId: "babelCompilationError",
            node,
          });
          return;
        }
        // if (babelResult.isError && isBabelError(babelResult.error)) {
        //   const errorLoc = {
        //     column: babelResult.error.loc.column,
        //     line: babelResult.error.loc.line,
        //   };

        //   if (isErrorInNode(errorLoc, node)) {
        //     context.report({
        //       data: {
        //         message: babelResult.error.message,
        //       },
        //       messageId: "babelCompilationError",
        //       node,
        //     });
        //   }
        // }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Validate styled-jsx CSS tags using Babel compilation",
    },
    messages: {
      babelCompilationError: "Babel compilation error: {{message}}",
    },
    schema: [],
    type: "problem",
  },
  name: RULE_VALIDATE_STYLED_JSX_BABEL,
});
