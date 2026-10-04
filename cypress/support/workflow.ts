export const sourceId = {
  order: "00000000-0000-4000-8000-000000000501",
  debt: "00000000-0000-4000-8000-000000000201",
};
export interface State {
  debts: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  returns: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  customers: Array<Record<string, unknown>>;
}

export function loginMobile() {
  cy.intercept("POST", "**/api/v1/auth/login").as("login");
  cy.visit("/login", { onBeforeLoad(win) {
    win.localStorage.clear();
    win.sessionStorage.clear();
  } });
  cy.window().then(async (win) => {
    const databases = await win.indexedDB.databases();
    await Promise.all(databases.filter((db) => db.name).map((db) => new Promise<void>((resolve, reject) => {
      const request = win.indexedDB.open(db.name!);
      request.onsuccess = () => {
        const database = request.result;
        const stores = Array.from(database.objectStoreNames);
        if (!stores.length) { database.close(); resolve(); return; }
        const transaction = database.transaction(stores, "readwrite");
        stores.forEach((store) => transaction.objectStore(store).clear());
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB reset blocked"));
    })));
  });
  cy.reload();
  cy.get('[data-cy="login-username"] input').type("test-admin");
  cy.get('[data-cy="login-password"] input').type("test-only-password", { log: false });
  cy.get('[data-cy="login-submit"]').scrollIntoView().click();
  cy.wait("@login").its("response.body.data.token").should("be.a", "string");
  cy.location("pathname").should("contain", "/tabs");
}

export function openReturn(source: "order" | "debt", id = sourceId[source]) {
  const path = source === "order" ? "orders" : "debt";
  cy.intercept("GET", `**/api/v1/${source === "order" ? "orders" : "receipt-debt"}/${id}*`).as("source");
  cy.visit(`/tabs/${path}/detail/${id}`);
  cy.wait("@source").its("response.body.success").should("eq", true);
  cy.get('[data-cy="source-actions"]').scrollIntoView().click();
  cy.contains(".action-sheet-button", source === "order" ? "Trả hàng" : "Đổi/trả hàng").click();
  cy.get('[data-cy="return-select-products"]').scrollIntoView().click();
  cy.get('ion-modal [data-cy="return-source-checkbox"]').first().scrollIntoView().click();
  cy.get('ion-modal [data-cy="return-selection-confirm"]').scrollIntoView().click();
  cy.get('[data-cy="return-quantity"]').clear().type("1").blur();
}

export function selectReason(label: string) {
  cy.get('.ion-page:not(.ion-page-hidden) [data-cy="return-reason"]').scrollIntoView().scrollIntoView().click();
  cy.contains("ion-popover ion-item", label).click();
}

export function addReplacement(price: number) {
  selectReason("Đổi sản phẩm");
  cy.get('[data-cy="exchange-select-products"]').first().scrollIntoView().click();
  cy.contains("ion-modal", "Hàng nhận kiểm thử").within(() => {
    cy.contains("Hàng nhận kiểm thử").click();
    cy.contains("ion-button", "Xác nhận").click();
  });
  cy.get('[data-cy="exchange-price"]').clear().type(String(price)).blur();
}

export function submitReturn(draft = false) {
  cy.intercept("POST", "**/api/v1/receipt-return").as("saveReturn");
  cy.get(`[data-cy="${draft ? "return-save-draft" : "return-confirm"}"]`).scrollIntoView().click();
  return cy.wait("@saveReturn").then((result) => {
    expect(result.response?.body.success).eq(true);
    return result.response?.body.data.id as string;
  });
}

export function assertDebt(total: number, paid: number, remaining: number) {
  cy.visit(`/tabs/debt/detail/${sourceId.debt}`);
  for (const [field, value] of [["total", total], ["paid", paid], ["remaining", remaining]] as const) {
    cy.get(`[data-cy="debt-${field}"]`).should(($value) => {
      expect(Number($value.text().replace(/[^0-9-]/g, ""))).eq(value);
    });
  }
}
