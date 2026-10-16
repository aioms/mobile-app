// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { configure, render, screen, fireEvent, cleanup } from "@testing-library/react";
import ReturnPartnerTabs from "./components/ReturnPartnerTabs";
import ReturnStatusChips from "./components/ReturnStatusChips";
import ReturnSummaryCard from "./components/ReturnSummaryCard";
import ReturnCard from "./components/ReturnCard";
import ReturnFilterModal, { ReturnFilterState } from "./components/ReturnFilterModal";
import ReturnDetailModal from "./components/ReturnDetailModal";
import {
  IReceiptReturn,
  ReceiptReturnStatus,
  ReceiptReturnType,
} from "@/types/receipt-return.type";
import { PaymentMethod } from "@/common/enums/payment";

afterEach(() => {
  cleanup();
});

vi.mock("@ionic/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ionic/react")>();
  return {
    ...actual,
    IonModal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
      isOpen ? <div data-testid="ion-modal">{children}</div> : null,
  };
});

configure({ testIdAttribute: "data-cy" });

const mockCustomerReturn: IReceiptReturn = {
  id: "ret-001",
  receiptNumber: "TH260901",
  totalQuantity: 2,
  totalProduct: 1,
  totalAmount: 250000,
  returnDate: "2026-09-20T10:00:00.000Z",
  createdAt: "2026-09-20T10:00:00.000Z",
  status: ReceiptReturnStatus.COMPLETED,
  type: ReceiptReturnType.CUSTOMER,
  operationType: "return",
  paymentMethod: PaymentMethod.CASH,
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
  note: "Khách trả áo do rách tay",
};

const mockExchangeReturn: IReceiptReturn = {
  id: "ret-002",
  receiptNumber: "#TH260902",
  totalQuantity: 1,
  totalProduct: 1,
  totalAmount: 150000,
  differenceAmount: 30000,
  returnDate: "2026-09-21T11:00:00.000Z",
  createdAt: "2026-09-21T11:00:00.000Z",
  status: ReceiptReturnStatus.COMPLETED,
  type: ReceiptReturnType.CUSTOMER,
  operationType: "exchange",
  paymentMethod: PaymentMethod.CASH,
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
  note: "Đổi sang size L",
};

const mockSupplierReturn: IReceiptReturn = {
  id: "ret-003",
  receiptNumber: "THNCC003",
  totalQuantity: 5,
  totalProduct: 2,
  totalAmount: 500000,
  returnDate: "2026-09-22T14:00:00.000Z",
  createdAt: "2026-09-22T14:00:00.000Z",
  status: ReceiptReturnStatus.DRAFT,
  type: ReceiptReturnType.SUPPLIER,
  operationType: "return",
  supplier: {
    id: "sup-01",
    name: "Kho Vải Tân Bình",
    phone: "02838383838",
    group: "NCC chính",
  },
  items: [
    {
      productId: "prod-04",
      productCode: "SP04",
      productName: "Vải Cotton 100%",
      quantity: 5,
      costPrice: 100000,
    },
  ],
  reason: "Lỗi sản xuất",
};

describe("ReturnPartnerTabs Integration", () => {
  it("renders both tabs and handles tab change", () => {
    const handleChange = vi.fn();
    render(
      <ReturnPartnerTabs
        activeType={ReceiptReturnType.CUSTOMER}
        onChange={handleChange}
      />,
    );

    const customerBtn = screen.getByTestId("return-tab-customer");
    const supplierBtn = screen.getByTestId("return-tab-supplier");

    expect(customerBtn).toBeDefined();
    expect(supplierBtn).toBeDefined();

    fireEvent.click(supplierBtn);
    expect(handleChange).toHaveBeenCalledWith(ReceiptReturnType.SUPPLIER);
  });
});

describe("ReturnStatusChips Integration", () => {
  it("renders status chips with correct badge counts and responds to clicks", () => {
    const handleChange = vi.fn();
    const counts = {
      all: 10,
      draft: 2,
      processing: 1,
      completed: 6,
      cancelled: 1,
    };

    render(
      <ReturnStatusChips
        selectedStatus="all"
        onChange={handleChange}
        counts={counts}
      />,
    );

    const allChip = screen.getByTestId("return-status-chip-all");
    const draftChip = screen.getByTestId("return-status-chip-draft");
    const completedChip = screen.getByTestId("return-status-chip-completed");
    const cancelledChip = screen.getByTestId("return-status-chip-cancelled");

    expect(allChip).toBeDefined();
    expect(draftChip).toBeDefined();
    expect(completedChip).toBeDefined();
    expect(cancelledChip).toBeDefined();

    expect(allChip.textContent).toContain("10");
    // draft + processing = 3
    expect(draftChip.textContent).toContain("3");
    expect(completedChip.textContent).toContain("6");
    expect(cancelledChip.textContent).toContain("1");

    fireEvent.click(completedChip);
    expect(handleChange).toHaveBeenCalledWith(ReceiptReturnStatus.COMPLETED);
  });
});

describe("ReturnSummaryCard Integration", () => {
  it("renders totals and triggers scan callback", () => {
    const handleScan = vi.fn();
    render(
      <ReturnSummaryCard
        totalCount={42}
        totalAmount={12500000}
        trendPercent={-5}
        onScanClick={handleScan}
      />,
    );

    expect(screen.getByTestId("return-summary-count").textContent).toBe("42");
    expect(screen.getByTestId("return-summary-amount").textContent).toContain("12.500.000");

    const scanBtn = screen.getByLabelText("Quét mã vạch phiếu");
    fireEvent.click(scanBtn);
    expect(handleScan).toHaveBeenCalledTimes(1);
  });
});

describe("ReturnCard Integration", () => {
  it("renders customer refund card correctly with # prefixed and status badge", () => {
    const handleClick = vi.fn();
    render(<ReturnCard receipt={mockCustomerReturn} onClick={handleClick} />);

    expect(screen.getByTestId("return-card-code").textContent).toBe("#TH260901");
    expect(screen.getByTestId("return-card-partner").textContent).toBe("Nguyễn Văn A");
    expect(screen.getByTestId("return-card-badge").textContent).toBe("Đã hoàn tiền");
    expect(screen.getByTestId("return-card-amount").textContent).toContain("250.000");
    expect(screen.getByText("HOÀN TIỀN")).toBeDefined();

    fireEvent.click(screen.getByTestId("return-card"));
    expect(handleClick).toHaveBeenCalledWith(mockCustomerReturn);
  });

  it("renders exchange card displaying GIÁ TRỊ ĐỔI and difference amount", () => {
    const handleClick = vi.fn();
    render(<ReturnCard receipt={mockExchangeReturn} onClick={handleClick} />);

    expect(screen.getByTestId("return-card-code").textContent).toBe("#TH260902");
    expect(screen.getByTestId("return-card-badge").textContent).toBe("Đã đổi hàng");
    expect(screen.getByText("GIÁ TRỊ ĐỔI")).toBeDefined();
    expect(screen.getByTestId("return-card-amount").textContent).toContain("30.000");

    const detailBtn = screen.getByTestId("return-card-detail-btn");
    fireEvent.click(detailBtn);
    expect(handleClick).toHaveBeenCalledWith(mockExchangeReturn);
  });

  it("renders supplier return card with DRAFT status badge", () => {
    const handleClick = vi.fn();
    render(<ReturnCard receipt={mockSupplierReturn} onClick={handleClick} />);

    expect(screen.getByTestId("return-card-partner").textContent).toBe("Kho Vải Tân Bình");
    expect(screen.getByTestId("return-card-badge").textContent).toBe("Chờ duyệt");
    expect(screen.getByTestId("return-card-amount").textContent).toContain("500.000");
  });
});

describe("ReturnDetailModal Integration", () => {
  it("renders detailed slip information and dismisses on close", () => {
    const handleClose = vi.fn();
    render(
      <ReturnDetailModal
        isOpen={true}
        onClose={handleClose}
        receipt={mockExchangeReturn}
      />,
    );

    expect(screen.getByTestId("return-detail-code").textContent).toBe("#TH260902");
    expect(screen.getByTestId("return-detail-partner-name").textContent).toBe("Trần Thị B");
    expect(screen.getByText("Quần âu Slim")).toBeDefined();
    expect(screen.getByText("Quần Jean Regular")).toBeDefined();
    expect(screen.getByText("Đổi sản phẩm")).toBeDefined();
    expect(screen.getByText("Đổi sang size L")).toBeDefined();
    expect(screen.getByTestId("return-detail-total-amount").textContent).toContain("30.000");

    const closeBtn = screen.getByTestId("return-detail-close-btn");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe("ReturnFilterModal Integration", () => {
  const initialFilters: ReturnFilterState = {
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    status: "all",
    operationType: "all",
    refType: "all",
  };

  it("selects filter options, applies them, and can reset", () => {
    const handleClose = vi.fn();
    const handleApply = vi.fn();

    render(
      <ReturnFilterModal
        isOpen={true}
        onClose={handleClose}
        onApply={handleApply}
        currentFilters={initialFilters}
      />,
    );

    // Select operation: exchange
    const exchangeBtn = screen.getByTestId("return-filter-op-exchange");
    fireEvent.click(exchangeBtn);

    // Select status: completed
    const completedBtn = screen.getByTestId("return-filter-status-completed");
    fireEvent.click(completedBtn);

    // Select refType: order
    const orderRefBtn = screen.getByTestId("return-filter-ref-order");
    fireEvent.click(orderRefBtn);

    // Click apply
    const applyBtn = screen.getByTestId("return-filter-apply");
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      status: "completed",
      operationType: "exchange",
      refType: "order",
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("resets filter options to default values when reset button clicked", () => {
    const handleClose = vi.fn();
    const handleApply = vi.fn();

    render(
      <ReturnFilterModal
        isOpen={true}
        onClose={handleClose}
        onApply={handleApply}
        currentFilters={{
          startDate: "2026-09-01",
          endDate: "2026-09-30",
          status: "completed",
          operationType: "exchange",
          refType: "order",
        }}
      />,
    );

    const resetBtn = screen.getByTestId("return-filter-reset");
    fireEvent.click(resetBtn);

    const applyBtn = screen.getByTestId("return-filter-apply");
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith({
      startDate: "",
      endDate: "",
      status: "all",
      operationType: "all",
      refType: "all",
    });
  });
});
