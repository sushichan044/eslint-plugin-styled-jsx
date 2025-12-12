import css from "styled-jsx/css";

const getStyles = (color: string) => css`
  .text {
    color: ${color};
  }
`;

const MyComponent = () => {
  const styles = getStyles("blue");

  return (
    <div>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{styles}</style>
      <p className="text">Hello, styled-jsx!</p>
    </div>
  );
};

export default MyComponent;
