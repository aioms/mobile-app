/// <reference types="cypress" />
/* global cy, describe, it */

describe("Design System production omission", () => {
  it("falls through to NotFound without loading the internal catalog", () => {
    cy.visit("/internal/ui-kit");
    cy.contains("h1", "404").should("be.visible");
    cy.contains("Không tìm thấy trang").should("exist");
    cy.get('[data-testid="ui-kit-page"]').should("not.exist");
    cy.get(".ds-root").should("not.exist");
  });
});
