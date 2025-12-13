import css from "styled-jsx/css";

const c = ((ccc: string) => "#ccc" as const)

const getStyles = (color: string) => css.resolve`
  .text {
    color: ${color};
  }
`;

const style2 = css`
  .background {
    background-color: ${c("")};
  }
`;

const globalStyles = css.global`
  body {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
  }
`;

export const App = () => {
  const css = getStyles("blue");

  return (
    <>
      {css.styles}
      <div className={css.className}>
        <style jsx>{style2}</style>
        <div className="background">This div has background color.</div>
        <p className="text">Hello, styled-jsx!</p>
        <style global jsx>
          {globalStyles}
        </style>
      </div>
    </>
  );
};
