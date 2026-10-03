import { addReplacement, loginMobile, openReturn, selectReason, submitReturn, type State } from "../../support/workflow";

function chooseCustomer() {
  cy.get('[data-cy="create-select-customer"]').scrollIntoView().click();
  cy.contains("ion-modal", "Khách kiểm thử").within(() => {
    cy.contains("Khách kiểm thử").click();
    cy.contains("ion-button", "Xác nhận").click();
  });
}
function chooseProduct() {
  cy.get('[data-cy="create-select-product"]').scrollIntoView().click();
  cy.contains("ion-modal", "Hàng gốc kiểm thử").within(() => {
    cy.contains("Hàng gốc kiểm thử").click();
    cy.contains("ion-button", "Xác nhận").click();
  });
}

describe("Create and pay through UI", () => {
  it("ORDER-CREATE-E2E: create, cash payment, then return", () => {
    cy.task("seed", { scenario: "empty" });
    loginMobile();
    cy.visit("/tabs/orders/create");
    chooseProduct();
    chooseCustomer();
    cy.on("window:confirm", () => true);
    cy.intercept("POST", "**/api/v1/orders").as("createOrder");
    cy.get('[data-cy="create-order-confirm"]').scrollIntoView().click();
    cy.contains("ion-modal ion-button", "Xác nhận").click();
    cy.wait("@createOrder").then((result) => {
      const id = result.response?.body.data.id as string;
      expect(id).a("string");
      cy.task<State>("inspect").then((state) => {
        expect(Number(state.payments[0].collected_amount)).eq(100000);
        expect(Number(state.products[0].inventory)).eq(19);
      });
      openReturn("order", id);
      selectReason("Khác");
      submitReturn();
      cy.task<State>("inspect").then((state) => {
        expect(Number(state.orders[0].total_amount)).eq(0);
        expect(Number(state.products[0].inventory)).eq(20);
      });
    });
  });
  it("DEBT-CREATE-E2E: create, collect cash, then exchange", () => {
    cy.task("seed", { scenario: "empty" });
    loginMobile();
    cy.visit("/tabs/debt/create");
    chooseCustomer();
    chooseProduct();
    cy.intercept("POST", "**/api/v1/receipt-debt").as("createDebt");
    cy.get('[data-cy="create-debt-confirm"]').scrollIntoView().click();
    cy.wait("@createDebt").then((result) => {
      const id = result.response?.body.data.id as string;
      expect(id).a("string");
      cy.visit(`/tabs/debt/detail/${id}`);
      cy.get('[data-cy="source-actions"]').scrollIntoView().click();
      cy.contains(".action-sheet-button", "Thanh toán").click();
      cy.contains("ion-modal", "Thanh toán tiền mặt").within(() => cy.contains("Thanh toán tiền mặt").click());
      cy.contains("ion-modal ion-button", "Thanh toán toàn bộ").click();
      cy.contains("ion-modal ion-button", "Xác nhận").click();
      cy.intercept("POST", `**/api/v1/receipt-debt/${id}/payment`).as("payDebt");
      cy.contains("ion-modal ion-button", "Hoàn tất thanh toán").click();
      cy.wait("@payDebt").its("response.statusCode").should("eq", 200);
      openReturn("debt", id);
      addReplacement(150000);
      submitReturn();
      cy.task<State>("inspect").then((state) => {
        expect(Number(state.debts[0].total_amount)).eq(150000);
        expect(Number(state.debts[0].paid_amount)).eq(100000);
        expect(Number(state.debts[0].remaining_amount)).eq(50000);
        expect(state.transactions.length).eq(1);
      });
    });
  });
});
