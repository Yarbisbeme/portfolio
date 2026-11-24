import { AfterStep, Before } from "@badeball/cypress-cucumber-preprocessor";

/**
 * Cada escenario empieza sin emulación de medios. "the visitor prefers reduced motion" la activa
 * por el protocolo de Chrome, y esa emulación sobrevive al escenario: sin este reinicio, todos los
 * escenarios siguientes del mismo archivo se ejecutarían con movimiento reducido.
 */
Before(() => {
  if (Cypress.browser.family !== "chromium") return;
  cy.wrap(
    Cypress.automation("remote:debugger:protocol", { command: "Emulation.setEmulatedMedia", params: { features: [] } }),
    { log: false },
  );
});

/**
 * Una captura por paso. El nombre enlaza la captura con los mensajes de Cucumber
 * (testCaseStartedId + testStepId) para que /automation pueda reproducir cada paso.
 */
AfterStep(function ({ testCaseStartedId, testStepId }) {
  cy.screenshot(`${testCaseStartedId}__${testStepId}`, { capture: "viewport", overwrite: true, log: false });
});
