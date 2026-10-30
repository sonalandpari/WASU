import * as ts from "typescript";

export interface ExtractedDependency {
  rawSpecifier: string;
  isDynamic: boolean;
  isTypeOnly: boolean;
  specifiers: string[];
}

export interface ExtractedSourceMetadata {
  filePath: string;
  imports: ExtractedDependency[];
  exports: string[];
  reExports: ExtractedDependency[];
}

/**
 * Parses source code into an AST using TypeScript Compiler API
 * and extracts all imports, dynamic imports, exports, and re-exports.
 */
export function extractDependenciesFromSource(
  filePath: string,
  sourceCode: string
): ExtractedSourceMetadata {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const imports: ExtractedDependency[] = [];
  const exports: string[] = [];
  const reExports: ExtractedDependency[] = [];

  function visit(node: ts.Node): void {
    // 1. Static Import Declarations: import { x } from './foo';
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const rawSpecifier = node.moduleSpecifier.text;
        const isTypeOnly = node.importClause?.isTypeOnly ?? false;
        const specifiers: string[] = [];

        if (node.importClause) {
          if (node.importClause.name) {
            specifiers.push(node.importClause.name.text); // default import
          }
          if (node.importClause.namedBindings) {
            if (ts.isNamespaceImport(node.importClause.namedBindings)) {
              specifiers.push(node.importClause.namedBindings.name.text);
            } else if (ts.isNamedImports(node.importClause.namedBindings)) {
              for (const element of node.importClause.namedBindings.elements) {
                specifiers.push(element.name.text);
              }
            }
          }
        }

        imports.push({
          rawSpecifier,
          isDynamic: false,
          isTypeOnly,
          specifiers
        });
      }
    }

    // 2. Dynamic imports: import('./foo') or require('./foo')
    else if (ts.isCallExpression(node)) {
      // Dynamic import()
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          imports.push({
            rawSpecifier: arg.text,
            isDynamic: true,
            isTypeOnly: false,
            specifiers: []
          });
        }
      }
      // CommonJS require()
      else if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require"
      ) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          imports.push({
            rawSpecifier: arg.text,
            isDynamic: true,
            isTypeOnly: false,
            specifiers: []
          });
        }
      }
    }

    // 3. Export Declarations: export { x } from './foo' or export { x };
    else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        // Re-export from another file
        const rawSpecifier = node.moduleSpecifier.text;
        const isTypeOnly = node.isTypeOnly;
        const specifiers: string[] = [];

        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            specifiers.push(element.name.text);
          }
        }

        reExports.push({
          rawSpecifier,
          isDynamic: false,
          isTypeOnly,
          specifiers
        });
      } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          exports.push(element.name.text);
        }
      }
    }

    // 4. Direct exports: export function foo() {}, export const bar = 1;
    else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.name) {
        exports.push(node.name.text);
      }
    } else if (ts.isVariableStatement(node)) {
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push(decl.name.text);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    filePath,
    imports,
    exports,
    reExports
  };
}

