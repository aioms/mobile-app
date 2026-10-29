// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { paginateDocument } from "./orderDocumentPages";

function receipt(rows: number[]) {
  const element = document.createElement("div");
  element.innerHTML = `<div data-document-header>Phiếu thu</div><table data-document-table><thead><tr><th>Tên hàng</th></tr></thead><tbody>${rows.map((height, i) => `<tr data-height="${height}"><td>Hàng ${i}</td></tr>`).join("")}</tbody></table><div data-document-footer>Tổng: 46.135.000; Đã thanh toán: 5.000.000; Còn lại: 15.135.000</div>`;
  document.body.appendChild(element);
  return element;
}

describe("receipt PDF pages", () => {
  afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });
  function measure() {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return 100 + Array.from(this.querySelectorAll("tbody tr")).reduce((sum, row) => sum + Number((row as HTMLElement).dataset.height), 0)
        + (this.querySelector("[data-document-footer]") ? 150 : 0);
    });
  }
  it("preserves every multiline row once across a long receipt and repeats table headings", () => {
    measure();
    const element = receipt(Array(240).fill(47));
    const { host, pages } = paginateDocument(element, 1000);
    expect(pages.length).toBeGreaterThan(10);
    expect(pages.every(page => page.offsetHeight <= 1000)).toBe(true);
    const items = pages.flatMap(page => Array.from(page.querySelectorAll("tbody tr"), row => row.textContent));
    expect(items).toEqual(Array.from({ length: 240 }, (_, i) => `Hàng ${i}`));
    expect(pages.every(page => page.querySelector("thead")?.textContent === "Tên hàng")).toBe(true);
    expect(host.querySelectorAll("[data-document-footer]")).toHaveLength(1);
    expect(pages.at(-1)?.textContent).toContain("Còn lại: 15.135.000");
  });
  it("moves the whole payment summary onto a new page when it cannot fit", () => {
    measure();
    const { pages } = paginateDocument(receipt([400, 400]), 1000);
    expect(pages).toHaveLength(2);
    expect(pages[0].querySelector("[data-document-footer]")).toBeNull();
    expect(pages[1].textContent).toContain("Đã thanh toán: 5.000.000");
    expect(pages[1].textContent).toContain("Còn lại: 15.135.000");
  });
  it("fails visibly instead of clipping an oversized row and removes temporary pages", () => {
    measure();
    const element = receipt([1100]);
    expect(() => paginateDocument(element, 1000)).toThrow("Một dòng hàng quá dài");
    expect(document.body.children).toHaveLength(1);
  });
});
