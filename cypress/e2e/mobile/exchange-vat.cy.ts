import { addReplacement, loginMobile, openReturn, submitReturn, type State } from "../../support/workflow";

describe("Order exchange issued VAT", () => {
  for (const [preserve, difference] of [[true, 90000], [false, 97200]] as const) {
    it(`VAT settlement preserve=${preserve}: preview, persisted money and history`, () => {
      cy.viewport(375, 812);
      cy.task("seed", { scenario: "order", orderQuantity: 18, orderPrice: 45000, orderVatRate: 8 });
      loginMobile();
      openReturn("order");
      cy.get('[data-cy="return-quantity"]').clear().type("18").blur();
      addReplacement(50000);
      cy.get('[data-cy="exchange-quantity"]').clear().type("18").blur();
      cy.get('[data-cy="exchange-vat"]').clear().type("8").blur();
      cy.get('[data-cy="exchange-preserve-vat"]').should("be.checked");
      if (!preserve) cy.get('[data-cy="exchange-preserve-vat"]').uncheck();
      cy.get('[data-cy="exchange-difference"]').should(element => {
        expect(Number(element.text().replace(/[^0-9]/g, ""))).eq(difference);
      });
      cy.get('[data-cy="exchange-preserve-vat"]').scrollIntoView();
      cy.screenshot(`exchange-vat-${preserve ? "preserve" : "recalculate"}`);
      submitReturn();
      cy.task<State>("inspect").then(state => {
        expect(Number(state.returns[0].difference_amount)).eq(difference);
        expect(Number(state.orders[0].total_amount)).eq(874800 + difference);
        expect(state.transactions.length).eq(2);
      });
      if (preserve) {
        cy.contains('p', "Giữ nguyên VAT — chỉ tính chênh lệch tiền hàng").then(async element => {
          const paragraph = element[0];
          const content = paragraph.closest('ion-content') as HTMLIonContentElement;
          const scroll = await content.getScrollElement();
          const top = scroll.scrollTop + paragraph.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 100;
          await content.scrollToPoint(0, top, 0);
        });
        cy.contains('p', "Giữ nguyên VAT — chỉ tính chênh lệch tiền hàng").should("be.visible");
      }
    });
  }
});
