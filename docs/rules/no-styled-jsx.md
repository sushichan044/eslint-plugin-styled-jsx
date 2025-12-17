# Prohibit the use of `styled-jsx` (`styled-jsx/no-styled-jsx`)

💼 This rule is enabled in the 💥 `prohibit` config.

<!-- end auto-generated rule header -->

## Rule Details

This rule prohibits the use of `styled-jsx` in your codebase.

It reports any import statements from the `styled-jsx` package as well as any usage of the `jsx` or `global` attributes on `<style>` elements.

### ❌ Incorrect

```tsx
import css from "styled-jsx/css";
// ^ `styled-jsx` imports are not allowed.
```

```tsx
const styles = css`
  div {
    color: red;
  }
`;
// ^ Usage of `styled-jsx` tagged template is not allowed.
```

```tsx
const Component = () => (
  <>
    <style jsx>{`
      div {
        color: red;
      }
    `}</style>
    {/* ^ Attribute `jsx` on <style> is not allowed. */}
    <div>Hello</div>
  </>
);
```

## Options

<!-- begin auto-generated rule options list -->

| Name     | Description                                           | Type   |
| :------- | :---------------------------------------------------- | :----- |
| `reason` | Custom reason explaining why styled-jsx is prohibited | String |

<!-- end auto-generated rule options list -->
