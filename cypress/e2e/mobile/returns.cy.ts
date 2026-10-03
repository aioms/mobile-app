import { addReplacement, assertDebt, loginMobile, openReturn, selectReason, submitReturn, type State } from "../../support/workflow";

describe("Mobile returns and exchanges", () => {
  for (const [price, total] of [[150000, 550000], [100000, 500000], [50000, 450000]]) {
    it(`ORDER-V2-E2E-${price}: adjustment ledger and stock agree after UI exchange`, () => {
      cy.task("seed", { scenario: "order" });
      loginMobile();
      openReturn("order");
      addReplacement(price);
      submitReturn();
      cy.task<State>("inspect").then((state) => {
        expect(Number(state.orders[0].total_amount)).eq(total);
        expect(state.transactions.length).eq(price === 100000 ? 1 : 2);
        expect(Number(state.products[0].inventory)).eq(21);
        expect(Number(state.products[1].inventory)).eq(19);
      });
    });
  }
  for (const [price, total, remaining] of [[150000, 550000, 50000], [100000, 500000, 0], [50000, 450000, -50000]]) {
    it(`DEBT-V3-E2E-${price}: UI exchange preserves paid and reload state`, () => {
      cy.task("seed", { scenario: "debt" });
      loginMobile();
      openReturn("debt");
      addReplacement(price);
      submitReturn();
      assertDebt(total, 500000, remaining);
      cy.reload();
      assertDebt(total, 500000, remaining);
      cy.task<State>("inspect").then((state) => {
        expect(state.returns.length).eq(1);
        expect(state.transactions.length).eq(1);
        expect(Number(state.products[0].inventory)).eq(21);
        expect(Number(state.products[1].inventory)).eq(19);
        expect(Number(state.customers[0].total_debt)).eq(remaining);
      });
    });
  }
  it("ORDER-RETURN-E2E: UI partial return updates source and inventory", () => {
    cy.task("seed", { scenario: "order" });
    loginMobile();
    openReturn("order");
    selectReason("Khác");
    submitReturn();
    cy.task<State>("inspect").then((state) => {
      expect(Number(state.orders[0].total_amount)).eq(400000);
      expect(Number(state.products[0].inventory)).eq(21);
      expect(state.returns.length).eq(1);
    });
  });
  it("DEBT-V3-E2E-VALIDATION: invalid quantity prevents save", () => {
    cy.task("seed", { scenario: "debt" });
    loginMobile();
    openReturn("debt");
    cy.get('[data-cy="return-quantity"]').clear().type("999").blur();
    cy.contains("Số lượng tối đa").should("be.visible");
    cy.get('[data-cy="return-confirm"]').scrollIntoView().click();
    cy.task<State>("inspect").its("returns").should("have.length", 0);
  });
});
