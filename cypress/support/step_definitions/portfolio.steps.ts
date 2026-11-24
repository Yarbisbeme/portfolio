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
  // Si todo pasó no hay notas falladas: eso también cumple. Las que haya deben llevar su cruz.
  cy.get("[data-tuning]").first().then(($staff) => {
    $staff.find('[data-tuning-note="failed"]').each((_, note) => {
      expect(note.querySelector("path"), "cruz en la nota fallada").to.not.equal(null);
    });
    $staff.find('[data-tuning-note]:not([data-tuning-note="failed"])').each((_, note) => {
      expect(note.querySelector("path"), "sin cruz en una nota afinada").to.equal(null);
    });
  });
});

// ── 07 · Cómo trabajo sin secuestrar el scroll ─────────────────────────────
Given("I am on a desktop screen", () => {
  cy.viewport(1440, 900);
  cy.get('#como-trabajo[data-how-layout="pinned"]').should("exist");
});

Given("I am on a phone screen", () => {
  cy.viewport(375, 812);
  cy.get('#como-trabajo[data-how-layout="flow"]').should("exist");
});

When("I stop scrolling halfway through {string}", () => {
  cy.get("#como-trabajo > div").first().then(($track) => {
    const el = $track[0];
    const top = el.getBoundingClientRect().top + window.scrollY;
    const max = el.offsetHeight - Cypress.config("viewportHeight");
    // Un punto cualquiera del segundo compás, lejos de sus bordes.
    const y = Math.round(top + max * 0.47);
    cy.scrollTo(0, y, { duration: 0 });
    cy.wrap(y).as("stoppedAt");
  });
});

Then("the page stays where I left it", () => {
  cy.wait(1200);
  cy.get<number>("@stoppedAt").then((y) => {
    cy.window().its("scrollY").should("be.closeTo", y, 2);
  });
});

Then("the measure in focus is {int}", (n: number) => {
  cy.get('#como-trabajo li[data-focus="true"]').should("have.length", 1);
  cy.get("#como-trabajo li[data-focus]").eq(n - 1).should("have.attr", "data-focus", "true");
});

When("I skip {string}", () => {
  cy.get("#como-trabajo").scrollIntoView();
  cy.get("[data-skip-how]").click();
});

Then("the stack section is in view", () => {
  cy.get("#stack").should(($s) => {
    const top = $s[0].getBoundingClientRect().top;
    expect(top).to.be.within(-5, Cypress.config("viewportHeight") / 2);
  });
});

Then("no cliché is struck yet", () => {
  cy.get('#como-trabajo [data-row][data-struck="true"]').should("have.length", 0);
});

When("I scroll to the last measure of {string}", () => {
  cy.get("#como-trabajo [data-row]").last().scrollIntoView({ offset: { top: -200, left: 0 } });
});

Then("every cliché I passed is struck through", () => {
  cy.get("#como-trabajo [data-row]").each(($r) => cy.wrap($r, { timeout: 4000 }).should("have.attr", "data-struck", "true"));
});

// ── 08 · /automation y /dev ───────────────────────────────────────────────
const pagePath: Record<string, string> = { suite: "automation", code: "dev" };

Given("I open the {word} page in {string}", (page: string, lang: string) => {
  cy.visit(`/${lang}/${pagePath[page]}/`);
  cy.get("h1").should("be.visible");
});

Then("the playhead is on step {int}", (n: number) => {
  cy.get("[data-playhead]").should("have.attr", "data-playhead", String(n - 1));
});

When("I go to the next step", () => {
  cy.get('[data-control="next"]').click();
});

Then("the first {int} notes have sounded", (n: number) => {
  cy.get("[data-step-staff] [data-step-note]").each(($note, i) => {
    if (i < n) expect($note.attr("data-step-note")).to.not.eq("waiting");
    else expect($note.attr("data-step-note")).to.eq("waiting");
  });
});

// ── 09 · Sonido opcional ──────────────────────────────────────────────────
type AudioWin = Window & { __audio: number; AudioContext: typeof AudioContext };

const countAudio = (win: Window) => {
  const w = win as AudioWin;
  w.__audio = 0;
  const Real = w.AudioContext;
  w.AudioContext = class extends Real {
    constructor(...args: ConstructorParameters<typeof AudioContext>) {
      super(...args);
      w.__audio += 1;
    }
  };
};

Given("I open the portfolio in {string} listening for audio", (lang: string) => {
  cy.clearLocalStorage();
  cy.visit(`/${lang}/`, { onBeforeLoad: countAudio });
  cy.get("h1").should("be.visible");
});

When("I touch the note {string}", (name: string) => {
  home.note(name).filter(":visible").first().click();
});

When("I turn sound on", () => {
  cy.get("[data-sound-toggle]").filter(":visible").first().click();
});

When("I reload the page", () => {
  cy.reload();
  cy.get("h1").should("be.visible");
});

When("I listen to the latest run", () => {
  cy.get("[data-listen]").scrollIntoView().click();
});

Then("no audio has been started", () => {
  cy.window().its("__audio").should("eq", 0);
});

Then("audio has been started", () => {
  cy.window().its("__audio").should("be.gte", 1);
});

Then("sound is off", () => {
  cy.get("[data-sound-toggle]").first().should("have.attr", "aria-pressed", "false");
});

Then("sound is on", () => {
  cy.get("[data-sound-toggle]").first().should("have.attr", "aria-pressed", "true");
});

// ── Hotfix: el gran pentagrama no desborda en móvil ───────────────────────
Given("I am on a {int} pixels wide screen", (width: number) => {
  cy.viewport(width, 800);
});

Then("the grand staff fits inside the page", () => {
  cy.document().its("documentElement.scrollWidth").then((sw) => {
    cy.window().its("innerWidth").should("be.gte", sw);
  });
  cy.get("[data-grand-staff]").then(($fig) => {
    const right = $fig[0].getBoundingClientRect().right;
    cy.get("[data-grand-staff] [data-note]").filter(":visible").each(($n) => {
      expect($n[0].getBoundingClientRect().right).to.be.at.most(right + 1);
    });
  });
});
