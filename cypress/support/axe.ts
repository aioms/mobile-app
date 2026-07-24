/// <reference types="cypress" />
/* global Cypress, cy, expect */

import axe from "axe-core";

const WCAG_21_A_AA_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
] as const;
const BLOCKING_IMPACTS: readonly axe.ImpactValue[] = [
  "critical",
  "serious",
];

type AxeWindow = Cypress.AUTWindow & {
  axe?: typeof axe;
};

const injectAxeIntoWindow = (window: Cypress.AUTWindow) => {
  const axeWindow = window as AxeWindow;

  if (!axeWindow.axe) {
    const script = window.document.createElement("script");
    script.dataset.dsAxe = "true";
    script.textContent = [
      "(function injectAxeWithoutModuleGlobals() {",
      "var exports = {};",
      "var module = { exports: exports };",
      "var define = undefined;",
      axe.source,
      "})();",
    ].join("\n");
    window.document.head.appendChild(script);
    script.remove();
  }

  if (!axeWindow.axe) {
    throw new Error("Direct axe-core injection failed");
  }

  return axeWindow.axe;
};

export const getBlockingAxeViolations = (results: axe.AxeResults) =>
  results.violations.filter(
    (violation) =>
      BLOCKING_IMPACTS.includes(violation.impact ?? null) ||
      violation.tags.some((tag) =>
        WCAG_21_A_AA_TAGS.includes(
          tag as (typeof WCAG_21_A_AA_TAGS)[number],
        ),
      ),
  );

export const formatAxeViolations = (violations: axe.Result[]) =>
  violations
    .map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .map(String)
        .join(", ");

      return `${violation.id} [${violation.impact ?? "unknown"}]: ${
        violation.help
      } (${targets})`;
    })
    .join("\n");

Cypress.Commands.add("injectAxe", () =>
  cy.window({ log: false }).then((window) => {
    injectAxeIntoWindow(window);
    Cypress.log({ name: "injectAxe", message: "axe-core injected directly" });
  }),
);

Cypress.Commands.add("checkA11y", (context?: axe.ElementContext) =>
  cy.window({ log: false }).then((window) => {
    const axeRunner = injectAxeIntoWindow(window);

    return axeRunner
      .run(context ?? window.document, { resultTypes: ["violations"] })
      .then((results) => {
        const violations = getBlockingAxeViolations(results);
        const details = formatAxeViolations(violations);

        expect(
          violations,
          details ||
            "No critical, serious or WCAG 2.1 A/AA axe violations found",
        ).to.have.length(0);

        return results;
      });
  }),
);

declare global {
  // Cypress custom commands require namespace augmentation.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      injectAxe(): Chainable<Cypress.AUTWindow>;
      checkA11y(context?: axe.ElementContext): Chainable<axe.AxeResults>;
    }
  }
}
