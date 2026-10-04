import { loginMobile, sourceId } from "../../support/workflow";

describe("Order print action across saved statuses", () => {
  for (const status of ["draft", "pending", "completed", "returned", "cancelled"]) {
    for (const screen of ["detail", "update"]) {
      it(`ORDER-PRINT-${status}-${screen}`, () => {
        cy.viewport(375, 812);
        cy.task("seed", { scenario: "order" });
        loginMobile();
        cy.intercept("GET", `**/api/v1/orders/${sourceId.order}`, request => {
          request.continue(response => {
            response.body.data.status = status;
          });
        }).as("orderDetail");
        cy.visit(`/tabs/orders/${screen}/${sourceId.order}`);
        cy.wait("@orderDetail");
        if (status === "cancelled") {
          cy.get('[data-cy="order-print"]').should("not.exist");
          return;
        }
        cy.get('[data-cy="order-print"]').should("be.visible").should(element => {
          const rect = element[0].getBoundingClientRect();
          expect(rect.left).to.be.at.least(0);
          expect(rect.right).to.be.at.most(375);
          expect(rect.height).to.be.at.least(44);
        });
        if (screen === "detail" && status === "draft") cy.screenshot("order-detail-print-mobile");
        cy.get('[data-cy="order-print"]').click();
        cy.get('[data-cy="order-export-excel"]').check();
        cy.get('[data-cy="order-export-submit"]').should("not.be.disabled").scrollIntoView().click();
        cy.readFile("cypress/downloads/DH-TEST_bao-gia_kim-sang.xlsx", null).should("not.be.empty");
      });
    }
  }
  it("ORDER-PRINT-CANCELLED-ON-OPEN: refreshed cancelled order is blocked", () => {
    cy.task("seed", { scenario: "order" });
    loginMobile();
    cy.visit(`/tabs/orders/detail/${sourceId.order}`);
    cy.get('[data-cy="order-print"]').should("be.visible");
    cy.intercept("GET", `**/api/v1/orders/${sourceId.order}`, request => {
      request.continue(response => { response.body.data.status = "cancelled"; });
    });
    cy.get('[data-cy="order-print"]').click();
    cy.contains("Đơn hàng đã hủy không thể in.").should("be.visible");
    cy.get('[data-cy="order-export-submit"]').should("be.disabled");
  });
});
