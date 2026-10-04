import { assertDebt, loginMobile, openReturn, selectReason, submitReturn, type State } from "../../support/workflow";

describe("Mobile → dashboard → mobile", () => {
  it("DEBT-V3-E2E-REVIEW: draft confirm and cancel reconcile stock and debt", () => {
    cy.task("seed", { scenario: "debt" });
    loginMobile();
    openReturn("debt");
    selectReason("Khác");
    submitReturn(true).then((id) => {
      cy.intercept("PUT", `**/api/v1/receipt-return/${id}`).as("updateReturn");
      cy.origin(Cypress.env("dashboardUrl"), { args: { id } }, ({ id }) => {
        cy.visit("/login", { onBeforeLoad(win) { win.localStorage.clear(); } });
        cy.get('[data-cy="login-username"]').clear().type("test-admin");
        cy.get('[data-cy="login-password"]').clear().type("test-only-password", { log: false });
        cy.get('[data-cy="login-submit"]').scrollIntoView().click();
        cy.location("pathname").should("not.eq", "/login");
        cy.visit(`/receipt-return/update?id=${id}`);
        cy.get('[data-cy="debt-return-review"]').should("be.visible");
        cy.get('[data-cy="debt-return-status"]').select("completed");
        cy.get('[data-cy="debt-return-save"]').scrollIntoView().click();
        cy.get('[data-cy="debt-return-status"]').should("not.be.disabled").should("have.value", "completed");
      });
      cy.wait("@updateReturn").its("response.body.success").should("eq", true);
      assertDebt(400000, 500000, -100000);
      cy.task<State>("inspect").then((state) => expect(Number(state.products[0].inventory)).eq(21));
      cy.origin(Cypress.env("dashboardUrl"), { args: { id } }, ({ id }) => {
        cy.visit(`/receipt-return/update?id=${id}`);
        cy.on("window:confirm", () => true);
        cy.get('[data-cy="debt-return-status"]').select("cancelled");
        cy.get('[data-cy="debt-return-save"]').scrollIntoView().click();
        cy.get('[data-cy="debt-return-status"]').should("not.be.disabled").should("have.value", "cancelled");
      });
      cy.wait("@updateReturn").its("response.body.success").should("eq", true);
      assertDebt(500000, 500000, 0);
      cy.task<State>("inspect").then((state) => expect(Number(state.products[0].inventory)).eq(20));
    });
  });
});
