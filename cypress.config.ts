import { defineConfig } from "cypress";
import { inspectDownload } from "./cypress/tasks/download";
import { backendTask } from "./cypress/tasks/backend";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";

export default defineConfig({
  retries: 0,
  video: true,
  screenshotOnRunFailure: true,
  includeShadowDom: true,
  defaultCommandTimeout: 15000,
  reporter: "junit",
  reporterOptions: { mochaFile: "test-results/e2e-[hash].xml", toConsole: false },
  e2e: {
    baseUrl: "http://localhost:4173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    setupNodeEvents(on, config) {
      on("before:run", async () => {
        await mkdir("test-results", { recursive: true });
        for (const file of await readdir("test-results")) {
          if (/^e2e-.*\.xml$/.test(file)) await rm(`test-results/${file}`);
        }
      });
      on("task", {
        seed: async (options) => {
          await rm("cypress/downloads", { recursive: true, force: true });
          return backendTask("seed", options);
        },
        inspect: () => backendTask("inspect"),
        download: inspectDownload,
      });
      on("after:run", async (results) => {
        await mkdir("test-results", { recursive: true });
        await writeFile("test-results/system-summary.json", JSON.stringify(results, null, 2));
        if (!("totalTests" in results) || !results.totalTests || results.totalPending || results.totalSkipped) {
          throw new Error("System suite executed zero tests or skipped scenarios");
        }
      });
      config.env.dashboardUrl = process.env.CYPRESS_DASHBOARD_URL || "http://localhost:4300";
      return config;
    },
  },
});
