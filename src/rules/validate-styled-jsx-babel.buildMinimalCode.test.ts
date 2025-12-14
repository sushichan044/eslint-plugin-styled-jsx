import { parseForESLint } from "@typescript-eslint/parser";
import { analyze, type ScopeManager } from "@typescript-eslint/scope-manager";
import { AST_NODE_TYPES, TSESLint, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, test } from "vitest";

import { buildMinimalCode } from "./validate-styled-jsx-babel";

const { SourceCode } = TSESLint;

function isNode(value: unknown): value is TSESTree.Node {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in (value as { type?: unknown }) &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function getNthTaggedTemplate(
  ast: TSESTree.Program,
  visitorKeys: TSESLint.SourceCode.VisitorKeys,
  nth = 0,
): TSESTree.TaggedTemplateExpression {
  const queue: TSESTree.Node[] = [ast];
  const foundNodes: TSESTree.TaggedTemplateExpression[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) continue;
    if (node.type === AST_NODE_TYPES.TaggedTemplateExpression) {
      foundNodes.push(node);
    }

    const keys = visitorKeys[node.type] ?? [];
    for (const key of keys) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNode(child)) queue.push(child);
        }
      } else if (isNode(value)) {
        queue.push(value);
      }
    }
  }

  if (foundNodes.length > nth) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return foundNodes[nth]!;
  }
}

function createSource(code: string): {
  scopeManager: ScopeManager | null;
  sourceCode: TSESLint.SourceCode;
  visitorKeys: TSESLint.SourceCode.VisitorKeys;
} {
  const parsed = parseForESLint(code, {
    comment: true,
    ecmaVersion: 2022,
    loc: true,
    range: true,
    sourceType: "module",
    tokens: true,
  });

  const program = parsed.ast as TSESLint.SourceCode.Program;
  program.comments = program.comments ?? [];
  program.tokens = program.tokens ?? [];
  const visitorKeys = Object.fromEntries(
    Object.entries(parsed.visitorKeys ?? {}).map(([key, value]) => [key, value ?? []]),
  ) as TSESLint.SourceCode.VisitorKeys;

  const attachParents = (node: TSESTree.Node, parent: TSESTree.Node | null) => {
    // @ts-expect-error -- parent is used by ESLint utilities
    node.parent = parent;
    const keys = visitorKeys[node.type] ?? [];
    for (const key of keys) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNode(child)) attachParents(child, node);
        }
      } else if (isNode(value)) {
        attachParents(value, node);
      }
    }
  };

  attachParents(program, null);

  const scopeManager =
    parsed.scopeManager ??
    analyze(program, {
      childVisitorKeys: visitorKeys,
      globalReturn: false,
      lib: ["es2022"],
      sourceType: "module",
    });

  return {
    scopeManager,
    sourceCode: new SourceCode({
      ast: program,
      parserServices: parsed.services,
      scopeManager,
      text: code,
      visitorKeys,
    }),
    visitorKeys,
  };
}

function nonEmptyLines(code: string): number[] {
  return code
    .split("\n")
    .map((line, index) => (line.trim() === "" ? null : index + 1))
    .filter((lineNumber): lineNumber is number => lineNumber !== null);
}

describe("buildMinimalCode", () => {
  test("includes outer-scope variables referenced inside template", () => {
    const code = [
      "import css from 'styled-jsx/css';",
      "const color = 'red';",
      "function get() {",
      "  return css`div { color: ${color}; }`;",
      "}",
    ].join("\n");

    const { scopeManager, sourceCode, visitorKeys } = createSource(code);
    const tag = getNthTaggedTemplate(sourceCode.ast, visitorKeys);

    const minimal = buildMinimalCode(tag, sourceCode, scopeManager);

    expect(nonEmptyLines(minimal)).toEqual([1, 2, 3, 4, 5]);
  });

  test("drops unreachable branches when traversing upward", () => {
    // const code = [
    //   'import css from "styled-jsx/css";',
    //   "function get(flag) {",
    //   "  if (flag) {",
    //   "    return css`div{color:red;}`;",
    //   "  } else {",
    //   "    return css`div{color:blue;}`;",
    //   "  }",
    //   "}",
    // ].join("\n");
    const code = [
      "import css from 'styled-jsx/css';",
      "const dynamic = (flag) => css`",
      "  div {",
      "    color: ${flag ? 'red' : 'blue'};",
      "  }",
      "`;",
    ].join("\n");

    const { scopeManager, sourceCode, visitorKeys } = createSource(code);
    const ifTag = getNthTaggedTemplate(sourceCode.ast, visitorKeys, 0);
    const elseTag = getNthTaggedTemplate(sourceCode.ast, visitorKeys, 1);

    const ifMinimal = buildMinimalCode(ifTag, sourceCode, scopeManager);
    const elseMinimal = buildMinimalCode(elseTag, sourceCode, scopeManager);

    expect(ifMinimal).toMatchInlineSnapshot(`
      "import css from "styled-jsx/css";
      function get(flag) {
        if (flag) {
          return css\`div{color:red;}\`;


        }
      }"
    `);
    expect(elseMinimal).toMatchInlineSnapshot(`
      "import css from "styled-jsx/css";
      function get(flag) {


        } else {
          return css\`div{color:blue;}\`;
        }
      }"
    `);
  });
});
