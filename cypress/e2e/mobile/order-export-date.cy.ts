import { loginMobile, sourceId } from "../../support/workflow";

describe("Order document export timestamp", () => {
  it("ORDER-EXPORT-DATE: export after midnight uses current Vietnam date", () => {
    cy.task("seed", { scenario: "order" });
    loginMobile();
    cy.visit(`/tabs/orders/detail/${sourceId.order}`);
    cy.get('[data-cy="order-print"]').should("be.visible");
    cy.clock(Date.parse("2026-10-03T16:59:00Z"), ["Date"]);
    cy.get('[data-cy="order-print"]').click();
    cy.get('[data-cy="order-export-excel"]').check();
    cy.get('[data-cy="order-export-submit"]').should("not.be.disabled");
    cy.tick(120000);
    cy.get('[data-cy="order-export-submit"]').scrollIntoView().click();
    cy.readFile("cypress/downloads/DH-TEST_bao-gia_kim-sang.xlsx", null).should("not.be.empty");
    cy.task<Array<Array<string | number>>>("download", "DH-TEST_bao-gia_kim-sang.xlsx").then(rows => {
      expect(rows.find(row => row[0] === "Ngày lập")?.[1]).eq("04/10/2026 00:01");
    });
  });
});
