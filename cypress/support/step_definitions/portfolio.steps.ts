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

// ── 06 · Gramática de partitura ─────────────────────────────────────────────
Then("the rehearsal marks read {string}", (csv: string) => {
  cy.get("main [data-rehearsal]").then(($m) => {
    expect([...$m].map((el) => el.getAttribute("data-rehearsal")).join(",")).to.eq(csv);
  });
});

Then("every rehearsal mark is announced as a section", () => {
  cy.get("main [data-rehearsal]").each(($m) => {
    cy.wrap($m).find(".sr-only").invoke("text").should("match", /^(Sección|Section) [A-Z]$/);
  });
});

Then("the contact closes with a final barline", () => {
  cy.get('#contacto [data-bar="final"]').should("exist");
});

When("I follow the da capo", () => {
  cy.get("#contacto [data-dc]").click();
});

Then("I am back at the top of the score", () => {
  cy.location("hash").should("eq", "#top");
  cy.window().its("scrollY").should("be.lt", 50);
});

When("I read the score as {string} from the header", (label: string) => {
  cy.viewport(1440, 900);
  cy.get("[data-header-mode]").contains(label).click();
});

Then("the work {string} is silent", (slug: string) => {
  cy.get(`[data-work="${slug}"]`).should("have.attr", "data-silent", "true");
});

Then("the work {string} is sounding", (slug: string) => {
  cy.get(`[data-work="${slug}"]`).should("have.attr", "data-silent", "false");
});

Then("silent work is announced to screen readers", () => {
  cy.get('[data-work][data-silent="true"] h3 .sr-only').should("have.length.at.least", 1);
});

Then("the work {string} is signed as {string}", (slug: string, sign: string) => {
  cy.get(`[data-work="${slug}"] [data-voices]`).invoke("text").then((t) => {
    expect(t.replace(/\s+/g, " ").trim()).to.eq(sign);
  });
});

Then("the career voice {string} is sounding", (voice: string) => {
  cy.get(`[data-polyphony] [data-voice="${voice}"]`).each(($v) => cy.wrap($v).should("have.attr", "data-sounding", "true"));
});

Then("the career voice {string} is silent", (voice: string) => {
  cy.get(`[data-polyphony] [data-voice="${voice}"]`).each(($v) => cy.wrap($v).should("have.attr", "data-sounding", "false"));
});

Then("the stack function {string} is sounding", (id: string) => {
  cy.viewport(1440, 900);
  cy.get(`[data-stack="${id}"]`).should("have.attr", "data-silent", "false");
});

Then("the stack function {string} is silent", (id: string) => {
  cy.viewport(1440, 900);
  cy.get(`[data-stack="${id}"]`).should("have.attr", "data-silent", "true");
});

Then("the tuning staff has one note per scenario in its count", () => {
  cy.viewport(1440, 900);
  cy.get("[data-tuning-count]").first().invoke("text").then((t) => {
    const total = Number(t.match(/\/(\d+)/)?.[1]);
    cy.get("[data-tuning] [data-tuning-note]").filter(":visible").should("have.length", total);
  });
});

Then("no note is out of tune unless it is marked with a cross", () => {
  cy.get('[data-tuning] [data-tuning-note="failed"]').each(($n) => {
    cy.wrap($n).find("path").should("exist");
  });
});
