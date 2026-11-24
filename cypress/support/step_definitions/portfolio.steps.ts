import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { home, type Focus, type Lang, type StaffName } from "../pages/HomePage";

const list = (csv: string) => csv.split(",").map((s) => s.trim()).filter(Boolean);

// ── Navegación ────────────────────────────────────────────────
Given("I open the portfolio in {string}", (lang: Lang) => home.visit(lang));

Given("I open the portfolio in {string} with the focus {string}", (lang: Lang, focus: Focus) => home.visit(lang, focus));

Given("the visitor prefers reduced motion", () => {
  cy.wrap(
    Cypress.automation("remote:debugger:protocol", {
      command: "Emulation.setEmulatedMedia",
      params: { features: [{ name: "prefers-reduced-motion", value: "reduce" }] },
    }),
  );
});

// ── Enfoque ───────────────────────────────────────────────────
When("I read the portfolio as {string}", (label: string) => home.readAs(label));

Then("the {string} staff is sounding", (staff: StaffName) => {
  home.notes(staff).each(($n) => expect($n.attr("data-sounding")).to.eq("true"));
});

Then("the {string} staff is silent", (staff: StaffName) => {
  home.notes(staff).each(($n) => expect($n.attr("data-sounding")).to.eq("false"));
});

Then("both staves are sounding", () => {
  home.notes("build").each(($n) => expect($n.attr("data-sounding")).to.eq("true"));
  home.notes("verify").each(($n) => expect($n.attr("data-sounding")).to.eq("true"));
});

Then("the address keeps the focus {string}", (focus: Focus) => {
  cy.location("search").should("eq", `?enfoque=${focus}`);
});

Then("the selected focus is {string}", (focus: Focus) => {
  home.selectedFocus().should("eq", focus);
});

Then("the CV link offers the {string} version", (version: string) => {
  home.cvLinks().should("have.length", 1).and("have.attr", "href").and("include", `yarbis-beltre-${version}.pdf`);
});

Then("the CV links offer {int} versions", (n: number) => {
  home.cvLinks().should("have.length", n);
});

// ── Gran pentagrama ───────────────────────────────────────────
When("I focus the project {string}", (name: string) => home.focusProject(name));

When("I point at the note {string}", (name: string) => home.pointAtNote(name));

Then("only these notes are sounding: {string}", (csv: string) => {
  const expected = list(csv).sort();
  home.soundingNotes().then(($els) => {
    const actual = [...$els].map((el) => el.getAttribute("data-note") ?? "").sort();
    expect(actual).to.deep.eq(expected);
  });
});

Then("these projects are marked: {string}", (csv: string) => {
  const expected = list(csv).sort();
  home.markedProjects().then(($els) => {
    const actual = [...$els].map((el) => el.getAttribute("data-project") ?? "").sort();
    expect(actual).to.deep.eq(expected);
  });
});

// ── Idioma ────────────────────────────────────────────────────
When("I switch the language", () => home.switchLanguage());

Then("I am on the {string} version with the focus {string}", (lang: Lang, focus: Focus) => {
  cy.location("pathname").should("match", new RegExp(`^/${lang}/?$`));
  cy.location("search").should("eq", `?enfoque=${focus}`);
  cy.get("html").should("have.attr", "lang", lang);
  home.selectedFocus().should("eq", focus);
});

Then("the headline reads {string}", (text: string) => {
  cy.get("h1").should("contain.text", text);
});

// ── Accesibilidad ─────────────────────────────────────────────
Then("the page has no serious accessibility violations", () => {
  cy.injectAxe();
  cy.checkA11y(undefined, { includedImpacts: ["serious", "critical"] });
});

When("I press Tab", () => {
  cy.press(Cypress.Keyboard.Keys.TAB);
});

Then("the skip link is focused and visible", () => {
  cy.focused().should("have.attr", "href", "#contenido").and("be.visible");
});

Then("every visible image has a text alternative", () => {
  cy.get("img:visible").each(($img) => {
    const hidden = $img.closest('[aria-hidden="true"]').length > 0;
    if (!hidden) expect($img.attr("alt"), $img.attr("src")).to.be.a("string").and.not.be.empty;
  });
});

// ── Movimiento ────────────────────────────────────────────────
Then("the preview plays a loop", () => {
  home.preview().find("video").should("exist").and(($v) => {
    const v = $v[0] as HTMLVideoElement;
    expect(v.muted, "silenciado").to.eq(true);
    expect(v.paused, "reproduciendo").to.eq(false);
  });
});

Then("the preview shows only a still image", () => {
  home.preview().find("img").should("be.visible");
  // Espera breve a propósito: el loop se montaría en este intervalo si no se respetara la preferencia.
  cy.wait(800);
  home.preview().find("video").should("not.exist");
});
