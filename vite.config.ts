/// <reference types="vitest" />

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "path";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, type Plugin } from "vite";
import tailwindcss from "tailwindcss";

interface BuildMetadata {
  deploymentId: string;
  version: string;
  commit: string;
  buildTime: string;
  buildNumber: string;
  environment: string;
}

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

const getGitCommit = () => {
  const ciCommit =
    process.env.GITHUB_SHA ||
    process.env.CI_COMMIT_SHA ||
    process.env.COMMIT_SHA;

  if (ciCommit) return ciCommit.slice(0, 12);

  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
};

const createBuildMetadata = (environment: string): BuildMetadata => {
  const buildTime = new Date().toISOString();
  const commit = getGitCommit();
  const buildNumber =
    process.env.GITHUB_RUN_NUMBER ||
    process.env.CI_PIPELINE_IID ||
    process.env.BUILD_NUMBER ||
    "local";
  const deploymentId = createHash("sha256")
    .update(
      [packageJson.version, commit, buildNumber, buildTime, environment].join(
        ":",
      ),
    )
    .digest("hex")
    .slice(0, 16);

  return {
    deploymentId,
    version: packageJson.version,
    commit,
    buildTime,
    buildNumber,
    environment,
  };
};

const versionManifest = (metadata: BuildMetadata): Plugin => ({
  name: "version-manifest",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: `${JSON.stringify(metadata, null, 2)}\n`,
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const metadata = createBuildMetadata(mode);

  return {
    define: {
      __APP_BUILD__: JSON.stringify(metadata),
    },
    plugins: [
      react(),
      legacy(),
      versionManifest(metadata),
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
          globIgnores: ["**/version.json"],
        },
        manifest: {
          name: "All-In-One System",
          short_name: "AIOM",
          description: "Awesome All-In-One System",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#317EFB",
        },
      }),
    ],
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // build: {
    //   sourcemap: false,
    // }
  };
});
