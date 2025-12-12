import type { StyledJSXModule } from "../styled-jsx";

import { RULE_NO_DYNAMIC_EXTERNAL_STYLE_EXCEPT_RESOLVE_TAG } from "../constants";
import { prepareStyledJSXModule } from "../styled-jsx";
import { createRule } from "../utils";

type Options = [];
type MessageIds = "noDynamicExternalStyleExceptResolveTag";

export default createRule<Options, MessageIds>({
  create: (context) => {
    let styledJSXModule: StyledJSXModule | null = null;

    return {
      Program: (node) => {
        styledJSXModule = prepareStyledJSXModule(node);
      },

      TaggedTemplateExpression(node) {
        if (!styledJSXModule) return;
        const tagType = styledJSXModule.resolveTag(node);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!tagType) return;

        const hasDynamicValues = node.quasi.expressions.length > 0;

        if (tagType !== "css.resolve" && hasDynamicValues) {
          context.report({
            data: {
              tagType,
            },
            messageId: "noDynamicExternalStyleExceptResolveTag",
            node,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow dynamic values in `styled-jsx/css` tags except `css.resolve`.",
    },
    messages: {
      noDynamicExternalStyleExceptResolveTag:
        "Dynamic values are not allowed in `{{tagType}}` tag. Use `css.resolve` tag to use dynamic values.",
    },
    schema: [],
    type: "problem",
  },
  name: RULE_NO_DYNAMIC_EXTERNAL_STYLE_EXCEPT_RESOLVE_TAG,
});
