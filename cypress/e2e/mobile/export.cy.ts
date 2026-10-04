import { loginMobile, openReturn, selectReason, sourceId, submitReturn } from "../../support/workflow";

describe("Receipt debt export", () => {
  it("DEBT-EXPORT-ADJUSTMENT: XLSX exposes VAT adjustment and customer credit", () => {
    cy.task("seed", { scenario: "debt", discount: 50000, vat: 10000 });
    loginMobile();
    openReturn("debt");
    cy.get('[data-cy="return-quantity"]').clear().type("5").blur();
    selectReason("Khác");
    submitReturn();
    cy.visit(`/tabs/debt/detail/${sourceId.debt}`);
    cy.get('[data-cy="source-actions"]').click();
    cy.contains(".action-sheet-button", "In phiếu").click();
    cy.get('[data-cy="export-format-excel"]').click();
    cy.get('[data-cy="export-submit"]').click();
    cy.readFile("cypress/downloads/PT-TEST_phieu-thu.xlsx", null).should("not.be.empty");
    cy.task<Array<Array<string | number>>>("download", "PT-TEST_phieu-thu.xlsx").then((rows) => {
      for (const [label, expected] of [["Điều chỉnh đổi/trả", -10000], ["Tổng phải trả:", 0], ["Đã Thanh toán:", 460000], ["Còn Lại:", -460000]] as const) {
        expect(rows.find((row) => row[2] === label)?.[3], label).eq(expected);
      }
    });
  });
  it("DEBT-EXPORT-E2E: download XLSX and raster PDF via UI", () => {
    cy.task("seed", { scenario: "debt", discount: 50000, vat: 10000, paid: 400000 });
    loginMobile();
    cy.visit(`/tabs/debt/detail/${sourceId.debt}`);
    cy.get('[data-cy="source-actions"]').scrollIntoView().click();
    cy.contains(".action-sheet-button", "In phiếu").click();
    cy.get('[data-cy="export-format-excel"]').scrollIntoView().click();
    cy.get('[data-cy="export-submit"]').scrollIntoView().click();
    cy.readFile("cypress/downloads/PT-TEST_phieu-thu.xlsx", null).should("not.be.empty");
    cy.task<Array<Array<string | number>>>("download", "PT-TEST_phieu-thu.xlsx").then((rows) => {
      for (const [label, expected] of [["Tổng phải trả:", 460000], ["Đã Thanh toán:", 400000], ["Còn Lại:", 60000]] as const) {
        expect(rows.find((row) => row[2] === label)?.[3], label).eq(expected);
      }
    });
    cy.get('[data-cy="export-format-pdf"]').scrollIntoView().click();
    cy.get('[data-cy="export-submit"]').scrollIntoView().click();
    cy.readFile("cypress/downloads/PT-TEST_phieu-thu.pdf", null).should("not.be.empty");
    cy.task<{ pages: number; text: string }>("download", "PT-TEST_phieu-thu.pdf", { timeout: 60000 }).then((pdf) => {
      expect(pdf.pages).greaterThan(0);
      for (const amount of ["460.000", "400.000", "60.000"]) expect(pdf.text).contain(amount);
    });
  });
});
