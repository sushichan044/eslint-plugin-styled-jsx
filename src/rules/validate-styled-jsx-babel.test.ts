import { run } from "eslint-vitest-rule-tester";

import { RULE_VALIDATE_STYLED_JSX_BABEL } from "../constants";
import rule from "./validate-styled-jsx-babel";

await run({
  name: RULE_VALIDATE_STYLED_JSX_BABEL,
  rule,

  valid: [
    {
      code: `
        import css from 'styled-jsx/css';
        const color = 'red';
        const styles = css\`.class { color: \${color}; }\`;
      `,
      name: "valid CSS with variable reference",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const styles = css\`.class { color: red; }\`;
      `,
      name: "static CSS without errors",
    },
    {
      code: `
        import { global } from 'styled-jsx/css';
        const color = 'blue';
        const styles = global\`.class { color: \${color}; }\`;
      `,
      name: "css.global with variable reference",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (color) => {
          if (color === "red") {
            return css\`.text { color: red; }\`;
          }
          return css\`.text { color: \${color}; }\`;
        };
      `,
      name: "should exclude unreachable branch with other tag",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (color, size) => {
          if (color === "red") {
            if (size === "large") {
              return css\`.text { color: red; font-size: 20px; }\`;
            }
            return css\`.text { color: red; font-size: 14px; }\`;
          }
          return css\`.text { color: \${color}; }\`;
        };
      `,
      name: "should handle nested branches correctly",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const dark = true;
        const styles = dark
          ? css\`.text { color: white; }\`
          : css\`.text { color: black; }\`;
      `,
      name: "should handle conditional expression",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (theme) => {
          switch (theme) {
            case "dark":
              return css\`.text { color: white; }\`;
            case "light":
              return css\`.text { color: black; }\`;
            default:
              return css\`.text { color: gray; }\`;
          }
        };
      `,
      name: "should handle switch statement branches",
    },
  ],

  invalid: [
    {
      code: `
        import css from 'styled-jsx/css';
        const styles = css\`
          div { color: \${unknownColor}; }
        \`;
        const other = css\`
          span { color: \${anotherUnknown}; }
        \`;
      `,
      errors: [
        {
          line: 4,
          messageId: "babelCompilationError",
        },
        {
          line: 7,
          messageId: "babelCompilationError",
        },
      ],
      name: "reports multiple styled-jsx errors in a single pass",
    },
  ],
});
