import css from "styled-jsx/css";

const getStyles = (color: string) => {
  if (color === "red") {
    return css`
      .text {
        color: red;
      }
    `;
  }

  return css`
    .text {
      color: ${color};
    }
  `;
};

export const App = () => {
  const css = getStyles("blue");

  return (
    <>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{css}</style>
      <div>
        <p className="text">Hello, styled-jsx!</p>
      </div>
    </>
  );
};
