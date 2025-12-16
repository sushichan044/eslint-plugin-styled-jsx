import { transformSync } from "@babel/core";

interface BabelError extends Error {
  loc: {
    column: number;
    line: number;
  };
  message: string;
  reasonCode: string;
}

export interface StyledJSXBabelError {
  loc: {
    end: {
      column: number;
      line: number;
    };
    start: {
      column: number;
      line: number;
    };
  } | null;
  message: string;
}

// https://github.com/vercel/styled-jsx/blob/d7a59379134d73afaeb98177387cd62d54d746be/src/_utils.js#L641-L664
interface TransformOptions {
  styledJSXOptions?: {
    __lint?: {
      errors: StyledJSXBabelError[];
    };
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
      lintErrors: StyledJSXBabelError[];
    }
  | {
      isError: false;
      lintErrors: StyledJSXBabelError[];
    };

export function tryTransformWithBabel(
  code: string,
  filepath: string,
  options?: TransformOptions,
): TransformResult {
  const lintErrors: StyledJSXBabelError[] = [];
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
            __lint: {
              ...options?.styledJSXOptions?.__lint,
              errors: lintErrors,
            },
          },
        ],
      ],
    });
    return { isError: false, lintErrors };
  } catch (e) {
    return { error: e, isError: true, lintErrors };
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
