import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { RULE_NO_STYLED_JSX } from "../constants";
import { createRule, isStyledJSXImport, isStyleElement } from "../utils";

type Options = [];
type MessageIds = "noStyledJSXAttribute" | "noStyledJSXImport";

export default createRule<Options, MessageIds>({
  create: (context) => {
    return {
      ImportDeclaration: (node) => {
        const moduleRequest = node.source.value;
        if (isStyledJSXImport(moduleRequest)) {
          context.report({
            messageId: "noStyledJSXImport",
            node,
          });
        }
      },

      ImportExpression: (node) => {
        if (node.source.type !== AST_NODE_TYPES.Literal) {
          return;
        }

        const moduleRequest = node.source.value;
        if (isStyledJSXImport(moduleRequest)) {
          context.report({
            messageId: "noStyledJSXImport",
            node,
          });
        }
      },

      JSXAttribute: (node) => {
        const tag = node.parent;
        if (!isStyleElement(tag)) {
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
            },
            messageId: "noStyledJSXAttribute",
            node,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prohibit the use of `styled-jsx`.",
    },
    messages: {
      noStyledJSXAttribute: "Attribute `{{attributeName}}` on <style> is not allowed.",
      noStyledJSXImport: "`styled-jsx` imports are not allowed.",
    },
    schema: [],
    type: "problem",
  },
  name: RULE_NO_STYLED_JSX,
});
