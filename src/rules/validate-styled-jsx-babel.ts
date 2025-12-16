import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import type { StyledJSXBabelError } from "../babel";
import type { StyledJSXModule } from "../styled-jsx";

import { tryTransformWithBabel } from "../babel";
import { RULE_VALIDATE_STYLED_JSX_BABEL } from "../constants";
import { prepareStyledJSXModule } from "../styled-jsx";
import { createRule, extractModuleImports } from "../utils";

type Options = [];
type MessageIds = "babelCompilationError";

const isLocInside = (
  loc: StyledJSXBabelError["loc"] extends null ? never : NonNullable<StyledJSXBabelError["loc"]>,
  targetLoc: TSESTree.SourceLocation | null | undefined,
): boolean => {
  if (!targetLoc) return false;
  const startsAfter =
    loc.start.line > targetLoc.start.line ||
    (loc.start.line === targetLoc.start.line && loc.start.column >= targetLoc.start.column);
  const endsBefore =
    loc.end.line < targetLoc.end.line ||
    (loc.end.line === targetLoc.end.line && loc.end.column <= targetLoc.end.column);
  return startsAfter && endsBefore;
};

export default createRule<Options, MessageIds>({
  create: (context: Readonly<RuleContext<MessageIds, Options>>) => {
    const sourceCode = context.sourceCode;

    let styledModule: StyledJSXModule | null = null;
    let styledTemplates: TSESTree.TaggedTemplateExpression[] = [];

    return {
      Program: (node) => {
        const imports = extractModuleImports(node, "styled-jsx/css");
        if (imports.length === 0) {
          styledModule = null;
          styledTemplates = [];
          return;
        }
        styledModule = prepareStyledJSXModule(node);
      },

      TaggedTemplateExpression: (node) => {
        if (styledModule === null) return;
        if (styledModule.resolveTag(node) !== false) {
          styledTemplates.push(node);
        }
      },

      "Program:exit": (node) => {
        if (styledModule === null || styledTemplates.length === 0) return;

        const result = tryTransformWithBabel(sourceCode.text, context.filename, {
          styledJSXOptions: {
            __lint: {
              errors: [],
            },
          },
        });

        for (const error of result.lintErrors) {
          const loc = (error.loc ?? node.loc) as StyledJSXBabelError["loc"] | null;
          const targetTemplate =
            loc === null
              ? null
              : (styledTemplates.find((tpl) => isLocInside(loc, tpl.quasi.loc ?? tpl.loc)) ??
                styledTemplates.find((tpl) => isLocInside(loc, tpl.loc)));
          const targetNode = targetTemplate ?? node;

          context.report({
            data: {
              message: error.message,
            },
            messageId: "babelCompilationError",
            node: targetNode,
          });
        }

        if (result.isError && result.lintErrors.length === 0) {
          const msg = result.error instanceof Error ? result.error.message : String(result.error);
          const concise = msg.replaceAll(`${context.physicalFilename}: `, "");

          context.report({
            data: {
              message: concise,
            },
            loc: node.loc ?? undefined,
            messageId: "babelCompilationError",
            node,
          });
        }

        styledModule = null;
        styledTemplates = [];
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
