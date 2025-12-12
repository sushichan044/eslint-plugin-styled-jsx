import { run } from "eslint-vitest-rule-tester";

import rule from "./no-dynamic-external-style-except-resolve-tag";

await run({
  name: "no-dynamic-external-style-except-resolve-tag",
  rule,

  valid: [
    {
      code: `
        import css, { global } from 'styled-jsx/css';
        const styles = css\`.class { color: red; }\`;
        const globalStyles = global\`.class { margin: 0; }\`;
      `,
      name: "css tag without dynamic values",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (color) => css.resolve\`.class { color: \${color}; }\`;
      `,
      name: "css.resolve tag with dynamic values",
    },
    {
      code: `
        import { resolve } from 'styled-jsx/css';
        const getStyles = (color) => resolve\`.class { color: \${color}; }\`;
      `,
      name: "named import resolve tag with dynamic values",
    },
    {
      code: `
        import { resolve as cssResolve } from 'styled-jsx/css';
        const getStyles = (color) => cssResolve\`.class { color: \${color}; }\`;
      `,
      name: "aliased resolve tag with dynamic values",
    },
    {
      code: `
        const html = someTag\`<div>\${value}</div>\`;
      `,
      name: "unrelated tagged template",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const styles = css.global\`.class { color: red; }\`;
      `,
      name: "css.global tag without dynamic values",
    },
  ],

  invalid: [
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (color) => css\`.class { color: \${color}; }\`;
      `,
      errors: [
        {
          data: { tagType: "css" },
          messageId: "noDynamicExternalStyleExceptResolveTag",
        },
      ],
      name: "default css tag with dynamic values",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (color) => css.global\`.class { color: \${color}; }\`;
      `,
      errors: [
        {
          data: { tagType: "css.global" },
          messageId: "noDynamicExternalStyleExceptResolveTag",
        },
      ],
      name: "css.global tag with dynamic values",
    },
    {
      code: `
        import styledJsx from 'styled-jsx/css';
        const getStyles = (color) => styledJsx\`.class { color: \${color}; }\`;
      `,
      errors: [
        {
          data: { tagType: "css" },
          messageId: "noDynamicExternalStyleExceptResolveTag",
        },
      ],
      name: "aliased default import with dynamic values",
    },
    {
      code: `
        import { global as cssGlobal } from 'styled-jsx/css';
        const getStyles = (color) => cssGlobal\`.class { color: \${color}; }\`;
      `,
      errors: [
        {
          data: { tagType: "css.global" },
          messageId: "noDynamicExternalStyleExceptResolveTag",
        },
      ],
      name: "named import global tag with dynamic values",
    },
    {
      code: `
        import css from 'styled-jsx/css';
        const getStyles = (color, size) => css\`.class { color: \${color}; font-size: \${size}px; }\`;
      `,
      errors: [
        {
          data: { tagType: "css" },
          messageId: "noDynamicExternalStyleExceptResolveTag",
        },
      ],
      name: "multiple dynamic values",
    },
    {
      code: `
        import customCss from 'styled-jsx/css';
        const getStyles = (color) => customCss.global\`.class { color: \${color}; }\`;
      `,
      errors: [
        {
          data: { tagType: "css.global" },
          messageId: "noDynamicExternalStyleExceptResolveTag",
        },
      ],
      name: "css.global with aliased import and dynamic values",
    },
  ],
});
