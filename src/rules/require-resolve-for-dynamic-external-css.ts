import type { StyledJSXModule } from "../styled-jsx";

import { RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS } from "../constants";
import { prepareStyledJSXModule } from "../styled-jsx";
import { createRule } from "../utils";

type Options = [];
type MessageIds = "requireResolveForDynamicExternalCSS";

export default createRule<Options, MessageIds>({
  create: (context) => {
    let styledJSXModule: StyledJSXModule | null = null;

    return {
      Program: (node) => {
        styledJSXModule = prepareStyledJSXModule(node);
      },

      TaggedTemplateExpression(node) {
        if (!styledJSXModule) return;
        const tag = styledJSXModule.resolveTag(node);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!tag) return;

        const hasDynamicValues = node.quasi.expressions.length > 0;
        if (tag.type !== "css.resolve" && hasDynamicValues) {
          context.report({
            data: {
              tagType: tag.type,
            },
            messageId: "requireResolveForDynamicExternalCSS",
            node,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Require `css.resolve` when using dynamic values in external `styled-jsx/css` tags.",
    },
    messages: {
      requireResolveForDynamicExternalCSS:
        "Dynamic values are not allowed in external `{{tagType}}` tag. Use `css.resolve` for dynamic external styles.",
    },
    schema: [],
    type: "problem",
  },
  name: RULE_REQUIRE_RESOLVE_FOR_DYNAMIC_EXTERNAL_CSS,
});
