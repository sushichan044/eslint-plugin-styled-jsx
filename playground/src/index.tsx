/* eslint-disable styled-jsx/require-resolve-for-dynamic-external-css */
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

const dyn2 = (isDark: boolean) => css`
    .dynamic2 {
      background-color: ${isDark};
    }
  `;

type SS = "a" | "b" | "c";

const ss = (s: SS) => {
  switch (s) {
    case "a":
      return css`
        .ss {
          color: ${Math.random() > 0.5 ? "black" : "white"};
        }
      `;
    case "b":
      return css`
        .ss {
          color: ${Math.random() > 0.5 ? "red" : "blue"};
        }
      `;
    case "c":
      return css`
        .ss {
          color: ${Math.random() > 0.5 ? "green" : "yellow"};
        }
      `;
  }
}

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
