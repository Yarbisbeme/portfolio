/**
 * Page Object de la home. Toda interacción con el DOM pasa por aquí:
 * los step definitions solo hablan en lenguaje de negocio.
 */
export type Lang = "es" | "en";
export type Focus = "general" | "backend" | "qa";
export type StaffName = "build" | "verify";

/** Todo lo del gran pentagrama vive dentro del hero; nada fuera de él debe confundirse con sus notas. */
const GRAND = "[data-grand-staff]";

const focusLabel: Record<string, Focus> = { General: "general", "Back-End": "backend", QA: "qa" };

export class HomePage {
  visit(lang: Lang, focus?: Focus) {
    const query = focus && focus !== "general" ? `?enfoque=${focus}` : "";
    cy.visit(`/${lang}/${query}`);
    cy.get("h1").should("be.visible");
  }

  readAs(label: string) {
    const focus = focusLabel[label];
    if (!focus) throw new Error(`Enfoque desconocido: ${label}`);
    cy.get(`[data-mode="${focus}"]`).click();
    cy.get(`[data-mode="${focus}"]`).should("have.attr", "aria-pressed", "true");
  }

  selectedFocus() {
    return cy.get('[data-mode][aria-pressed="true"]').invoke("attr", "data-mode");
  }

  notes(staff: StaffName) {
    return cy.get(`${GRAND} [data-staff="${staff}"] [data-note]`).filter(":visible");
  }

  note(name: string) {
    return cy.get(`${GRAND} [data-note="${name}"]`);
  }

  soundingNotes() {
    return cy.get(`${GRAND} [data-note][data-sounding="true"]`).filter(":visible");
  }

  focusProject(name: string) {
    cy.get("[data-project]").contains(name).closest("[data-project]").focus();
  }

  pointAtNote(name: string) {
    this.note(name).focus();
  }

  markedProjects() {
    return cy.get('[data-project][data-marked="true"]');
  }

  cvLinks() {
    return cy.get("[data-cv]");
  }

  switchLanguage() {
    cy.get("header a[hreflang]").click();
  }

  preview() {
    return cy.get('[data-preview] [data-shown="true"]');
  }
}

export const home = new HomePage();
