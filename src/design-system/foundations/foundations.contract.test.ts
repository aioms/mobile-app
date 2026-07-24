import {
  existsSync,
  readFileSync,
  readdirSync,
  type Dirent,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const foundationsDirectory = dirname(fileURLToPath(import.meta.url));
const designSystemDirectory = resolve(foundationsDirectory, "..");

const foundationFiles = [
  "tokens.css",
  "typography.css",
  "motion.css",
  "elevation.css",
  "ionic-theme.css",
  "index.css",
] as const;

const tokenSourceFiles = new Set([
  "tokens.css",
  "typography.css",
  "motion.css",
  "elevation.css",
]);

const semanticCategories = [
  "--ds-color-brand-",
  "--ds-color-background-",
  "--ds-color-surface-",
  "--ds-color-text-",
  "--ds-color-border-",
  "--ds-color-status-",
  "--ds-font-",
  "--ds-space-",
  "--ds-radius-",
  "--ds-shadow-",
  "--ds-motion-",
  "--ds-layout-",
  "--ds-safe-area-",
] as const;

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "");

const readFoundation = (fileName: (typeof foundationFiles)[number]) => {
  const path = join(foundationsDirectory, fileName);
  expect(existsSync(path)).toBe(true);
  return readFileSync(path, "utf8");
};

const collectCssFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry: Dirent) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectCssFiles(path);
    }

    return entry.isFile() && entry.name.endsWith(".css") ? [path] : [];
  });

const declaredDsTokens = (source: string) =>
  Array.from(source.matchAll(/(--ds-[a-z0-9-]+)\s*:/gi), ([, name]) => name);

const referencedDsTokens = (source: string) =>
  Array.from(
    source.matchAll(/var\(\s*(--ds-[a-z0-9-]+)/gi),
    ([, name]) => name,
  );

describe("Design System foundation contract", () => {
  it("provides every required foundation file and semantic category", () => {
    const combinedSource = foundationFiles.map(readFoundation).join("\n");

    for (const category of semanticCategories) {
      expect(combinedSource).toContain(category);
    }
  });

  it("keeps Design System token declarations in the --ds-* namespace", () => {
    for (const fileName of foundationFiles) {
      if (fileName === "ionic-theme.css" || fileName === "index.css") {
        continue;
      }

      const source = stripComments(readFoundation(fileName));
      const customProperties = Array.from(
        source.matchAll(/(--[a-z0-9-]+)\s*:/gi),
        ([, name]) => name,
      );

      expect(customProperties.length).toBeGreaterThan(0);
      expect(customProperties.every((name) => name.startsWith("--ds-"))).toBe(
        true,
      );
    }
  });

  it("resolves every --ds-* reference to an approved declared token", () => {
    const sources = new Map(
      foundationFiles.map((fileName) => [
        fileName,
        stripComments(readFoundation(fileName)),
      ]),
    );
    const declarations = new Set(
      Array.from(sources.values()).flatMap(declaredDsTokens),
    );

    for (const source of sources.values()) {
      for (const reference of referencedDsTokens(source)) {
        expect(declarations.has(reference)).toBe(true);
      }
    }
  });

  it("scopes Ionic mappings to .ds-root and maps them only to DS tokens", () => {
    const source = stripComments(readFoundation("ionic-theme.css"));

    expect(source).toContain(".ds-root");
    expect(source).not.toMatch(
      /(?:^|})\s*(?::root|html|body|\*|button|input|ion-[a-z0-9-]+)(?=[\s,{:[>])/gim,
    );

    const ionicAssignments = Array.from(
      source.matchAll(/(--ion-[a-z0-9-]+)\s*:\s*([^;]+);/gi),
      ([, property, value]) => ({ property, value }),
    );

    expect(ionicAssignments.length).toBeGreaterThan(0);
    for (const { value } of ionicAssignments) {
      expect(value).toMatch(
        /^var\(\s*--ds-[a-z0-9-]+\s*(?:,[^)]+)?\)$/i,
      );
    }
  });

  it("defines a reduced-motion override that removes nonessential duration", () => {
    const source = stripComments(readFoundation("motion.css"));
    const reducedMotion = source.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{([\s\S]+)\}\s*$/i,
    );

    expect(reducedMotion).not.toBe(null);
    expect(reducedMotion?.[1]).toMatch(
      /--ds-motion-[a-z0-9-]+\s*:\s*0(?:ms|s)\s*;/i,
    );
  });

  it("rejects raw visual literals outside approved foundation token sources", () => {
    const rawVisualLiteral =
      /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(|\b\d*\.?\d+(?:px|rem|em|ms|s)\b/gi;

    for (const path of collectCssFiles(designSystemDirectory)) {
      const fileName = relative(foundationsDirectory, path);
      if (
        !fileName.startsWith("..") &&
        tokenSourceFiles.has(fileName)
      ) {
        continue;
      }

      const source = stripComments(readFileSync(path, "utf8"));
      expect(source.match(rawVisualLiteral) ?? []).toEqual([]);
    }
  });

  it("rejects unscoped global and Ionic selectors in Design System CSS", () => {
    const forbiddenGlobalSelector =
      /(?:^|})\s*(?::root|html|body|\*|button|input|select|textarea|ion-[a-z0-9-]+)(?=[\s,{:[>])/gim;

    for (const path of collectCssFiles(designSystemDirectory)) {
      const source = stripComments(readFileSync(path, "utf8"));
      expect(source.match(forbiddenGlobalSelector) ?? []).toEqual([]);
    }
  });

  it("composes the complete foundation entry without duplicate Tailwind roots", () => {
    const source = stripComments(readFoundation("index.css"));

    for (const fileName of foundationFiles) {
      if (fileName === "index.css") {
        continue;
      }
      expect(source).toMatch(
        new RegExp(
          `@import\\s+["']\\./${fileName.replace(".", "\\.")}["']\\s*;`,
        ),
      );
    }

    expect(source).not.toMatch(/@tailwind\s+(?:base|components|utilities)/i);
  });
});
