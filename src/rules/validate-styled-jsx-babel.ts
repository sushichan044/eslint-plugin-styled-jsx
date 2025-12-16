import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { tryTransformWithBabel } from "../babel";
import { RULE_VALIDATE_STYLED_JSX_BABEL } from "../constants";
import { createRule, extractModuleImports } from "../utils";

type Options = [];
type MessageIds = "babelCompilationError";

export default createRule<Options, MessageIds>({
  create: (context: Readonly<RuleContext<MessageIds, Options>>) => {
    const sourceCode = context.sourceCode;

    return {
      Program: (node) => {
        const imports = extractModuleImports(node, "styled-jsx/css");
        if (imports.length === 0) return;

        const result = tryTransformWithBabel(sourceCode.text, context.filename, {
          styledJSXOptions: {
            __lint: {
              errors: [],
            },
          },
        });

        for (const error of result.lintErrors) {
          const loc = error.loc ?? node.loc ?? null;
          context.report({
            data: {
              message: error.message,
            },
            loc:
              loc === null
                ? undefined
                : {
                    end: {
                      column: loc.end.column,
                      line: loc.end.line,
                    },
                    start: {
                      column: loc.start.column,
                      line: loc.start.line,
                    },
                  },
            messageId: "babelCompilationError",
            node,
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
