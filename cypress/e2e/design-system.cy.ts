/// <reference types="cypress" />
/* global cy, describe, expect, it */

const viewports = [
  { id: "mobile-390", width: 390, height: 844 },
  { id: "mobile-393", width: 393, height: 852 },
  { id: "mobile-412", width: 412, height: 915 },
  { id: "tablet-768", width: 768, height: 1024 },
] as const;

const catalogPath = "/internal/ui-kit";
const longVietnameseText =
  "Đơn hàng doanh nghiệp có tên rất dài cần giữ nguyên để người dùng hiểu đầy đủ ngữ cảnh khi thao tác trên màn hình nhỏ.";
const longBadge =
  "Đang chờ xác nhận thanh toán từ nhà cung cấp trong kỳ đối soát tháng này";

describe("Design System catalog viewport matrix", () => {
  it("passes touch, keyboard, content, axe and screenshot gates", () => {
    cy.visit(catalogPath);
    cy.get('[data-testid="ui-kit-page"]').should("be.visible");
    cy.get(".ds-root").should("exist");
    cy.contains("h1", "AIOM Design System").should("be.visible");

    viewports.forEach(({ id, width, height }, viewportIndex) => {
      cy.viewport(width, height);

      cy.document().then((document) => {
        expect(
          document.documentElement.scrollWidth,
          "document scroll width",
        ).to.be.at.most(document.documentElement.clientWidth);
      });

      cy.get(".ds-root")
        .find("button, input, [role='button']")
        .each(($element) => {
          const rectangle = $element[0].getBoundingClientRect();

          expect(rectangle.width, `${$element[0].tagName} width`).to.be.at.least(
            44,
          );
          expect(
            rectangle.height,
            `${$element[0].tagName} height`,
          ).to.be.at.least(44);
        });

      cy.contains('[role="button"]', "Interactive card")
        .focus()
        .should("have.focus")
        .trigger("keydown", { key: "Enter", code: "Enter" });

      cy.contains(`Visible responses: ${viewportIndex + 1}`).should("exist");

      [longVietnameseText, "9.999.999.999 ₫", longBadge].forEach(
        (content) => {
          cy.contains(content)
            .should("exist")
            .then(($element) => {
              expect(
                $element[0].scrollWidth,
                `${content.slice(0, 24)} content width`,
              ).to.be.at.most($element[0].clientWidth + 1);
            });
        },
      );
      cy.contains("Nội dung rỗng có chủ đích").should("exist");

      cy.contains("button", "Disabled").should("be.disabled");
      cy.contains("button", "Loading")
        .should("be.disabled")
        .and("have.attr", "aria-busy", "true");
      cy.get('input[aria-invalid="true"]').should("exist");
      cy.get('[role="status"][aria-live="polite"]').should("exist");

      cy.injectAxe();
      cy.checkA11y(".ds-root");

      cy.screenshot(`catalog-${id}-${width}x${height}`, {
        capture: "fullPage",
      });
    });

    cy.viewport(390, 844);
    cy.get('[data-testid="ui-kit-benchmark"][data-row-count="200"]')
      .find("[data-benchmark-row]")
      .should("have.length", 200);
    cy.contains("button", "Chạy phép đo catalog").click();
    cy.contains("Trạng thái đo: complete", { timeout: 30_000 }).should("exist");
    cy.contains(/Interaction: 20\/20 mẫu ≤100 ms/).should("exist");
    cy.contains(/Scroll: (19|20)\/20 segment sạch/).should("exist");
    cy.contains(/212 benchmark rows, 0 nested scroll/).should("exist");
  });
});
