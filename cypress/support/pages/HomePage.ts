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
    // La página está lista cuando el hero terminó su entrada (o no la tuvo: movimiento reducido).
    cy.get("html.motion-ready", { timeout: 8000 }).should("not.have.attr", "data-intro", "running");
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
    // Solo las notas que se muestran en este ancho (las de escritorio van con display: none en móvil).
    // No se usa :visible: Cypress considera oculta una nota en opacidad 0 a mitad de una animación.
    return cy.get(`${GRAND} [data-note][data-sounding="true"]`).filter((_, el) => (el as HTMLElement).offsetParent !== null);
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
