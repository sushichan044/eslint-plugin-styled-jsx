import { transformSync } from "@babel/core";

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
  };
  message: string;
}

interface LintLogger {
  log(err: StyledJSXBabelError): void;
}

// https://github.com/vercel/styled-jsx/blob/d7a59379134d73afaeb98177387cd62d54d746be/src/_utils.js#L641-L664
interface TransformOptions {
  styledJSXOptions?: {
    __lint?: LintLogger;
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
  const logger: LintLogger = {
    log: (err: StyledJSXBabelError) => {
      lintErrors.push(err);
    },
  };

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
            __lint: logger,
          },
        ],
      ],
    });
    return { isError: false, lintErrors };
  } catch (e) {
    return { error: e, isError: true, lintErrors };
  }
}
