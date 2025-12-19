import type { TSESTree } from "@typescript-eslint/utils";

import { parse } from "@typescript-eslint/typescript-estree";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { assert, describe, expect, it, test } from "vitest";
import { walk } from "zimmerframe";

import type { StyledJSXTag } from "./styled-jsx";

import { prepareStyledJSXModule } from "./styled-jsx";

type TestCase = {
  code: string;
  expectedTag: false | StyledJSXTag;
  name: string;
};

function parseCode(code: string): TSESTree.Program {
  return parse(code, {
    ecmaVersion: "latest",
    jsx: true,
    sourceType: "module",
  });
}

function findTaggedTemplate(program: TSESTree.Program): TSESTree.TaggedTemplateExpression | null {
  let result: TSESTree.TaggedTemplateExpression | null = null;

  walk(
    program as TSESTree.Node,
    {},
    {
      [AST_NODE_TYPES.TaggedTemplateExpression]: (node, { stop }) => {
        result = node;
        return stop();
      },
    },
  );

  return result;
}

describe("prepareStyledJSXModule", () => {
  describe("default import", () => {
    const testCases: TestCase[] = [
      {
        code: `
          import css from "styled-jsx/css";
          const styles = css\`.class { color: red; }\`;
        `,
        expectedTag: "css",
        name: "should resolve css tag",
      },
      {
        code: `
          import css from "styled-jsx/css";
          const styles = css.global\`.class { color: red; }\`;
        `,
        expectedTag: "css.global",
        name: "should resolve css.global tag",
      },
      {
        code: `
          import css from "styled-jsx/css";
          const styles = css.resolve\`.class { color: red; }\`;
        `,
        expectedTag: "css.resolve",
        name: "should resolve css.resolve tag",
      },
      {
        code: `
          import customCss from "styled-jsx/css";
          const styles = customCss\`.class { color: red; }\`;
        `,
        expectedTag: "css",
        name: "should resolve aliased default import",
      },
    ];

    it.each(testCases)("$name", ({ code, expectedTag }) => {
      const ast = parseCode(code);
      const module = prepareStyledJSXModule(ast);
      const taggedTemplate = findTaggedTemplate(ast);
      assert.isNotNull(taggedTemplate);

      const result = module.resolveTag(taggedTemplate);
      assert.isNotFalse(result);
      expect(result.type).toBe(expectedTag);
    });
  });

  describe("named import", () => {
    const testCases: TestCase[] = [
      {
        code: `
          import { global } from "styled-jsx/css";
          const styles = global\`.class { color: red; }\`;
        `,
        expectedTag: "css.global",
        name: "should resolve global tag",
      },
      {
        code: `
          import { resolve } from "styled-jsx/css";
          const styles = resolve\`.class { color: red; }\`;
        `,
        expectedTag: "css.resolve",
        name: "should resolve resolve tag",
      },
      {
        code: `
          import { global as g } from "styled-jsx/css";
          const styles = g\`.class { color: red; }\`;
        `,
        expectedTag: "css.global",
        name: "should resolve aliased global tag",
      },
      {
        code: `
          import { resolve as r } from "styled-jsx/css";
          const styles = r\`.class { color: red; }\`;
        `,
        expectedTag: "css.resolve",
        name: "should resolve aliased resolve tag",
      },
    ];

    test.each(testCases)("$name", ({ code, expectedTag }) => {
      const ast = parseCode(code);
      const module = prepareStyledJSXModule(ast);
      const taggedTemplate = findTaggedTemplate(ast);
      assert.isNotNull(taggedTemplate);

      const result = module.resolveTag(taggedTemplate);
      assert.isNotFalse(result);
      expect(result.type).toBe(expectedTag);
    });
  });

  describe("namespace import", () => {
    const testCases: TestCase[] = [
      {
        code: `
          import * as styledJsx from "styled-jsx/css";
          const styles = styledJsx.default\`.class { color: red; }\`;
        `,
        expectedTag: "css",
        name: "should resolve styledJsx.default tag",
      },
      {
        code: `
          import * as styledJsx from "styled-jsx/css";
          const styles = styledJsx.global\`.class { color: red; }\`;
        `,
        expectedTag: "css.global",
        name: "should resolve styledJsx.global tag",
      },
      {
        code: `
          import * as styledJsx from "styled-jsx/css";
          const styles = styledJsx.resolve\`.class { color: red; }\`;
        `,
        expectedTag: "css.resolve",
        name: "should resolve styledJsx.resolve tag",
      },
    ];

    test.each(testCases)("$name", ({ code, expectedTag }) => {
      const ast = parseCode(code);
      const module = prepareStyledJSXModule(ast);
      const taggedTemplate = findTaggedTemplate(ast);

      assert.isNotNull(taggedTemplate);
      const result = module.resolveTag(taggedTemplate);
      assert.isNotFalse(result);
      expect(result.type).toBe(expectedTag);
    });
  });

  describe("negative cases", () => {
    const testCases: TestCase[] = [
      {
        code: `
          import css from "styled-jsx/css";
          const html = unrelatedTag\`.class { color: red; }\`;
        `,
        expectedTag: false,
        name: "should return false for unrelated tag",
      },
      {
        code: `
          const styles = css\`.class { color: red; }\`;
        `,
        expectedTag: false,
        name: "should return false for tag without styled-jsx import",
      },
      {
        code: `
          import css from "other-lib";
          const styles = css\`.class { color: red; }\`;
        `,
        expectedTag: false,
        name: "should return false for wrong import source",
      },
      {
        code: `
          import css from "styled-jsx/css";
          const styles = css.unknown\`.class { color: red; }\`;
        `,
        expectedTag: false,
        name: "should return false for member expression on wrong import",
      },
    ];

    test.each(testCases)("$name", ({ code, expectedTag }) => {
      const ast = parseCode(code);
      const module = prepareStyledJSXModule(ast);
      const taggedTemplate = findTaggedTemplate(ast);

      assert.isNotNull(taggedTemplate);
      const result = module.resolveTag(taggedTemplate);

      expect(result).toBe(expectedTag);
    });
  });
});
