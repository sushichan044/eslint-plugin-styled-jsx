import { transformSync } from "@babel/core";

export interface BabelError extends Error {
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

export function tryTransformWithBabel(
  code: string,
  filepath: string,
  options?: TransformOptions,
): BabelError | null {
  try {
    transformSync(code, {
      babelrc: false,
      configFile: false,
      filename: filepath,
      parserOpts: {
        plugins: ["jsx", "typescript"],
        sourceType: "module",
      },
      plugins: [
        "styled-jsx/babel",
        {
          ...options?.styledJSXOptions,
        },
      ],
    });
    return null;
  } catch (e) {
    if (!isBabelError(e)) {
      throw e;
    }
    return e;
  }
}

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
