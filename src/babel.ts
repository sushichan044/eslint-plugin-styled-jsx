import { transformSync } from "@babel/core";

interface BabelError extends Error {
  loc: {
    column: number;
    line: number;
  };
  message: string;
  reasonCode: string;
}

// https://github.com/vercel/styled-jsx/blob/d7a59379134d73afaeb98177387cd62d54d746be/src/_utils.js#L641-L664
interface TransformOptions {
  styledJSXOptions: {
    plugins?: Array<string | [string, Record<string, unknown>]>;
    sourceMaps?: boolean;
    /**
     * @default
     * 'styled-jsx/style'
     */
    styleModule?: string;
    vendorPrefixes?: boolean;
  };
}

type TransformResult =
  | {
      error: unknown;
      isError: true;
    }
  | {
      isError: false;
    };

export function tryTransformWithBabel(
  code: string,
  filepath: string,
  options?: TransformOptions,
): TransformResult {
  try {
    transformSync(code, {
      babelrc: false,
      configFile: false,
      filename: filepath,
      parserOpts: {
        plugins: ["jsx", "typescript"],
        ranges: true,
        sourceType: "module",
        tokens: true,
      },
      plugins: [
        [
          "styled-jsx/babel",
          {
            ...options?.styledJSXOptions,
          },
        ],
      ],
    });
    return { isError: false };
  } catch (e) {
    return { error: e, isError: true };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isBabelError(error: unknown): error is BabelError {
  return (
    typeof error === "object" &&
    error !== null &&
    "reasonCode" in error &&
    "message" in error &&
    "loc" in error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    typeof (error as any).loc === "object" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (error as any).loc !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    "line" in (error as any).loc &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    typeof (error as any).loc.line === "number" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    "column" in (error as any).loc &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    typeof (error as any).loc.column === "number"
  );
}
