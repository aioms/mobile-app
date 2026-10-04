/** Wait for embedded assets before measuring or capturing a document. */
export async function waitForDocumentAssets(element: HTMLElement) {
  await document.fonts.ready;
  await Promise.all(
    Array.from(element.querySelectorAll("img")).map(async (image) => {
      await image.decode();
      if (!image.naturalWidth) throw new Error("Không tải được logo");
    }),
  );
}

/** Build measured pages, repeating header/table heading and keeping rows/footer intact.
 * Caller owns returned host and must remove it after capture, including on failure.
 */
export function paginateDocument(element: HTMLDivElement, maxHeight: number) {
  const host = document.createElement("div");
  Object.assign(host.style, { position: "fixed", left: "-20000px", top: "0" });
  document.body.appendChild(host);
  const header = element.querySelector("[data-document-header]");
  const table = element.querySelector<HTMLTableElement>(
    "[data-document-table]",
  );
  const footer = element.querySelector("[data-document-footer]");
  if (!header || !table || !footer) {
    host.remove();
    throw new Error("Thiếu nội dung tài liệu");
  }
  const pages: HTMLDivElement[] = [];
  const newPage = () => {
    const page = element.cloneNode(false) as HTMLDivElement;
    page.appendChild(header.cloneNode(true));
    const pageTable = table.cloneNode(true) as HTMLTableElement;
    pageTable.tBodies[0].replaceChildren();
    page.appendChild(pageTable);
    host.appendChild(page);
    pages.push(page);
    return { page, body: pageTable.tBodies[0] };
  };
  try {
    let current = newPage();
    for (const row of Array.from(table.tBodies[0].rows)) {
      const clone = row.cloneNode(true) as HTMLElement;
      current.body.appendChild(clone);
      if (current.page.offsetHeight <= maxHeight) continue;
      clone.remove();
      current = newPage();
      current.body.appendChild(clone);
      if (current.page.offsetHeight > maxHeight) {
        throw new Error(
          "Một dòng hàng quá dài để xuất. Vui lòng rút gọn tên hàng.",
        );
      }
    }
    const last = footer.cloneNode(true) as HTMLElement;
    current.page.appendChild(last);
    if (current.page.offsetHeight > maxHeight) {
      last.remove();
      current = newPage();
      current.page.querySelector("table")?.remove();
      current.page.appendChild(last);
      if (current.page.offsetHeight > maxHeight) {
        throw new Error("Phần tổng tài liệu quá dài");
      }
    }
    return { host, pages };
  } catch (error) {
    host.remove();
    throw error;
  }
}
