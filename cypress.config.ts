import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 390,
  viewportHeight: 844,
  e2e: {
    baseUrl: "http://localhost:5173",
    retries: {
      runMode: 1,
      openMode: 0,
    },
    supportFile: "cypress/support/e2e.ts",
    screenshotsFolder:
      "specs/001-build-design-system-foundation/baselines/screenshots/catalog",
    setupNodeEvents() {},
  },
});
