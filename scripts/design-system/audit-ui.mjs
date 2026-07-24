#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const SOURCE_DIRECTORIES = ["src"];
const SOURCE_FILES = ["tailwind.config.js", "vite.config.ts", "index.html"];
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js", ".jsx", ".ts", ".tsx"]);
const MAX_LOCATIONS = 8;

const toPosix = (value) => value.split(path.sep).join("/");

const countMatches = (text, expression) => {
  const matches = text.match(expression);
  return matches ? matches.length : 0;
};

const lineNumberAt = (text, index) => text.slice(0, index).split("\n").length;

const escapeCell = (value) =>
  String(value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .replace(/\s+/g, " ")
    .trim();

const inlineCode = (value) => `\`${String(value).replaceAll("`", "\\`")}\``;

const stripComments = (input) => {
  let output = "";
  let state = "code";
  let quote = "";

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (state === "line-comment") {
      if (character === "\n") {
        output += "\n";
        state = "code";
      } else {
        output += " ";
      }
      continue;
    }

    if (state === "block-comment") {
      if (character === "*" && next === "/") {
        output += "  ";
        index += 1;
        state = "code";
      } else {
        output += character === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (state === "string") {
      output += character;
      if (character === "\\") {
        if (next !== undefined) {
          output += next;
          index += 1;
        }
      } else if (character === quote) {
        state = "code";
      }
      continue;
    }

    if (character === "'" || character === '"' || character === "`") {
      output += character;
      quote = character;
      state = "string";
    } else if (character === "/" && next === "/") {
      output += "  ";
      index += 1;
      state = "line-comment";
    } else if (character === "/" && next === "*") {
      output += "  ";
      index += 1;
      state = "block-comment";
    } else {
      output += character;
    }
  }

  return output;
};

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["__tests__", "test", "tests"].includes(entry.name)) continue;
      files.push(...(await walk(absolutePath)));
    } else if (
      SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
      !entry.name.endsWith(".d.ts") &&
      !/\.(?:test|spec)\.[^.]+$/.test(entry.name)
    ) {
      files.push(absolutePath);
    }
  }

  return files;
};

const loadSources = async () => {
  const paths = [];

  for (const directory of SOURCE_DIRECTORIES) {
    const absoluteDirectory = path.join(REPO_ROOT, directory);
    try {
      paths.push(...(await walk(absoluteDirectory)));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  for (const file of SOURCE_FILES) {
    const absolutePath = path.join(REPO_ROOT, file);
    try {
      const stat = await fs.stat(absolutePath);
      if (stat.isFile()) paths.push(absolutePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const uniquePaths = [...new Set(paths)].sort();
  return Promise.all(
    uniquePaths.map(async (absolutePath) => {
      const rawText = await fs.readFile(absolutePath, "utf8");
      return {
        absolutePath,
        path: toPosix(path.relative(REPO_ROOT, absolutePath)),
        text: stripComments(rawText),
      };
    }),
  );
};

const addOccurrence = (groups, value, file, line) => {
  const key = value.toLowerCase();
  const current = groups.get(key) ?? {
    value,
    count: 0,
    files: new Set(),
    locations: [],
  };

  current.count += 1;
  current.files.add(file);
  current.locations.push(`${file}:${line}`);
  groups.set(key, current);
};

const collectLineMatches = (sources, expression, normalize = (value) => value) => {
  const groups = new Map();

  for (const source of sources) {
    source.text.split("\n").forEach((lineText, index) => {
      const matcher = new RegExp(expression.source, expression.flags.includes("g") ? expression.flags : `${expression.flags}g`);
      for (const match of lineText.matchAll(matcher)) {
        const value = normalize(match[0], match);
        if (value) addOccurrence(groups, value, source.path, index + 1);
      }
    });
  }

  return groups;
};

const mergeGroups = (...groupSets) => {
  const merged = new Map();

  for (const groups of groupSets) {
    for (const group of groups.values()) {
      for (const location of group.locations) {
        const separator = location.lastIndexOf(":");
        addOccurrence(
          merged,
          group.value,
          location.slice(0, separator),
          Number(location.slice(separator + 1)),
        );
      }
    }
  }

  return merged;
};

const sortedGroups = (groups) =>
  [...groups.values()].sort(
    (left, right) =>
      right.count - left.count ||
      left.value.localeCompare(right.value, undefined, { sensitivity: "base" }),
  );

const formatLocations = (group) => {
  const unique = [...new Set(group.locations)].sort();
  const visible = unique.slice(0, MAX_LOCATIONS).map(inlineCode);
  const remaining = unique.length - visible.length;
  return `${visible.join("<br>")}${remaining > 0 ? `<br>+${remaining} more` : ""}`;
};

const renderGroupedTable = (groups, emptyMessage = "None detected.") => {
  const rows = sortedGroups(groups);
  if (rows.length === 0) return `${emptyMessage}\n`;

  return [
    "| Value | Occurrences | Files | Locations |",
    "|---|---:|---:|---|",
    ...rows.map(
      (group) =>
        `| ${inlineCode(escapeCell(group.value))} | ${group.count} | ${group.files.size} | ${formatLocations(group)} |`,
    ),
    "",
  ].join("\n");
};

const collectColorUtilities = (sources) => {
  const groups = new Map();
  const typographyTextTokens = /^(?:xs|sm|md|base|lg|xl|[2-9]xl)$/;
  const nonColorValues = {
    bg: /^(?:none|fixed|local|scroll|clip-|origin-|repeat|no-repeat|repeat-|cover|contain|auto|center|top|right|bottom|left|color|image|position|size|attachment)/,
    border:
      /^(?:[trblxy](?:-\d+)?|0|2|4|8|none|solid|dashed|dotted|double|collapse|separate|radius|color|width|style)$/,
    fill: /^(?:none|rule|opacity)/,
    outline: /^(?:none|0|1|2|4|8|dashed|dotted|double|offset-|color|style|width)/,
    ring: /^(?:0|1|2|4|8|inset|offset-)/,
    stroke: /^(?:none|width|dash|line|opacity)/,
    text: /^(?:center|left|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|opacity-|decoration|transform|indent|overflow)/,
  };
  const expression =
    /\b(?:bg|text|border|ring|outline|fill|stroke)-(?:[a-z][\w-]*(?:\/\d+)?|\[[^\]\s"'`]+\])/gi;

  for (const source of sources) {
    source.text.split("\n").forEach((lineText, index) => {
      for (const match of lineText.matchAll(expression)) {
        const token = match[0];
        const separator = token.indexOf("-");
        const prefix = token.slice(0, separator);
        const tokenValue = token.slice(separator + 1);
        if (token.startsWith("text-")) {
          const isArbitraryTypography =
            tokenValue.startsWith("[") &&
            /(?:\d|var\(|clamp\(|min\(|max\()/.test(tokenValue);
          if (typographyTextTokens.test(tokenValue) || isArbitraryTypography) continue;
        }
        if (nonColorValues[prefix]?.test(tokenValue)) continue;
        addOccurrence(groups, token, source.path, index + 1);
      }
    });
  }

  return groups;
};

const collectCssVariableColors = (sources) =>
  collectLineMatches(
    sources.filter((source) => source.path.endsWith(".css")),
    /--[\w-]*(?:color|background|surface|text|border|brand|status|primary|secondary|muted|accent|destructive)[\w-]*\s*:/gi,
    (value) => value.slice(0, value.lastIndexOf(":")).trim(),
  );

const collectIcons = (sources) => {
  const groups = new Map();
  const importExpression =
    /import\s*\{([^}]*)\}\s*from\s*["'](ionicons\/icons|lucide-react)["'];?/g;

  for (const source of sources) {
    for (const match of source.text.matchAll(importExpression)) {
      const line = lineNumberAt(source.text, match.index);
      const library = match[2];
      const names = match[1]
        .split(",")
        .map((name) => name.trim().split(/\s+as\s+/i)[0]?.trim())
        .filter(Boolean);

      for (const name of names) {
        addOccurrence(groups, `${library}: ${name}`, source.path, line);
      }
    }
  }

  return groups;
};

const componentNameFor = (file) => {
  const extension = path.extname(file.path);
  const basename = path.basename(file.path, extension);
  return basename.toLowerCase() === "index"
    ? path.basename(path.dirname(file.path))
    : basename;
};

const collectDuplicateComponents = (sources) => {
  const groups = new Map();

  for (const source of sources) {
    if (!source.path.endsWith(".tsx") || /\.(?:test|spec)\.tsx$/.test(source.path)) continue;
    if (!source.path.startsWith("src/components/") && !source.path.startsWith("src/pages/")) continue;

    const name = componentNameFor(source);
    const key = name.toLowerCase();
    const current = groups.get(key) ?? { name, paths: [] };
    current.paths.push(source.path);
    groups.set(key, current);
  }

  return [...groups.values()]
    .filter((group) => group.paths.length > 1)
    .sort((left, right) => right.paths.length - left.paths.length || left.name.localeCompare(right.name));
};

const selectorRisk = (selector) => {
  if (selector.includes(".ds-root")) return null;
  if (/^:root\b/.test(selector)) return "root-wide variable scope";
  if (/^\*/.test(selector)) return "universal selector";
  if (/^(?:html|body)\b/.test(selector)) return "document-wide element selector";
  if (/^(?:button|input|select|textarea|a|label|form)\b/.test(selector)) {
    return "unscoped native element selector";
  }
  if (/^ion-[\w-]+\b/.test(selector)) return "unscoped Ionic element selector";
  if (/^\.(?:bg|text|border|shadow|rounded)-[\w-]+\b/.test(selector)) {
    return "global utility-like class";
  }
  if (/^\.(?:native-input|ripple-parent|fixed-bottom-buttons)\b/.test(selector)) {
    return "generic global class";
  }
  return null;
};

const collectLeakageRisks = (sources) => {
  const risks = [];

  for (const source of sources.filter((item) => item.path.endsWith(".css"))) {
    const withoutComments = source.text.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
      comment.replace(/[^\n]/g, " "),
    );
    const expression = /([^{}]+)\{/g;

    for (const match of withoutComments.matchAll(expression)) {
      const block = match[1].trim();
      if (!block || block.startsWith("@") || /^(?:from|to|\d+%)$/.test(block)) continue;

      for (const rawSelector of block.split(",")) {
        const selector = rawSelector.trim().replace(/\s+/g, " ");
        const reason = selectorRisk(selector);
        if (!reason) continue;
        const rawSelectorOffset =
          match[0].indexOf(rawSelector) + Math.max(0, rawSelector.search(/\S/));
        risks.push({
          file: source.path,
          line: lineNumberAt(withoutComments, match.index + rawSelectorOffset),
          selector,
          reason,
        });
      }
    }
  }

  return risks.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.selector.localeCompare(right.selector),
  );
};

const collectLongListCandidates = (sources) => {
  const candidates = [];

  for (const source of sources.filter(
    (item) => item.path.startsWith("src/pages/") && item.path.endsWith(".tsx"),
  )) {
    const signals = {
      infiniteScroll: countMatches(source.text, /\bIonInfiniteScroll\b/g),
      ionList: countMatches(source.text, /<IonList\b/g),
      renderedMaps: countMatches(source.text, /\.map\s*\(/g),
      overflowScroll: countMatches(source.text, /overflow-y-(?:auto|scroll)|overflowY/g),
      pagination: countMatches(source.text, /\b(?:hasMore|loadMore|pageSize|currentPage)\b/g),
    };
    const listNamed = /List(?:\/|\.tsx$)/.test(source.path);
    const isCandidate =
      signals.infiniteScroll > 0 ||
      (signals.overflowScroll > 0 && signals.renderedMaps > 0) ||
      (signals.ionList > 0 && signals.renderedMaps > 0) ||
      (listNamed && signals.renderedMaps > 0 && signals.pagination > 0);

    if (isCandidate) candidates.push({ path: source.path, signals });
  }

  return candidates.sort(
    (left, right) =>
      right.signals.infiniteScroll - left.signals.infiniteScroll ||
      right.signals.renderedMaps - left.signals.renderedMaps ||
      left.path.localeCompare(right.path),
  );
};

const renderDuplicateComponents = (groups) => {
  if (groups.length === 0) return "None detected.\n";
  return [
    "| Logical name | Implementations | Paths |",
    "|---|---:|---|",
    ...groups.map(
      (group) =>
        `| ${inlineCode(group.name)} | ${group.paths.length} | ${group.paths
          .sort()
          .map(inlineCode)
          .join("<br>")} |`,
    ),
    "",
  ].join("\n");
};

const renderLeakageRisks = (risks) => {
  if (risks.length === 0) return "None detected.\n";
  return [
    "| Selector | Risk | Location |",
    "|---|---|---|",
    ...risks.map(
      (risk) =>
        `| ${inlineCode(escapeCell(risk.selector))} | ${escapeCell(risk.reason)} | ${inlineCode(`${risk.file}:${risk.line}`)} |`,
    ),
    "",
  ].join("\n");
};

const renderLongListCandidates = (candidates) => {
  if (candidates.length === 0) return "None detected.\n";
  return [
    "| Screen/source | Infinite scroll refs | IonList nodes | `.map()` calls | Nested-scroll refs | Pagination refs |",
    "|---|---:|---:|---:|---:|---:|",
    ...candidates.map(
      ({ path: file, signals }) =>
        `| ${inlineCode(file)} | ${signals.infiniteScroll} | ${signals.ionList} | ${signals.renderedMaps} | ${signals.overflowScroll} | ${signals.pagination} |`,
    ),
    "",
  ].join("\n");
};

const buildInventory = (sources) => {
  const rawColors = collectLineMatches(
    sources,
    /#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\(\s*var\([^)\n]+\)[^)\n]*\)|(?:rgb|hsl)a?\([^)\n]+\)/gi,
    (value) => value.toLowerCase().replace(/\s+/g, " "),
  );
  const colorUtilities = collectColorUtilities(sources);
  const cssColorVariables = collectCssVariableColors(sources);

  const typography = mergeGroups(
    collectLineMatches(
      sources,
      /\b(?:text-(?:xs|sm|md|base|lg|xl|[2-9]xl|\[[^\]\s]+\])|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[[^\]\s]+\])|leading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]\s]+\])|tracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]\s]+\]))\b/g,
    ),
    collectLineMatches(
      sources.filter((source) => source.path.endsWith(".css")),
      /(?:font-size|font-weight|line-height|letter-spacing)\s*:\s*[^;}{]+/gi,
      (value) => value.replace(/\s+/g, " ").trim(),
    ),
  );

  const spacing = mergeGroups(
    collectLineMatches(
      sources,
      /-?(?:p[trblxy]?|m[trblxy]?|space-[xy]|gap[xy]?|inset[xy]?|top|right|bottom|left)-(?:\d+(?:\.\d+)?|px|auto|full|\[[^\]\s]+\])\b/g,
    ),
    collectLineMatches(
      sources.filter((source) => source.path.endsWith(".css")),
      /(?:margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|gap|row-gap|column-gap)\s*:\s*[^;}{]+/gi,
      (value) => value.replace(/\s+/g, " ").trim(),
    ),
  );

  const radii = mergeGroups(
    collectLineMatches(sources, /\brounded(?:-[trbl]{1,2})?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]\s]+\]))?\b/g),
    collectLineMatches(
      sources.filter((source) => source.path.endsWith(".css")),
      /(?:--border-radius|border-radius)\s*:\s*[^;}{]+/gi,
      (value) => value.replace(/\s+/g, " ").trim(),
    ),
  );

  const elevation = mergeGroups(
    collectLineMatches(
      sources,
      /\bshadow(?:-(?:none|sm|md|lg|xl|2xl|inner|\[[^\]\s]+\]))?\b/g,
    ),
    collectLineMatches(
      sources.filter((source) => source.path.endsWith(".css")),
      /(?:--box-shadow|box-shadow)\s*:\s*[^;}{]+/gi,
      (value) => value.replace(/\s+/g, " ").trim(),
    ),
  );

  const motion = mergeGroups(
    collectLineMatches(
      sources,
      /\b(?:transition(?:-[\w[\].(),%-]+)?|duration-(?:\d+|\[[^\]\s]+\])|ease-[\w-]+|animate-[\w-]+|motion-(?:reduce|safe):[\w-]+)\b/g,
    ),
    collectLineMatches(
      sources.filter((source) => source.path.endsWith(".css")),
      /(?:transition(?:-[\w-]+)?|animation(?:-[\w-]+)?)\s*:\s*[^;}{]+/gi,
      (value) => value.replace(/\s+/g, " ").trim(),
    ),
  );

  const icons = collectIcons(sources);
  const duplicates = collectDuplicateComponents(sources);
  const leakageRisks = collectLeakageRisks(sources);
  const longLists = collectLongListCandidates(sources);
  const sourceBreakdown = sources.reduce((groups, source) => {
    const extension = path.extname(source.path) || "(none)";
    groups.set(extension, (groups.get(extension) ?? 0) + 1);
    return groups;
  }, new Map());

  const summary = [
    ["Source files", sources.length],
    ["Raw color literal occurrences", sortedGroups(rawColors).reduce((sum, group) => sum + group.count, 0)],
    ["Unique raw color literals", rawColors.size],
    ["Named color utility usages", sortedGroups(colorUtilities).reduce((sum, group) => sum + group.count, 0)],
    ["Typography variants", typography.size],
    ["Spacing variants", spacing.size],
    ["Radius variants", radii.size],
    ["Elevation variants", elevation.size],
    ["Motion variants", motion.size],
    ["Imported icon symbols", icons.size],
    ["Duplicate component families", duplicates.length],
    ["Leakage-risk selectors", leakageRisks.length],
    ["Long-list candidates", longLists.length],
  ];

  return [
    "# UI and Style Inventory",
    "",
    "> Generated by `node scripts/design-system/audit-ui.mjs --write docs/design-system/inventory.md`.",
    "> Baseline scope: runtime source under `src/` plus `tailwind.config.js`, `vite.config.ts`, and `index.html`.",
    "> Test/spec/declaration files and comments are excluded from runtime counts.",
    "> Counts describe current Legacy code. They are inventory evidence, not migration authorization.",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "|---|---:|",
    ...summary.map(([label, count]) => `| ${label} | ${count} |`),
    "",
    `Source mix: ${[...sourceBreakdown.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([extension, count]) => `${inlineCode(extension)} ${count}`)
      .join(", ")}.`,
    "",
    "## Colors",
    "",
    "### Raw color literals",
    "",
    renderGroupedTable(rawColors),
    "### Named color utilities",
    "",
    renderGroupedTable(colorUtilities),
    "### Color-related CSS variables",
    "",
    renderGroupedTable(cssColorVariables),
    "## Typography",
    "",
    renderGroupedTable(typography),
    "## Spacing",
    "",
    renderGroupedTable(spacing),
    "## Radius",
    "",
    renderGroupedTable(radii),
    "## Elevation",
    "",
    renderGroupedTable(elevation),
    "## Motion",
    "",
    renderGroupedTable(motion),
    "## Icons",
    "",
    renderGroupedTable(icons),
    "## Duplicate Component Families",
    "",
    "Logical name uses the file name, or the parent directory for `index.tsx` components.",
    "",
    renderDuplicateComponents(duplicates),
    "## Leakage-risk Selectors",
    "",
    "Selectors are flagged when they can affect document-wide native/Ionic elements, root scope, or generic utility names. Existing findings remain Legacy debt; new Design System CSS must not add to this list.",
    "",
    renderLeakageRisks(leakageRisks),
    "## Long-list Candidates",
    "",
    "Candidates use static signals only. Measure real DOM, scroll ownership and long tasks before adding virtualization.",
    "",
    renderLongListCandidates(longLists),
    "## Baseline Interpretation",
    "",
    "- Raw literals and broad selectors outside Design System remain Legacy inventory; this feature does not rewrite them.",
    "- New Design System code must use namespaced semantic tokens and scoped `.ds-*`/`.ds-root` selectors.",
    "- Duplicate component families identify future consolidation opportunities; this feature does not migrate production screens.",
    "- Long-list candidates require fixed-device performance measurements before optimization.",
    "",
  ].join("\n");
};

const parseArguments = () => {
  const args = process.argv.slice(2);
  let outputPath = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--write") {
      outputPath = args[index + 1];
      if (!outputPath) throw new Error("Missing path after --write");
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      console.log("Usage: node scripts/design-system/audit-ui.mjs [--write <repo-relative-path>]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return { outputPath };
};

const main = async () => {
  const { outputPath } = parseArguments();
  const sources = await loadSources();
  const inventory = buildInventory(sources);

  if (!outputPath) {
    process.stdout.write(inventory);
    return;
  }

  const absoluteOutput = path.resolve(REPO_ROOT, outputPath);
  const relativeOutput = path.relative(REPO_ROOT, absoluteOutput);
  if (relativeOutput.startsWith("..") || path.isAbsolute(relativeOutput)) {
    throw new Error("--write path must stay inside the repository");
  }

  await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
  await fs.writeFile(absoluteOutput, inventory, "utf8");
  console.log(`Wrote ${toPosix(relativeOutput)}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
