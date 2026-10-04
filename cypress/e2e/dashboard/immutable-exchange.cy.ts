import { addReplacement, assertDebt, loginMobile, openReturn, submitReturn } from "../../support/workflow";

describe("Dashboard existing exchange review", () => {
  it("DEBT-V3-E2E-IMMUTABLE: dashboard sees source totals and offers no completed exchange edits", () => {
    cy.task("seed", { scenario: "debt" });
    loginMobile();
    openReturn("debt");
    addReplacement(150000);
    submitReturn().then((id) => {
      cy.origin(Cypress.env("dashboardUrl"), { args: { id } }, ({ id }) => {
        cy.visit("/login", { onBeforeLoad(win) { win.localStorage.clear(); } });
        cy.get('[data-cy="login-username"]').clear().type("test-admin");
        cy.get('[data-cy="login-password"]').clear().type("test-only-password", { log: false });
        cy.get('[data-cy="login-submit"]').click();
        cy.location("pathname").should("not.eq", "/login");
        cy.visit("/receipt-debt/detail/00000000-0000-4000-8000-000000000201");
        for (const [field, amount] of [["total", 550000], ["paid", 500000], ["remaining", 50000]] as const) {
          cy.get(`[data-cy="debt-${field}"]`).should(($value) => {
            expect(Number($value.text().replace(/[^0-9-]/g, ""))).eq(amount);
          });
        }
        cy.visit(`/receipt-return/update?id=${id}`);
        cy.get('[data-cy="debt-return-review"]').should("be.visible");
        cy.get('[data-cy="debt-return-status"]').should("not.exist");
        cy.get('[data-cy="debt-return-save"]').should("not.exist");
      });
      assertDebt(550000, 500000, 50000);
    });
  });
});
