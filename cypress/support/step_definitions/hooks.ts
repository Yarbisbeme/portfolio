import { AfterStep } from "@badeball/cypress-cucumber-preprocessor";

/**
 * Una captura por paso. El nombre enlaza la captura con los mensajes de Cucumber
 * (testCaseStartedId + testStepId) para que /automation pueda reproducir cada paso.
 */
AfterStep(function ({ testCaseStartedId, testStepId }) {
  cy.screenshot(`${testCaseStartedId}__${testStepId}`, { capture: "viewport", overwrite: true, log: false });
});
