import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";

export default defineConfig({
  e2e: {
    // El sitio estático (./out) se sirve con `npm run serve:out`.
    baseUrl: "http://localhost:4173",
    specPattern: "cypress/e2e/**/*.feature",
    viewportWidth: 1440,
    viewportHeight: 900,
    scrollBehavior: "nearest",
    video: false,
    screenshotsFolder: "cypress/screenshots",
    retries: { runMode: 1, openMode: 0 },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler({ plugins: [createEsbuildPlugin(config)] }));
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
          launchOptions.args.push("--window-size=1920,1080", "--force-device-scale-factor=1");
        } else if (browser.name === "electron") {
          launchOptions.preferences.width = 1920;
          launchOptions.preferences.height = 1080;
        }
        return launchOptions;
      });
      return config;
    },
  },
});
