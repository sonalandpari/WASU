import test from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import * as fs from "fs";
import { discoverWorkspaceFiles } from "../scanner";
import { extractDependenciesFromSource } from "../astExtractor";
import { resolveDependencyPath } from "../resolver";

test("discoverWorkspaceFiles respects exclusions and supported extensions", () => {
  const root = path.resolve(__dirname, "../../");
  const files = discoverWorkspaceFiles({
    workspaceRoot: root,
    supportedExtensions: [".ts", ".json"],
    excludePatterns: ["node_modules", "dist"]
  });

  assert.ok(files.length > 0);
  assert.ok(files.some(f => f.endsWith("src/scanner.ts")));
  assert.ok(!files.some(f => f.includes("dist/")));
  assert.ok(!files.some(f => f.includes("node_modules")));
});

test("extractDependenciesFromSource accurately extracts static, dynamic and re-exports", () => {
  const sampleCode = `
    import { UserService, AuthState } from './services/user';
    import React from 'react';
    import type { Token } from './types';
    export { Component } from './component';
    export const PI = 3.14;

    export async function loadModule() {
      const dynamicMod = await import('./dynamicService');
      const cjs = require('./cjsModule');
      return dynamicMod;
    }
  `;

  const result = extractDependenciesFromSource("test.ts", sampleCode);

  assert.equal(result.imports.length, 5); // ./services/user, react, ./types, ./dynamicService, ./cjsModule
  
  const userImport = result.imports.find(i => i.rawSpecifier === "./services/user");
  assert.ok(userImport);
  assert.deepEqual(userImport?.specifiers, ["UserService", "AuthState"]);
  assert.equal(userImport?.isDynamic, false);

  const dynamicImport = result.imports.find(i => i.rawSpecifier === "./dynamicService");
  assert.ok(dynamicImport);
  assert.equal(dynamicImport?.isDynamic, true);

  const typeImport = result.imports.find(i => i.rawSpecifier === "./types");
  assert.ok(typeImport);
  assert.equal(typeImport?.isTypeOnly, true);

  assert.equal(result.reExports.length, 1);
  assert.equal(result.reExports[0].rawSpecifier, "./component");

  assert.ok(result.exports.includes("PI"));
  assert.ok(result.exports.includes("loadModule"));
});

test("resolveDependencyPath resolves extensions and index files correctly", () => {
  const tempDir = path.join(__dirname, "temp_test_dir");
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.join(tempDir, "services"), { recursive: true });
  fs.mkdirSync(path.join(tempDir, "utils"), { recursive: true });

  fs.writeFileSync(path.join(tempDir, "services", "user.ts"), "export const a = 1;");
  fs.writeFileSync(path.join(tempDir, "utils", "index.ts"), "export const b = 2;");
  fs.writeFileSync(path.join(tempDir, "main.ts"), "import './services/user'; import './utils';");

  try {
    // 1. Relative without extension -> finds .ts
    const userRes = resolveDependencyPath(tempDir, "main.ts", "./services/user");
    assert.equal(userRes.resolvedRelativePath, "services/user.ts");
    assert.equal(userRes.isExternalPackage, false);

    // 2. Directory without file -> finds /index.ts
    const utilsRes = resolveDependencyPath(tempDir, "main.ts", "./utils");
    assert.equal(utilsRes.resolvedRelativePath, "utils/index.ts");
    assert.equal(utilsRes.isExternalPackage, false);

    // 3. External package -> correctly identified
    const reactRes = resolveDependencyPath(tempDir, "main.ts", "react");
    assert.equal(reactRes.isExternalPackage, true);
    assert.equal(reactRes.resolvedRelativePath, null);

    // 4. Missing relative -> null path, not external
    const missingRes = resolveDependencyPath(tempDir, "main.ts", "./missing");
    assert.equal(missingRes.resolvedRelativePath, null);
    assert.equal(missingRes.isExternalPackage, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

