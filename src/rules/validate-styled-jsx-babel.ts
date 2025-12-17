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

function findVariableInScope(
  name: string,
  scope: ReturnType<SourceCode["getScope"]>,
): ReturnType<NonNullable<ReturnType<SourceCode["getScope"]>>["set"]["get"]> | undefined {
  if (scope === null) return undefined;

  const variable = scope.set.get(name);
  if (variable !== undefined) return variable;

  if (scope.upper === null) return undefined;
  return findVariableInScope(name, scope.upper);
}

function findVariableDeclarations(
  identifiers: Set<string>,
  node: TSESTree.Node,
  sourceCode: SourceCode,
): TSESTree.Node[] {
  const declarations: TSESTree.Node[] = [];
  const scope = sourceCode.getScope(node);

  for (const name of identifiers) {
    const variable = findVariableInScope(name, scope);
    if (variable) {
      for (const def of variable.defs) {
        declarations.push(def.node);
      }
    }
  }

  return declarations;
}

function findOtherTaggedTemplates(
  targetNode: TSESTree.TaggedTemplateExpression,
  declaration: TSESTree.Node,
): TSESTree.TaggedTemplateExpression[] {
  const otherTags: TSESTree.TaggedTemplateExpression[] = [];
  const visited = new WeakSet<object>();

  walk(declaration, null, {
    _(node, { next }) {
      if (visited.has(node)) {
        return;
      }
      visited.add(node);
      next();
    },
    TaggedTemplateExpression(node) {
      if (node !== targetNode) {
        otherTags.push(node);
      }
    },
  });

  return otherTags;
}

function findContainingBranch(
  node: TSESTree.Node,
  withinNode: TSESTree.Node,
  sourceCode: SourceCode,
): TSESTree.Node | null {
  const ancestors = sourceCode.getAncestors(node);

  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];

    if (!ancestor) continue;

    if (ancestor === withinNode) {
      return null;
    }

    if (ancestor.type === AST_NODE_TYPES.ReturnStatement) {
      return ancestor;
    }

    if (ancestor.type === AST_NODE_TYPES.IfStatement) {
      const parent = i > 0 ? ancestors[i - 1] : null;
      if (parent && parent.type === AST_NODE_TYPES.IfStatement) {
        continue;
      }
      return ancestor;
    }

    if (ancestor.type === AST_NODE_TYPES.ConditionalExpression) {
      return ancestor;
    }

    if (ancestor.type === AST_NODE_TYPES.SwitchCase) {
      return ancestor;
    }
  }

  return null;
}

function getBranchLinesToExclude(
  otherTags: TSESTree.TaggedTemplateExpression[],
  declaration: TSESTree.Node,
  sourceCode: SourceCode,
): Set<number> {
  const excludedLines = new Set<number>();

  for (const otherTag of otherTags) {
    const branch = findContainingBranch(otherTag, declaration, sourceCode);

    if (branch !== null) {
      for (let i = branch.loc.start.line; i <= branch.loc.end.line; i++) {
        excludedLines.add(i);
      }
    }
  }

  return excludedLines;
}

function buildMinimalCode(
  node: TSESTree.TaggedTemplateExpression,
  declarations: TSESTree.Node[],
  sourceCode: SourceCode,
): string {
  const lines = sourceCode.lines;
  const requiredLines = new Set<number>();
  const excludedLines = new Set<number>();

  const program = sourceCode.ast;
  const imports = extractModuleImports(program, "styled-jsx/css");
  for (const imp of imports) {
    for (let i = imp.loc.start.line; i <= imp.loc.end.line; i++) {
      requiredLines.add(i);
    }
  }

  for (const decl of declarations) {
    const otherTags = findOtherTaggedTemplates(node, decl);
    const branchLinesToExclude = getBranchLinesToExclude(otherTags, decl, sourceCode);

    for (const lineNum of branchLinesToExclude) {
      excludedLines.add(lineNum);
    }

    for (let i = decl.loc.start.line; i <= decl.loc.end.line; i++) {
      requiredLines.add(i);
    }
  }

  for (let i = node.loc.start.line; i <= node.loc.end.line; i++) {
    requiredLines.add(i);
  }

  const resultLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    if (requiredLines.has(lineNumber) && !excludedLines.has(lineNumber)) {
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

        const identifiers = collectReferencedIdentifiers(node);

        const declarations = findVariableDeclarations(identifiers, node, sourceCode);

        const code = buildMinimalCode(node, declarations, sourceCode);

        const babelError = tryTransformWithBabel(code, context.filename ?? "unknown.ts");

        if (babelError) {
          const errorLoc = {
            column: babelError.loc.column,
            line: babelError.loc.line,
          };

          if (isErrorInNode(errorLoc, node)) {
            context.report({
              data: {
                message: babelError.message,
              },
              messageId: "babelCompilationError",
              node,
            });
          }
        }
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
