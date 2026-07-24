#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const defaultDistDirectory = resolve(repositoryRoot, "dist");
const defaultBaselinePath = resolve(
  repositoryRoot,
  "specs/001-build-design-system-foundation/baselines/bundle.json",
);

const usage = `Usage:
  node scripts/design-system/check-bundle-budget.mjs
  node scripts/design-system/check-bundle-budget.mjs --baseline <path>
  node scripts/design-system/check-bundle-budget.mjs --catalog-dist <path>
  node scripts/design-system/check-bundle-budget.mjs --write-baseline <path>

Options:
  --dist <path>             Vite output directory (default: dist)
  --catalog-dist <path>     Optional catalog build for separately reported delta
  --baseline <path>         Baseline used by candidate comparison
  --write-baseline <path>   Write current measurements as the baseline
  --max-regression <value>  Maximum production gzip regression percent (default: 5)
  --help                    Show this help
`;

const CATALOG_SOURCE_MARKERS = [
  "/internal/ui-kit",
  "uikitpage",
  "uikitsections",
  "uikitbenchmark",
];
const DEFAULT_MAX_REGRESSION_PERCENT = 5;

const fail = (message) => {
  console.error(`Bundle budget error: ${message}`);
  process.exitCode = 1;
};

const resolveFromRepository = (path) =>
  resolve(repositoryRoot, path || ".");

const parseArguments = (argumentsList) => {
  const options = {
    baselinePath: defaultBaselinePath,
    catalogDistDirectory: null,
    distDirectory: defaultDistDirectory,
    maxRegressionPercent: DEFAULT_MAX_REGRESSION_PERCENT,
    writeBaseline: false,
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (argument === "--help") {
      options.help = true;
      continue;
    }

    if (argument === "--dist") {
      const value = argumentsList[index + 1];
      if (!value) throw new Error("--dist requires a path");
      options.distDirectory = resolveFromRepository(value);
      index += 1;
      continue;
    }

    if (argument === "--baseline") {
      const value = argumentsList[index + 1];
      if (!value) throw new Error("--baseline requires a path");
      options.baselinePath = resolveFromRepository(value);
      index += 1;
      continue;
    }

    if (argument === "--catalog-dist") {
      const value = argumentsList[index + 1];
      if (!value) throw new Error("--catalog-dist requires a path");
      options.catalogDistDirectory = resolveFromRepository(value);
      index += 1;
      continue;
    }

    if (argument === "--max-regression") {
      const value = Number(argumentsList[index + 1]);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("--max-regression requires a non-negative number");
      }
      options.maxRegressionPercent = value;
      index += 1;
      continue;
    }

    if (argument === "--write-baseline") {
      const value = argumentsList[index + 1];
      if (!value) throw new Error("--write-baseline requires a path");
      options.baselinePath = resolveFromRepository(value);
      options.writeBaseline = true;
      index += 1;
      continue;
    }

    throw new Error(`unknown argument: ${argument}`);
  }

  return options;
};

const readRequiredFile = (path, description) => {
  if (!existsSync(path)) {
    throw new Error(`${description} not found at ${path}`);
  }

  return readFileSync(path);
};

const readAttribute = (tag, name) => {
  const expression = new RegExp(
    `\\b${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+)))?`,
    "i",
  );
  const match = tag.match(expression);

  if (!match) return undefined;
  return match[1] ?? match[2] ?? match[3] ?? "";
};

const normalizeLocalAssetPath = (assetUrl, context) => {
  if (!assetUrl) {
    throw new Error(`empty asset URL in ${context}`);
  }

  if (/^(?:[a-z]+:)?\/\//i.test(assetUrl)) {
    throw new Error(`external asset cannot be measured in ${context}: ${assetUrl}`);
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(assetUrl, "https://bundle.local/").pathname,
    ).replace(/^\/+/, "");
  } catch {
    throw new Error(`invalid asset URL in ${context}: ${assetUrl}`);
  }

  if (!pathname || pathname.split("/").includes("..")) {
    throw new Error(`unsafe asset URL in ${context}: ${assetUrl}`);
  }

  return pathname;
};

const unique = (values) => [...new Set(values)];

const extractInitialAssets = (html) => {
  const tags = html.match(/<(?:script|link)\b[^>]*>/gi) ?? [];
  const modern = [];
  const legacy = [];

  for (const tag of tags) {
    if (/^<link\b/i.test(tag)) {
      const relations = (readAttribute(tag, "rel") ?? "")
        .toLowerCase()
        .split(/\s+/);
      const href = readAttribute(tag, "href");

      if (href && relations.includes("stylesheet")) {
        modern.push(href);
        legacy.push(href);
      }

      if (href && relations.includes("modulepreload")) {
        modern.push(href);
      }

      continue;
    }

    const source = readAttribute(tag, "src");
    const deferredSource = readAttribute(tag, "data-src");
    const type = (readAttribute(tag, "type") ?? "").toLowerCase();
    const isLegacy = readAttribute(tag, "nomodule") !== undefined;

    if (type === "module" && source) {
      modern.push(source);
    }

    if (isLegacy && source) {
      legacy.push(source);
    }

    if (isLegacy && deferredSource) {
      legacy.push(deferredSource);
    }
  }

  if (modern.length === 0) {
    throw new Error("no initial modern assets found in dist/index.html");
  }

  if (legacy.length === 0) {
    throw new Error("no initial legacy assets found in dist/index.html");
  }

  return {
    modern: unique(
      modern.map((asset) => normalizeLocalAssetPath(asset, "dist/index.html")),
    ),
    legacy: unique(
      legacy.map((asset) => normalizeLocalAssetPath(asset, "dist/index.html")),
    ),
  };
};

const extractPrecacheArray = (serviceWorker) => {
  const marker = "precacheAndRoute(";
  const markerIndex = serviceWorker.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("Workbox precacheAndRoute call not found in dist/sw.js");
  }

  const arrayStart = serviceWorker.indexOf("[", markerIndex + marker.length);
  if (arrayStart === -1) {
    throw new Error("Workbox precache manifest array not found in dist/sw.js");
  }

  let quote;
  let escaped = false;
  let depth = 0;

  for (let index = arrayStart; index < serviceWorker.length; index += 1) {
    const character = serviceWorker[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        return serviceWorker.slice(arrayStart, index + 1);
      }
    }
  }

  throw new Error("unterminated Workbox precache manifest in dist/sw.js");
};

const extractPrecacheAssets = (serviceWorker) => {
  const manifest = extractPrecacheArray(serviceWorker);
  const assets = [];
  const urlExpression = /\burl\s*:\s*(["'])(.*?)\1/g;

  for (const match of manifest.matchAll(urlExpression)) {
    assets.push(normalizeLocalAssetPath(match[2], "dist/sw.js"));
  }

  if (assets.length === 0) {
    throw new Error("Workbox precache manifest contains no measurable assets");
  }

  return unique(assets);
};

const classifyAsset = (path) => {
  const extension = extname(path).toLowerCase();
  if (extension === ".js" || extension === ".mjs") return "javascript";
  if (extension === ".css") return "css";
  if (extension === ".html") return "html";
  if (extension === ".json" || extension === ".webmanifest") return "manifest";
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"].includes(extension)) {
    return "image";
  }
  return extension ? extension.slice(1) : "other";
};

const measureAsset = (distDirectory, path) => {
  const absolutePath = resolve(distDirectory, path);
  const distPrefix = `${resolve(distDirectory)}${sep}`;

  if (!absolutePath.startsWith(distPrefix)) {
    throw new Error(`asset resolves outside dist: ${path}`);
  }

  const content = readRequiredFile(absolutePath, `build asset ${path}`);

  return {
    path,
    type: classifyAsset(path),
    rawBytes: content.byteLength,
    gzipBytes: gzipSync(content).byteLength,
    sha256: createHash("sha256").update(content).digest("hex"),
  };
};

const sum = (values) => values.reduce((total, value) => total + value, 0);

const measureAssetGroup = (distDirectory, paths) => {
  const assets = paths.map((path) => measureAsset(distDirectory, path));
  const byType = Object.fromEntries(
    unique(assets.map((asset) => asset.type))
      .sort()
      .map((type) => {
        const matchingAssets = assets.filter((asset) => asset.type === type);
        return [
          type,
          {
            assetCount: matchingAssets.length,
            rawBytes: sum(matchingAssets.map((asset) => asset.rawBytes)),
            gzipBytes: sum(matchingAssets.map((asset) => asset.gzipBytes)),
          },
        ];
      }),
  );

  return {
    assetCount: assets.length,
    rawBytes: sum(assets.map((asset) => asset.rawBytes)),
    gzipBytes: sum(assets.map((asset) => asset.gzipBytes)),
    byType,
    assets,
  };
};

const listFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });

const findCatalogMarkers = (distDirectory) => {
  const matches = [];

  for (const absolutePath of listFiles(distDirectory)) {
    const path = relative(distDirectory, absolutePath).split(sep).join("/");
    const lowerPath = path.toLowerCase();
    const extension = extname(path).toLowerCase();
    const canInspectContent = [
      ".css",
      ".html",
      ".js",
      ".json",
      ".mjs",
      ".webmanifest",
    ].includes(extension);
    const content = canInspectContent
      ? readFileSync(absolutePath, "utf8").toLowerCase()
      : "";
    const markers = CATALOG_SOURCE_MARKERS.filter(
      (marker) => lowerPath.includes(marker) || content.includes(marker),
    );

    if (markers.length > 0) matches.push({ path, markers });
  }

  return matches;
};

const readGitValue = (argumentsList, fallback) => {
  try {
    return execFileSync("git", argumentsList, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
};

const readPackageVersion = () => {
  const packageJson = JSON.parse(
    readRequiredFile(
      resolve(repositoryRoot, "package.json"),
      "package.json",
    ).toString("utf8"),
  );
  return packageJson.version;
};

const createSnapshot = (distDirectory) => {
  const indexPath = resolve(distDirectory, "index.html");
  const serviceWorkerPath = resolve(distDirectory, "sw.js");
  const html = readRequiredFile(indexPath, "Vite index").toString("utf8");
  const serviceWorker = readRequiredFile(
    serviceWorkerPath,
    "Workbox service worker",
  ).toString("utf8");
  const initialAssets = extractInitialAssets(html);
  const precacheAssets = extractPrecacheAssets(serviceWorker);

  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    source: {
      commit: readGitValue(["rev-parse", "HEAD"], "unknown"),
      branch: readGitValue(["branch", "--show-current"], "unknown"),
      packageVersion: readPackageVersion(),
      nodeVersion: process.version,
    },
    build: {
      directory: distDirectory.startsWith(`${repositoryRoot}${sep}`)
        ? distDirectory.slice(repositoryRoot.length + 1)
        : distDirectory,
      index: "index.html",
      serviceWorker: "sw.js",
    },
    metrics: {
      initial: {
        modern: measureAssetGroup(distDirectory, initialAssets.modern),
        legacy: measureAssetGroup(distDirectory, initialAssets.legacy),
      },
      workboxPrecache: measureAssetGroup(distDirectory, precacheAssets),
    },
  };
};

const validateBaseline = (baseline, path) => {
  if (baseline?.schemaVersion !== 1) {
    throw new Error(`unsupported baseline schema in ${path}`);
  }

  for (const metric of [
    baseline?.metrics?.initial?.modern,
    baseline?.metrics?.initial?.legacy,
    baseline?.metrics?.workboxPrecache,
  ]) {
    if (
      !metric ||
      !Number.isFinite(metric.rawBytes) ||
      !Number.isFinite(metric.gzipBytes)
    ) {
      throw new Error(`invalid bundle measurements in ${path}`);
    }
  }
};

const formatBytes = (bytes) =>
  new Intl.NumberFormat("en-US").format(bytes);

const formatDelta = (candidate, baseline) => {
  const bytes = candidate - baseline;
  const percent = baseline === 0 ? 0 : (bytes / baseline) * 100;
  const sign = bytes > 0 ? "+" : "";
  return `${sign}${formatBytes(bytes)} bytes (${sign}${percent.toFixed(2)}%)`;
};

const printSnapshot = (snapshot, title) => {
  console.log(title);
  for (const [label, metric] of [
    ["Initial modern", snapshot.metrics.initial.modern],
    ["Initial legacy", snapshot.metrics.initial.legacy],
    ["Workbox precache", snapshot.metrics.workboxPrecache],
  ]) {
    console.log(
      `  ${label}: ${metric.assetCount} assets, ${formatBytes(
        metric.rawBytes,
      )} raw bytes, ${formatBytes(metric.gzipBytes)} gzip bytes`,
    );
    for (const [type, footprint] of Object.entries(metric.byType ?? {})) {
      console.log(
        `    ${type}: ${footprint.assetCount} assets, ${formatBytes(
          footprint.rawBytes,
        )} raw bytes, ${formatBytes(footprint.gzipBytes)} gzip bytes`,
      );
    }
  }
};

const printComparison = (candidate, baseline) => {
  console.log("Candidate comparison");
  for (const [label, candidateMetric, baselineMetric] of [
    [
      "Initial modern",
      candidate.metrics.initial.modern,
      baseline.metrics.initial.modern,
    ],
    [
      "Initial legacy",
      candidate.metrics.initial.legacy,
      baseline.metrics.initial.legacy,
    ],
    [
      "Workbox precache",
      candidate.metrics.workboxPrecache,
      baseline.metrics.workboxPrecache,
    ],
  ]) {
    console.log(`  ${label}:`);
    console.log(
      `    raw:  ${formatDelta(candidateMetric.rawBytes, baselineMetric.rawBytes)}`,
    );
    console.log(
      `    gzip: ${formatDelta(
        candidateMetric.gzipBytes,
        baselineMetric.gzipBytes,
      )}`,
    );
  }
};

const assertWithinBudget = (
  candidate,
  baseline,
  maxRegressionPercent,
) => {
  const multiplier = 1 + maxRegressionPercent / 100;
  const gates = [
    [
      "initial modern gzip",
      candidate.metrics.initial.modern.gzipBytes,
      baseline.metrics.initial.modern.gzipBytes,
    ],
    [
      "Workbox precache gzip",
      candidate.metrics.workboxPrecache.gzipBytes,
      baseline.metrics.workboxPrecache.gzipBytes,
    ],
  ];

  for (const [label, candidateBytes, baselineBytes] of gates) {
    const limit = Math.floor(baselineBytes * multiplier);
    if (candidateBytes > limit) {
      throw new Error(
        `${label} is ${formatBytes(candidateBytes)} bytes; limit is ${formatBytes(
          limit,
        )} bytes (${maxRegressionPercent}% over baseline)`,
      );
    }
  }
};

const assertProductionCatalogOmission = (snapshot, distDirectory) => {
  const markerMatches = findCatalogMarkers(distDirectory);
  if (markerMatches.length > 0) {
    throw new Error(
      `normal production contains catalog source markers: ${markerMatches
        .map(({ path, markers }) => `${path} [${markers.join(", ")}]`)
        .join("; ")}`,
    );
  }

  const catalogPrecacheEntries = snapshot.metrics.workboxPrecache.assets.filter(
    ({ path }) =>
      CATALOG_SOURCE_MARKERS.some((marker) =>
        path.toLowerCase().includes(marker),
      ),
  );
  if (catalogPrecacheEntries.length > 0) {
    throw new Error(
      `Workbox precache contains catalog assets: ${catalogPrecacheEntries
        .map(({ path }) => path)
        .join(", ")}`,
    );
  }
};

const run = () => {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    return;
  }

  const snapshot = createSnapshot(options.distDirectory);

  if (options.writeBaseline) {
    mkdirSync(dirname(options.baselinePath), { recursive: true });
    writeFileSync(
      options.baselinePath,
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8",
    );
    printSnapshot(snapshot, "Bundle baseline written");
    console.log(`  Path: ${options.baselinePath}`);
    return;
  }

  const baseline = JSON.parse(
    readRequiredFile(options.baselinePath, "bundle baseline").toString("utf8"),
  );
  validateBaseline(baseline, options.baselinePath);
  printSnapshot(snapshot, "Current bundle");
  printComparison(snapshot, baseline);
  assertWithinBudget(
    snapshot,
    baseline,
    options.maxRegressionPercent,
  );
  assertProductionCatalogOmission(snapshot, options.distDirectory);
  console.log(
    `Production gates passed (gzip regression <= ${options.maxRegressionPercent}%, no catalog source/chunk/precache marker)`,
  );

  if (options.catalogDistDirectory) {
    if (!existsSync(options.catalogDistDirectory)) {
      throw new Error(
        `catalog build not found at ${options.catalogDistDirectory}`,
      );
    }
    const catalogSnapshot = createSnapshot(options.catalogDistDirectory);
    const catalogMarkers = findCatalogMarkers(options.catalogDistDirectory);
    printSnapshot(catalogSnapshot, "Catalog build (report-only)");
    printComparison(catalogSnapshot, snapshot);
    console.log(
      `  Catalog marker assets: ${
        catalogMarkers.map(({ path }) => path).join(", ") || "none"
      }`,
    );
  }
};

try {
  run();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
