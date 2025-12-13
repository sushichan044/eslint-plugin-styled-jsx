# eslint-plugin-styled-jsx

ESLint plugin for [styled-jsx](https://github.com/vercel/styled-jsx).

## Installation

```bash
pnpm add -D eslint eslint-plugin-styled-jsx
```

## Usage

Make sure you are using ESLint Flat Config.

This is an example configuration:

```ts
import { defineConfig } from "eslint/config";
import styledJSX from "eslint-plugin-styled-jsx";

export default defineConfig({
  plugins: {
    "styled-jsx": styledJSX,
  },
  rules: {
    "styled-jsx/no-dynamic-external-style-except-resolve-tag": "error",
  },
});
```

## Shareable Configs

### Recommended

```ts
import { defineConfig } from "eslint/config";
import styledJSX from "eslint-plugin-styled-jsx";

export default defineConfig({
  extends: [styledJSX.configs.recommended],
});
```

### Prohibit

Next.js setup `styled-jsx` by default. If you want to prohibit its usage, use this configuration.

```ts
import { defineConfig } from "eslint/config";
import styledJSX from "eslint-plugin-styled-jsx";

export default defineConfig({
  extends: [styledJSX.configs.prohibit],
});
```

### Strict

```ts
import { defineConfig } from "eslint/config";
import styledJSX from "eslint-plugin-styled-jsx";

export default defineConfig({
  extends: [styledJSX.configs.strict],
});
```

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
💥 Set in the `prohibit` configuration.\
✅ Set in the `recommended` configuration.\
🔒 Set in the `strict` configuration.

| Name                                                                                               | Description                                                                        | 💼    |
| :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :---- |
| [no-styled-jsx](docs/rules/no-styled-jsx.md)                                                       | Prohibit the use of `styled-jsx`.                                                  | 💥    |
| [require-resolve-for-dynamic-external-css](docs/rules/require-resolve-for-dynamic-external-css.md) | Require `css.resolve` when using dynamic values in external `styled-jsx/css` tags. | ✅ 🔒 |

<!-- end auto-generated rules list -->

## Contributing

Contributions are welcome!
