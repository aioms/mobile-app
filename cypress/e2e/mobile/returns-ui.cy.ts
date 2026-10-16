/// <reference types="cypress" />

describe("Receipt Return UI Module E2E", () => {
  const mockCustomerReturns = [
    {
      id: "ret-001",
      receiptNumber: "TH260901",
      totalQuantity: 2,
      totalProduct: 1,
      totalAmount: 250000,
      returnDate: "2026-09-20T10:00:00.000Z",
      createdAt: "2026-09-20T10:00:00.000Z",
      status: "completed",
      type: "customer",
      operationType: "return",
      customer: {
        id: "cust-01",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        group: "Khách quen",
      },
      items: [
        {
          productId: "prod-01",
          productCode: "SP01",
          productName: "Áo sơ mi Oxford",
          quantity: 2,
          unitPrice: 125000,
          costPrice: 125000,
        },
      ],
      reason: "Sản phẩm lỗi",
      note: "Áo lỗi đường may",
    },
    {
      id: "ret-002",
      receiptNumber: "TH260902",
      totalQuantity: 1,
      totalProduct: 1,
      totalAmount: 180000,
      differenceAmount: 30000,
      returnDate: "2026-09-21T11:00:00.000Z",
      createdAt: "2026-09-21T11:00:00.000Z",
      status: "completed",
      type: "customer",
      operationType: "exchange",
      customer: {
        id: "cust-02",
        name: "Trần Thị B",
        phone: "0987654321",
      },
      items: [
        {
          productId: "prod-02",
          productCode: "SP02",
          productName: "Quần âu Slim",
          quantity: 1,
          unitPrice: 150000,
        },
      ],
      exchangeItems: [
        {
          productId: "prod-03",
          productCode: "SP03",
          productName: "Quần Jean Regular",
          quantity: 1,
          unitPrice: 180000,
        },
      ],
      reason: "Đổi sản phẩm",
    },
  ];

  const mockSupplierReturns = [
    {
      id: "ret-sup-001",
      receiptNumber: "THNCC001",
      totalQuantity: 10,
      totalProduct: 1,
      totalAmount: 1000000,
      returnDate: "2026-09-22T09:00:00.000Z",
      createdAt: "2026-09-22T09:00:00.000Z",
      status: "draft",
      type: "supplier",
      operationType: "return",
      supplier: {
        id: "sup-01",
        name: "Công ty Vải Sài Gòn",
        phone: "0281234567",
        group: "NCC chính",
      },
      items: [
        {
          productId: "prod-04",
          productCode: "SP04",
          productName: "Vải Kaki loại 1",
          quantity: 10,
          costPrice: 100000,
        },
      ],
      reason: "Lỗi sản xuất",
    },
  ];

  function setupAuthAndRoutes() {
    // Catch-all mocks for other background APIs so Axios doesn't get 401 and redirect to /login
    cy.intercept("GET", "**/api/v1/**", {
      statusCode: 200,
      body: { success: true, data: [] },
    });
    cy.intercept("POST", "**/api/v1/**", {
      statusCode: 200,
      body: { success: true, data: {} },
    });

    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          token: "mock-token-abc",
          user: {
            id: "u-admin",
            name: "Admin User",
            username: "test-admin",
            role: "ADMIN",
          },
        },
      },
    }).as("login");

    cy.intercept("GET", "**/api/v1/receipt-return/ret-001", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          receipt: mockCustomerReturns[0],
          items: mockCustomerReturns[0].items,
        },
      },
    }).as("getDetail");

    cy.intercept("GET", "**/api/v1/receipt-return*", (req) => {
      const url = new URL(req.url);
      const type = url.searchParams.get("type");
      const keyword = url.searchParams.get("keyword");

      if (keyword === "NOTFOUND") {
        req.alias = "getCustomerReturns";
        req.reply({
          statusCode: 200,
          body: { success: true, data: [], metadata: { totalCount: 0 } },
        });
        return;
      }

      if (type === "supplier") {
        req.alias = "getSupplierReturns";
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: mockSupplierReturns,
            metadata: { totalCount: 1 },
          },
        });
        return;
      }

      req.alias = "getCustomerReturns";
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: mockCustomerReturns,
          metadata: { totalCount: 2 },
        },
      });
    });
  }

  function loginAndNavigate(targetPath?: string) {
    setupAuthAndRoutes();
    cy.visit("/login", {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      },
    });

    cy.window().then(async (win) => {
      const databases = await win.indexedDB.databases();
      await Promise.all(
        databases
          .filter((db) => db.name)
          .map(
            (db) =>
              new Promise<void>((resolve, reject) => {
                const request = win.indexedDB.open(db.name!);
                request.onsuccess = () => {
                  const database = request.result;
                  const stores = Array.from(database.objectStoreNames);
                  if (!stores.length) {
                    database.close();
                    resolve();
                    return;
                  }
                  const transaction = database.transaction(stores, "readwrite");
                  stores.forEach((store) => transaction.objectStore(store).clear());
                  transaction.oncomplete = () => {
                    database.close();
                    resolve();
                  };
                  transaction.onerror = () => {
                    database.close();
                    reject(transaction.error);
                  };
                };
                request.onerror = () => reject(request.error);
                request.onblocked = () => reject(new Error("IndexedDB reset blocked"));
              }),
          ),
      );
    });

    cy.reload();
    cy.get('[data-cy="login-username"] input').type("test-admin");
    cy.get('[data-cy="login-password"] input').type("test-only-password", { log: false });
    cy.get('[data-cy="login-submit"]').scrollIntoView().click();
    cy.wait("@login");
    cy.location("pathname").should("contain", "/tabs");

    if (targetPath && targetPath !== "/tabs/home") {
      cy.visit(targetPath);
    }
  }

  it("navigates from Extended menu to Returns list", () => {
    loginAndNavigate();
    // Navigate via bottom tab bar to Extended
    cy.get('ion-tab-button[href="/tabs/extended"]').scrollIntoView().click();
    cy.location("pathname").should("contain", "/tabs/extended");
    cy.contains("Tính năng mở rộng").should("be.visible");
    cy.get('[data-cy="return-module-card"]').scrollIntoView().should("be.visible").click();
    cy.location("pathname").should("contain", "/tabs/extended/receipt-returns");
    cy.contains("Danh sách phiếu trả").should("be.visible");
  });

  it("renders partner tabs, summary statistics, and return cards", () => {
    loginAndNavigate("/tabs/extended/receipt-returns");
    cy.wait("@getCustomerReturns");

    // Partner Tabs: Customer tab active by default
    cy.get('[data-cy="return-tab-customer"]').should("be.visible");
    cy.get('[data-cy="return-tab-supplier"]').should("be.visible");

    // Summary Card metrics
    cy.get('[data-cy="return-summary-card"]').should("be.visible");
    cy.get('[data-cy="return-summary-count"]').should("contain", "2");

    // Cards check
    cy.get('[data-cy="return-card"]').should("have.length", 2);
    cy.get('[data-cy="return-card-code"]').first().should("contain", "#TH260901");
    cy.get('[data-cy="return-card-partner"]').first().should("contain", "Nguyễn Văn A");
    cy.get('[data-cy="return-card-badge"]').first().should("contain", "Đã hoàn tiền");

    // Second card: Exchange badge
    cy.get('[data-cy="return-card-badge"]').last().should("contain", "Đã đổi hàng");

    // Switch to Supplier tab
    cy.get('[data-cy="return-tab-supplier"]').click();
    cy.wait("@getSupplierReturns");

    // Supplier card check
    cy.get('[data-cy="return-card"]').should("have.length", 1);
    cy.get('[data-cy="return-card-partner"]').should("contain", "Công ty Vải Sài Gòn");
    cy.get('[data-cy="return-card-badge"]').should("contain", "Chờ duyệt");
  });

  it("shows empty state on unmatched search and navigates to create return", () => {
    loginAndNavigate("/tabs/extended/receipt-returns");
    cy.wait("@getCustomerReturns");

    // Search for nonexistent slip
    cy.get('[data-cy="return-searchbar"] input').type("NOTFOUND");
    cy.wait("@getCustomerReturns");

    cy.get('[data-cy="return-empty-state"]').should("be.visible");
    cy.contains("Không tìm thấy phiếu trả nào").should("be.visible");

    // Click create button from empty state
    cy.get('[data-cy="return-empty-create-btn"]').click();
    cy.location("pathname").should("contain", "/tabs/receipt/return");
    cy.contains("Tạo phiếu đổi/trả hàng").should("be.visible");
  });

  it("opens Return Detail modal and inspects slip breakdown", () => {
    loginAndNavigate("/tabs/extended/receipt-returns");
    cy.wait("@getCustomerReturns");

    // Click detail button on first card
    cy.get('[data-cy="return-card-detail-btn"]').first().click();
    cy.wait("@getDetail");

    cy.get('[data-cy="return-detail-modal"]').should("be.visible");
    cy.get('[data-cy="return-detail-code"]').should("contain", "#TH260901");
    cy.get('[data-cy="return-detail-partner-name"]').should("contain", "Nguyễn Văn A");
    cy.get('[data-cy="return-detail-modal"]').within(() => {
      cy.contains("Áo sơ mi Oxford").should("be.visible");
      cy.get('[data-cy="return-detail-total-amount"]').should("contain", "250.000");
    });

    // Close modal
    cy.get('[data-cy="return-detail-close-btn"]').click();
    cy.get('[data-cy="return-detail-modal"]').should("not.exist");
  });

  it("operates advanced filter modal: select, reset, and apply", () => {
    loginAndNavigate("/tabs/extended/receipt-returns");
    cy.wait("@getCustomerReturns");

    // Open filter modal via filter button in searchbar
    cy.get('[data-cy="return-searchbar"] ion-button').first().click();
    cy.get('[data-cy="return-filter-modal"]').should("be.visible");

    // Select options
    cy.get('[data-cy="return-filter-op-exchange"]').click();
    cy.get('[data-cy="return-filter-status-completed"]').click();
    cy.get('[data-cy="return-filter-ref-order"]').click();

    // Reset filters
    cy.get('[data-cy="return-filter-reset"]').click({ force: true });

    // Apply filters
    cy.get('[data-cy="return-filter-apply"]').click({ force: true });
    cy.wait("@getCustomerReturns");
  });

  it("validates return form: empty products and supplier requirement", () => {
    loginAndNavigate("/tabs/receipt/return");
    cy.contains("Tạo phiếu đổi/trả hàng").should("be.visible");

    // 1. Submit empty customer form -> error
    cy.get('[data-cy="return-confirm"]').scrollIntoView().click();
    cy.contains("Vui lòng chọn ít nhất 1 sản phẩm trả").should("be.visible");

    // 2. Switch to Supplier type
    cy.get('[data-cy="return-type-supplier"]').click();
    cy.contains("Tạo phiếu trả hàng NCC").should("be.visible");
    cy.get('[data-cy="return-select-supplier-btn"]').should("be.visible");

    // Submit empty supplier form -> missing supplier error
    cy.get('[data-cy="return-confirm"]').scrollIntoView().click();
    cy.contains("Vui lòng chọn nhà cung cấp").should("be.visible");

    // 3. Switch back to Customer type and check custom reason
    cy.get('[data-cy="return-type-customer"]').click();
    cy.get('[data-cy="return-reason"]').scrollIntoView().click();
    cy.contains("ion-popover ion-item", "Lý do khác").click();

    cy.get('input[data-cy="custom-return-reason"]')
      .should("be.visible")
      .click({ force: true })
      .type("Đổi kích cỡ cho vừa dáng", { force: true })
      .should("have.value", "Đổi kích cỡ cho vừa dáng");
  });
});
