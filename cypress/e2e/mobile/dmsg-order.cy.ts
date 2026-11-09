import { loginMobile, type State } from "../../support/workflow";
const stock = (expected: number) => cy.task<State>("inspect").then((state) => expect(Number(state.products.find((p) => p.id === "00000000-0000-4000-8000-000000000101")?.inventory)).eq(expected));
function confirm(button = "Xác nhận") { cy.get("ion-alert").last().should("be.visible").contains("button", button).should("be.visible").click(); cy.get("ion-alert").should("not.exist"); }
function money(name: string, value: number) { cy.get(`.ion-page:not(.ion-page-hidden) [data-cy="dmsg-${name}"]`).scrollIntoView().clear().type(String(value)).blur(); }
function clearMoney(name: string) { cy.get(`.ion-page:not(.ion-page-hidden) [data-cy="dmsg-${name}"]`).scrollIntoView().clear().blur(); }
function createForm() {
  cy.visit("/tabs/orders/create");
  cy.get('[data-cy="select-dmsg"]').click();
  cy.get('[data-cy="dmsg-select-customer"]').click();
  cy.contains("ion-modal", "Khách kiểm thử").within(() => {
    cy.contains("Khách kiểm thử").click(); cy.contains("ion-button", "Xác nhận").click();
  });
  cy.get('[data-cy="dmsg-select-products"]').click();
  cy.contains("ion-modal", "Hàng gốc kiểm thử").within(() => {
    cy.contains("Hàng gốc kiểm thử").click(); cy.contains("ion-button", "Xác nhận").click();
  });
  cy.get('[data-cy="dmsg-quantity"]').clear().type("5").blur();
  money("totalCost", 70000000); money("invoiceTotal", 108000000); money("vatRate", 8); money("commissionRate", 10); money("invoiceFee", 1000000);
}
function save(button: string, method: "POST" | "PUT", pay = false) {
  cy.intercept("GET", "**/api/v1/orders/*").as("reloadDmsg");
  cy.intercept(method, method === "POST" ? "**/api/v1/orders" : "**/api/v1/orders/*").as("saveDmsg");
  cy.get(`.ion-page:not(.ion-page-hidden) [data-cy="${button}"]`).scrollIntoView().click(); confirm(pay ? "Tiếp tục thanh toán" : "Xác nhận");
  if (pay) {
    cy.get("ion-modal").last().contains("h3", "Thanh toán tiền mặt").click();
    cy.get("ion-modal").last().contains("ion-button", "Xác nhận").click();
  }
  return cy.wait("@saveDmsg").then((result) => { expect(result.response?.body.success, JSON.stringify(result.response?.body)).eq(true); const saved = result.response!.body.data; return cy.wait("@reloadDmsg").then(() => cy.get('.ion-page:not(.ion-page-hidden)[data-dmsg-ready="true"]').should("exist").then(() => saved)); });
}
function result(key: string, value: number) {
  cy.get(`.ion-page:not(.ion-page-hidden) [data-cy="dmsg-result-${key}"]`).should(($el) => expect(Number($el.text().replace(/[^0-9-]/g, ""))).eq(value));
}
describe("ĐMSG real UI/API/database", () => {
  beforeEach(() => { cy.viewport(390, 844); cy.task("seed", { scenario: "empty" }); loginMobile(); });
  it("DMSG-LIFECYCLE: draft export, quantity delta, pay on completion, edit fee, cancel", () => {
    createForm(); result("revenue", 90909091); result("customerTransfer", 9090909); result("profit", 19909091);
    for (const field of ["invoiceTotal", "vatRate", "commissionRate", "invoiceFee"]) clearMoney(field);
    save("dmsg-save-draft", "POST"); cy.location("pathname").should("match", /\/tabs\/orders\/dmsg\/detail\/[a-f0-9-]+$/); stock(15);
    cy.get('[data-cy="dmsg-quantity"]').should("not.be.disabled").clear();
    cy.get('[data-cy="dmsg-quantity"]').should("not.be.disabled").type("7").blur(); save("dmsg-save-draft", "PUT"); stock(13);
    cy.get('[data-cy="dmsg-complete"]').click(); confirm("Tiếp tục thanh toán");
    for (const field of ["invoiceTotal", "vatRate", "commissionRate"]) cy.get(`[data-cy="dmsg-${field}"]`).should("have.attr", "aria-invalid", "true");
    cy.get("ion-modal").should("not.exist");
    money("invoiceTotal", 108000000); money("vatRate", 8); money("commissionRate", 10);
    save("dmsg-complete", "PUT", true); stock(13);
    cy.get('[data-cy="dmsg-received"]').should("contain", "108.000.000");
    money("invoiceFee", 2000000); save("dmsg-complete", "PUT"); result("customerTransfer", 9090909); result("profit", 18909091); stock(13);
    cy.screenshot("dmsg-completed-mobile", { capture: "viewport" });
    cy.get('[data-cy="dmsg-settlement-kind"]').select("customer_transfer");
    cy.get('[data-cy="dmsg-settlement-amount"]').scrollIntoView().type("9090909");
    cy.intercept("POST", "**/dmsg-settlements").as("settlement");
    cy.get('[data-cy="dmsg-settlement-save"]').click(); confirm();
    cy.wait("@settlement").its("response.body.success").should("eq", true);
    cy.get('[data-cy="dmsg-received"]').should("contain", "108.000.000"); result("revenue", 90909091);
    save("dmsg-cancel", "PUT"); stock(20);
    cy.contains("Đơn đã hủy").should("exist"); cy.get('[data-cy="dmsg-received"]').should("contain", "108.000.000");
    cy.get('[data-cy="dmsg-complete"]').should("not.exist");
    cy.get('[data-cy="dmsg-settlement-kind"]').should("have.value", "refund");
    cy.get('[data-cy="dmsg-settlement-amount"]').scrollIntoView().type("108000000");
    cy.get('[data-cy="dmsg-settlement-save"]').click(); confirm();
    cy.wait("@settlement").its("response.body.success").should("eq", true);
    cy.get('[data-cy="dmsg-received"]').should("contain", "0");
    cy.screenshot("dmsg-cancelled-mobile", { capture: "viewport" });
  });
  it("DMSG-VALIDATION: required fields and stock rollback", () => {
    cy.visit("/tabs/orders/dmsg/create"); cy.get('[data-cy="dmsg-save-draft"]').click(); confirm();
    cy.contains("Vui lòng nhập giá trị").should("exist");
    createForm(); cy.get('[data-cy="dmsg-quantity"]').clear().type("999").blur();
    cy.intercept("POST", "**/api/v1/orders").as("invalidStock"); cy.get('[data-cy="dmsg-save-draft"]').click(); confirm();
    cy.wait("@invalidStock").its("response.statusCode").should("eq", 400);
    cy.get('[data-cy="dmsg-error"]').should("contain", "Tồn kho không đủ"); stock(20);
    cy.task<State>("inspect").then((state) => expect(state.orders).to.have.length(0));
    cy.get('[data-cy="dmsg-quantity"]').clear().type("1").blur(); save("dmsg-save-draft", "POST"); stock(19);
  });
  it("DMSG-DESKTOP: responsive finance and report excludes drafts", () => {
    cy.viewport(1280, 900); createForm(); save("dmsg-save-draft", "POST");
    cy.get('.ion-page:not(.ion-page-hidden)[data-dmsg-ready="true"] ion-content').then(async ($content) => {
      const content = $content[0] as unknown as HTMLElement & { getScrollElement: () => Promise<HTMLElement> };
      const target = content.querySelector('[data-cy="dmsg-result-profit"]')!;
      const scroll = await content.getScrollElement();
      scroll.scrollTop += target.getBoundingClientRect().top - content.getBoundingClientRect().top - 100;
    });
    cy.get('.ion-page:not(.ion-page-hidden) [data-cy="dmsg-result-profit"]').should("be.visible");
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).at.most(doc.documentElement.clientWidth));
    cy.screenshot("dmsg-desktop", { capture: "viewport" });
    save("dmsg-complete", "PUT", true);
    cy.visit("/tabs/orders"); cy.get('[data-cy="dmsg-daily-report"]').should("contain", "90.909.091");
    cy.get('[data-cy="dmsg-daily-profit"]').should("contain", "19.909.091");
  });
});
