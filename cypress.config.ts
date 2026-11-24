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
    video: false,
    screenshotsFolder: "cypress/screenshots",
    retries: { runMode: 1, openMode: 0 },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler({ plugins: [createEsbuildPlugin(config)] }));
      return config;
    },
  },
});
