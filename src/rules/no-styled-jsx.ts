import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import type { StyledJSXModule } from "../styled-jsx";

import { RULE_NO_STYLED_JSX } from "../constants";
import { prepareStyledJSXModule } from "../styled-jsx";
import { createRule, isHTMLOpeningElement, isStyledJSXImport } from "../utils";

type Options = [
  {
    reason?: string;
  }?,
];
type MessageIds = "noStyledJSXAttribute" | "noStyledJSXImport" | "noStyledJSXTemplate";

export default createRule<Options, MessageIds>({
  create: (context) => {
    const options = context.options[0];
    const reasonSuffix =
      options?.reason !== undefined && options.reason !== "" ? ` Reason: ${options.reason}` : "";

    let styledJSXModule: StyledJSXModule | null = null;

    return {
      Program: (node) => {
        styledJSXModule = prepareStyledJSXModule(node);
      },

      ImportDeclaration: (node) => {
        const moduleRequest = node.source.value;
        if (isStyledJSXImport(moduleRequest)) {
          context.report({
            data: {
              reasonSuffix,
            },
            messageId: "noStyledJSXImport",
            node,
          });
        }
      },

      TaggedTemplateExpression: (node) => {
        if (!styledJSXModule) return;
        const tag = styledJSXModule.resolveTag(node);
        if (tag === false) return;

        context.report({
          data: {
            reasonSuffix,
          },
          messageId: "noStyledJSXTemplate",
          node,
        });
      },

      ImportExpression: (node) => {
        if (node.source.type !== AST_NODE_TYPES.Literal) {
          return;
        }

        const moduleRequest = node.source.value;
        if (isStyledJSXImport(moduleRequest)) {
          context.report({
            data: {
              reasonSuffix,
            },
            messageId: "noStyledJSXImport",
            node,
          });
        }
      },

      JSXAttribute: (node) => {
        const tag = node.parent;
        if (!isHTMLOpeningElement(tag, "style")) {
          return;
        }
        if (node.name.type !== AST_NODE_TYPES.JSXIdentifier) {
          return;
        }

        const attrName = node.name.name;
        if (attrName === "jsx" || attrName === "global") {
          context.report({
            data: {
              attributeName: attrName,
              reasonSuffix,
            },
            messageId: "noStyledJSXAttribute",
            node,
          });
        }
      },
    };
  },
  defaultOptions: [{}],
  meta: {
    defaultOptions: [{}],
    docs: {
      description: "Prohibit the use of `styled-jsx`.",
    },
    messages: {
      noStyledJSXAttribute:
        "Attribute `{{attributeName}}` on <style> is not allowed.{{reasonSuffix}}",
      noStyledJSXImport: "`styled-jsx` imports are not allowed.{{reasonSuffix}}",
      noStyledJSXTemplate: "Usage of `styled-jsx` tagged template is not allowed.{{reasonSuffix}}",
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          reason: {
            description: "Custom reason explaining why styled-jsx is prohibited",
            type: "string",
          },
        },
        type: "object",
      },
    ],
    type: "problem",
  },
  name: RULE_NO_STYLED_JSX,
});
