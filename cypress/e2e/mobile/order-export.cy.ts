import { loginMobile, sourceId } from "../../support/workflow";

describe("Order quotation / invoice export", () => {
  for (const kind of ["quotation", "invoice"] as const) {
    for (const entity of ["kim-sang", "ngan-kim"] as const) {
      for (const format of ["excel", "pdf", "image"] as const) {
        it(`ORDER-EXPORT-${kind}-${entity}-${format}: real file and author`, () => {
          cy.task("seed", { scenario: "order", discount: 50000 });
          loginMobile();
          cy.visit(`/tabs/orders/detail/${sourceId.order}`);
          cy.get('[data-cy="order-print"]').click();
          cy.get(`[data-cy="order-export-${kind}"]`).check();
          cy.get(`[data-cy="order-export-${entity}"]`).check();
          cy.get(`[data-cy="order-export-${format}"]`).check();
          cy.contains("Người báo giá").should(
            kind === "quotation" ? "exist" : "not.exist",
          );
          const name = `DH-TEST_${
            kind === "quotation" ? "bao-gia" : "hoa-don"
          }_${entity}`;
          const extension = format === "excel"
            ? "xlsx"
            : format === "image"
            ? "png"
            : "pdf";
          cy.get('[data-cy="order-export-submit"]').scrollIntoView().click();
          cy.readFile(`cypress/downloads/${name}.${extension}`, null).should(
            "not.be.empty",
          ).then((content) =>
            cy.writeFile(
              `test-results/order-exports/${name}.${extension}`,
              content,
              { encoding: null },
            )
          );
          if (format === "excel") {
            cy.task<Array<Array<string | number>>>("download", `${name}.xlsx`)
              .then((rows) => {
                expect(
                  rows.find((row) => row[3] === "Tổng cộng")?.[4],
                ).eq(kind === "quotation" ? 500000 : 450000);
                expect(rows.some((row) => row.includes("Test Admin"))).eq(true);
                expect(rows.some((row) => row[0] === "MST: 0305974197")).eq(
                  entity === "ngan-kim",
                );
              });
          }
          if (format === "pdf") {
            cy.task<{ pages: number; text: string }>(
              "download",
              `${name}.pdf`,
              { timeout: 60000 },
            ).then((pdf) => {
              expect(pdf.pages).eq(1);
              expect(pdf.text).contain(
                kind === "quotation" ? "500.000" : "450.000",
              );
            });
          }
          cy.screenshot(`order-${kind}-${entity}-${format}`);
        });
      }
    }
  }
  for (const kind of ["quotation", "invoice"] as const) {
    it(`ORDER-EXPORT-${kind}-LONG: pagination, long names and all rows`, () => {
      cy.task("seed", { scenario: "order" });
      loginMobile();
      cy.get("@login").then((interception) => {
        const login = interception as unknown as {
          request: { url: string };
          response: { body: { data: { token: string } } };
        };
        const items = Array.from({ length: 80 }, (_, index) => ({
          productId: "00000000-0000-4000-8000-000000000101",
          code: "1001",
          productName: `Hàng ${
            index + 1
          }: Kìm điện chuyên dụng, quy cách dài, tay cầm cách điện. `.repeat(3),
          quantity: 1,
          price: 100000,
          vatRate: index % 2 ? 10 : 8,
        }));
        cy.request({
          method: "POST",
          url: login.request.url.replace("/auth/login", "/orders"),
          headers: {
            Authorization: `Bearer ${login.response.body.data.token}`,
          },
          body: {
            paymentMethod: "cash",
            status: "draft",
            discountAmount: 10000,
            items,
          },
        }).then((response) => {
          const { id, code } = response.body.data;
          cy.visit(`/tabs/orders/detail/${id}`);
          cy.get('[data-cy="order-print"]').click();
          cy.get(`[data-cy="order-export-${kind}"]`).check();
          cy.get('[data-cy="order-export-pdf"]').check();
          cy.get('[data-cy="order-export-submit"]').scrollIntoView().click();
          const name = `${code}_${
            kind === "quotation" ? "bao-gia" : "hoa-don"
          }_kim-sang`;
          cy.readFile(`cypress/downloads/${name}.pdf`, null).then((content) =>
            cy.writeFile(
              `test-results/order-exports/long-${kind}.pdf`,
              content,
              { encoding: null },
            )
          );
          cy.task<{ pages: number; text: string }>("download", `${name}.pdf`, {
            timeout: 120000,
          }).then((pdf) => {
            expect(pdf.pages).greaterThan(1);
            expect(pdf.text).contain(
              kind === "quotation" ? "8.000.000" : "8.710.000",
            );
          });
          cy.get('[data-cy="order-export-image"]').check();
          cy.get('[data-cy="order-export-submit"]').scrollIntoView().click();
          cy.readFile(`cypress/downloads/${name}_1.png`, null).should(
            "not.be.empty",
          );
          cy.readFile(`cypress/downloads/${name}_2.png`, null).should(
            "not.be.empty",
          );
        });
      });
    });
  }
  it("ORDER-EXPORT-STATES: load failure retries and cancelled order has no print action", () => {
    cy.task("seed", { scenario: "order" });
    loginMobile();
    cy.visit(`/tabs/orders/detail/${sourceId.order}`);
    cy.get('[data-cy="order-print"]').should("be.visible");
    cy.intercept({ method: "GET", url: `**/api/v1/orders/${sourceId.order}`, times: 1 }, { statusCode: 503, body: { success: false, data: null, message: "Không thể tải đơn hàng", statusCode: 503 } });
    cy.get('[data-cy="order-print"]').click();
    cy.get('ion-modal [role="alert"]').should("exist");
    cy.contains("Thử lại").click();
    cy.get('[data-cy="order-export-submit"]').should("not.be.disabled");
    cy.contains('ion-modal ion-button', "Đóng").click();
    cy.get("@login").then(interception => {
      const login = interception as unknown as { request: { url: string }; response: { body: { data: { token: string } } } };
      cy.request({ method: "PUT", url: login.request.url.replace("/auth/login", `/orders/${sourceId.order}`), headers: { Authorization: `Bearer ${login.response.body.data.token}` }, body: { status: "cancelled" } });
    });
    cy.reload();
    cy.get('[data-cy="order-print"]').should("not.exist");
  });
  it("ORDER-EXPORT-EMPTY: fully returned order cannot export", () => {
    cy.task("seed", { scenario: "order" });
    loginMobile();
    cy.get("@login").then(interception => {
      const login = interception as unknown as { request: { url: string }; response: { body: { data: { token: string } } } };
      cy.request({ method: "POST", url: login.request.url.replace("/auth/login", "/receipt-return"), headers: { Authorization: `Bearer ${login.response.body.data.token}` }, body: {
        type: "customer", refType: "order", refId: sourceId.order,
        customer: "00000000-0000-4000-8000-000000000010", status: "completed", operationType: "return",
        returnDate: new Date().toISOString(), reason: "khac", store: "TEST", totalAmount: 500000, totalQuantity: 5, totalProduct: 1,
        items: [{ productId: "00000000-0000-4000-8000-000000000101", productCode: 1001, productName: "Hàng gốc kiểm thử", quantity: 5, costPrice: 100000 }],
      } });
    });
    cy.visit(`/tabs/orders/detail/${sourceId.order}`);
    cy.get('[data-cy="order-print"]').click();
    cy.contains("Đơn hàng không còn sản phẩm để xuất.").should("be.visible");
    cy.get('[data-cy="order-export-submit"]').should("be.disabled");
  });
  it("ORDER-EXPORT-INTERNAL: internal transfer can print", () => {
    cy.task("seed", { scenario: "order" });
    loginMobile();
    cy.get("@login").then(interception => {
      const login = interception as unknown as { request: { url: string }; response: { body: { data: { token: string } } } };
      cy.request({ method: "POST", url: login.request.url.replace("/auth/login", "/orders"), headers: { Authorization: `Bearer ${login.response.body.data.token}` }, body: {
        paymentMethod: "cash", status: "draft", orderType: "internal_transfer", items: [{ productId: "00000000-0000-4000-8000-000000000101", code: "1001", productName: "Điều chuyển", quantity: 1, price: 100000, vatRate: 0 }],
      } }).then(response => {
        cy.visit(`/tabs/orders/detail/${response.body.data.id}`);
        cy.contains("Điều chuyển").should("exist");
        cy.get('[data-cy="order-print"]').should("be.visible");
      });
    });
  });
});
