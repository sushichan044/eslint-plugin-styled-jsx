import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { extractModuleImports } from "./utils";

interface StyledJsxImportInfo {
  /**
   * The local name of the default import, or null if not imported.
   *
   * @example
   * ```ts
   * import css from "styled-jsx/css";
   *
   * // defaultImportName = "css"
   * ```
   */
  defaultImportName: string | null;
  /**
   * Mapping from local names to named exports (e.g., global, resolve).
   *
   * @example
   * ```ts
   * import { global as myGlobal, resolve } from "styled-jsx/css";
   *
   * // localNameToNamedExport = {
   * //   myGlobal: "global",
   * //   resolve: "resolve",
   * // }
   * ```
   */
  localNameToNamedExport: Record<string, "global" | "resolve">;
  /**
   * The local name of the namespace import, or null if not imported.
   *
   * @example
   * ```ts
   * import * as styledJsx from "styled-jsx/css";
   *
   * // namespaceImportName = "styledJsx"
   * ```
   */
  namespaceImportName: string | null;
}

export type StyledJSXTag = "css" | "css.global" | "css.resolve";

export interface StyledJSXModule {
  resolveTag(node: TSESTree.TaggedTemplateExpression): false | StyledJSXTag;
}

/**
 * Prepare information about styled-jsx/css imports in the given program.
 *
 * @param program The AST node of the program
 * @returns An object that can resolve styled-jsx/css tags
 */
export function prepareStyledJSXModule(program: Readonly<TSESTree.Program>): StyledJSXModule {
  const imports = extractModuleImports(program, "styled-jsx/css");

  const info: StyledJsxImportInfo = {
    defaultImportName: null,
    localNameToNamedExport: {},
    namespaceImportName: null,
  };

  for (const importDecl of imports) {
    for (const specifier of importDecl.specifiers) {
      switch (specifier.type) {
        case AST_NODE_TYPES.ImportDefaultSpecifier: {
          info.defaultImportName = specifier.local.name;
          break;
        }
        case AST_NODE_TYPES.ImportNamespaceSpecifier: {
          info.namespaceImportName = specifier.local.name;
          break;
        }
        case AST_NODE_TYPES.ImportSpecifier: {
          const imported = specifier.imported;
          const importedName =
            imported.type === AST_NODE_TYPES.Identifier ? imported.name : imported.value;
          const localName = specifier.local.name;
          if (importedName === "global" || importedName === "resolve") {
            info.localNameToNamedExport[localName] = importedName;
          }
          break;
        }
        default: {
          specifier satisfies never;
        }
      }
    }
  }

  return {
    resolveTag: (node) => {
      /**
       * Handle Identifier tag
       *
       * ```ts
       * import css from "styled-jsx/css";
       *
       * const styles = css`...`; // Identifier
       * ```
       */
      if (node.tag.type === AST_NODE_TYPES.Identifier) {
        const tagName = node.tag.name;

        if (info.defaultImportName !== null && tagName === info.defaultImportName) {
          return "css";
        }

        const importedName = info.localNameToNamedExport[tagName];
        if (importedName != null) {
          return `css.${importedName}`;
        }

        return false;
      }

      /**
       * Handle MemberExpression tag
       *
       * ```ts
       * import css from "styled-jsx/css";
       *
       * const styles = css.global`...`; // MemberExpression
       * const styles = css.resolve`...`; // MemberExpression
       *
       * import * as styledJsx from "styled-jsx/css";
       *
       * const styles = styledJsx.default`...`; // MemberExpression
       * ```
       */
      if (
        node.tag.type === AST_NODE_TYPES.MemberExpression &&
        node.tag.object.type === AST_NODE_TYPES.Identifier &&
        node.tag.property.type === AST_NODE_TYPES.Identifier
      ) {
        const tagName = node.tag.property.name;
        const objectName = node.tag.object.name;

        if (info.defaultImportName !== null && objectName === info.defaultImportName) {
          switch (tagName) {
            case "global":
              return "css.global";
            case "resolve":
              return "css.resolve";
            default:
              return false;
          }
        }
        if (info.namespaceImportName !== null && objectName === info.namespaceImportName) {
          switch (tagName) {
            case "default":
              return "css";
            case "global":
              return "css.global";
            case "resolve":
              return "css.resolve";
            default:
              return false;
          }
        }
      }

      return false;
    },
  };
}
