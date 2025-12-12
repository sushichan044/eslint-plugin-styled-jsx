# Require `css.resolve` when using dynamic values in external `styled-jsx/css` tags (`styled-jsx/require-resolve-for-dynamic-external-css`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

## Rule Details

This rule reports dynamic values in external style tags and tells you to switch to `css.resolve`.

External styles created with `styled-jsx/css` do **not** accept dynamic interpolations when you use `css` or `css.global`.

Only [`css.resolve`](https://github.com/vercel/styled-jsx?tab=readme-ov-file#the-resolve-tag) supports dynamic interpolations at runtime.

### ❌ Incorrect

```tsx
import css from "styled-jsx/css";

// Dynamic parts inside `css` won't work at runtime
const createButton = (color: string) => css`
  button {
    color: ${color};
  }
`;

export function LinkButton() {
  const styles = createButton("#ff0000");

  return (
    <>
      <button>Press me</button>
      <style jsx>{styles}</style>
    </>
  );
}
```

### ✅ Correct (use `css.resolve`)

```tsx
import css from "styled-jsx/css";

const createButton = (color: string) => css.resolve`
  button {
    color: ${color};
  }
`;

export function LinkButton() {
  const { className, styles } = createButton("#ff0000");
  return (
    <>
      <button className={className}>Press me</button>
      {styles}
    </>
  );
}
```
