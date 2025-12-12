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

### All

```ts
import { defineConfig } from "eslint/config";
import styledJSX from "eslint-plugin-styled-jsx";

export default defineConfig({
  extends: [styledJSX.configs.all],
});
```

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
🌐 Set in the `all` configuration.\
✅ Set in the `recommended` configuration.

| Name                                                                                               | Description                                                                        | 💼    |
| :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :---- |
| [require-resolve-for-dynamic-external-css](docs/rules/require-resolve-for-dynamic-external-css.md) | Require `css.resolve` when using dynamic values in external `styled-jsx/css` tags. | 🌐 ✅ |

<!-- end auto-generated rules list -->

## Contributing

Contributions are welcome!
