import { run } from "eslint-vitest-rule-tester";

import { RULE_NO_STYLED_JSX } from "../constants";
import rule from "./no-styled-jsx";

await run({
  name: RULE_NO_STYLED_JSX,
  rule,

  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },

  valid: [
    {
      code: `const styles = "css";`,
      name: "regular code without styled-jsx",
    },
    {
      code: `import other from "other-lib";`,
      name: "import from other library",
    },
    {
      code: `const mod = await import("other-lib");`,
      name: "dynamic import from other library",
    },
    {
      code: `
        import React from "react";
        const Component = () => <style>{css}</style>;
      `,
      name: "style tag without jsx/global attributes",
    },
    {
      code: `
        const Component = () => <div jsx={true}>content</div>;
      `,
      name: "jsx attribute on non-style element",
    },
    {
      code: `
        const Component = () => <div global={true}>content</div>;
      `,
      name: "global attribute on non-style element",
    },
  ],

  invalid: [
    {
      code: `import css from "styled-jsx";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "default import from styled-jsx",
    },
    {
      code: `import css from "styled-jsx/css";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "default import from styled-jsx/css",
    },
    {
      code: `import css from "styled-jsx/css.js";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "default import with .js from styled-jsx/css",
    },
    {
      code: `import css from "styled-jsx/css.mjs";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "default import with .mjs from styled-jsx/css",
    },
    {
      code: `import { resolve } from "styled-jsx/css";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "named import from styled-jsx/css",
    },
    {
      code: `import * as StyledJSX from "styled-jsx";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "namespace import from styled-jsx",
    },
    {
      code: `import "styled-jsx/style";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "side-effect import from styled-jsx",
    },
    {
      code: `const mod = await import("styled-jsx");`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "dynamic import from styled-jsx",
    },
    {
      code: `
        const Component = () => <style jsx>{css}</style>;
      `,
      errors: [
        {
          data: { attributeName: "jsx", reasonSuffix: "" },
          messageId: "noStyledJSXAttribute",
        },
      ],
      name: "jsx attribute on style tag",
    },
    {
      code: `
        const Component = () => <style global>{css}</style>;
      `,
      errors: [
        {
          data: { attributeName: "global", reasonSuffix: "" },
          messageId: "noStyledJSXAttribute",
        },
      ],
      name: "global attribute on style tag",
    },
    {
      code: `
        const Component = () => <style jsx global>{css}</style>;
      `,
      errors: [
        {
          data: { attributeName: "jsx", reasonSuffix: "" },
          messageId: "noStyledJSXAttribute",
        },
        {
          data: { attributeName: "global", reasonSuffix: "" },
          messageId: "noStyledJSXAttribute",
        },
      ],
      name: "both jsx and global attributes on style tag",
    },
    {
      code: `
        import * as styledJsx from "styled-jsx/css";
        const styles = styledJsx.default\`.foo {color: white;}\`;
      `,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXTemplate",
        },
      ],
      name: "namespace import and usage",
    },
    {
      code: `
        import css from "styled-jsx/css";
        const Component = () => <style jsx global>{css}</style>;`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
        {
          data: { attributeName: "jsx", reasonSuffix: "" },
          messageId: "noStyledJSXAttribute",
        },
        {
          data: { attributeName: "global", reasonSuffix: "" },
          messageId: "noStyledJSXAttribute",
        },
      ],
      name: "import and attributes combined",
    },
    {
      code: `import css from "styled-jsx/css";`,
      errors: [
        {
          data: { reasonSuffix: " Reason: We use Tailwind CSS instead" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "import with custom reason",
      options: [{ reason: "We use Tailwind CSS instead" }],
    },
    {
      code: `import css from "styled-jsx/css"; const styles = css\`.foo{}\`;`,
      errors: [
        {
          data: { reasonSuffix: " Reason: We use Tailwind CSS instead" },
          messageId: "noStyledJSXImport",
        },
        {
          data: { reasonSuffix: " Reason: We use Tailwind CSS instead" },
          messageId: "noStyledJSXTemplate",
        },
      ],
      name: "template with custom reason",
      options: [{ reason: "We use Tailwind CSS instead" }],
    },
    {
      code: `const Component = () => <style jsx>{css}</style>;`,
      errors: [
        {
          data: {
            attributeName: "jsx",
            reasonSuffix: " Reason: We use Tailwind CSS instead",
          },
          messageId: "noStyledJSXAttribute",
        },
      ],
      name: "jsx attribute with custom reason",
      options: [{ reason: "We use Tailwind CSS instead" }],
    },
    {
      code: `import css from "styled-jsx/css";`,
      errors: [
        {
          data: { reasonSuffix: "" },
          messageId: "noStyledJSXImport",
        },
      ],
      name: "import with empty options object",
      options: [{}],
    },
  ],
});
