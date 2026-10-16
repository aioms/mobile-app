// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useReceiptReturnList from "./useReceiptReturnList";
import { ReceiptReturnStatus, ReceiptReturnType } from "@/types/receipt-return.type";

const mockGetList = vi.fn();

vi.mock("@/hooks/apis/useReceiptReturn", () => ({
  default: () => ({
    getList: mockGetList,
  }),
}));

describe("useReceiptReturnList Hook Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleItems = [
    {
      id: "1",
      receiptNumber: "TH01",
      totalAmount: 100000,
      totalQuantity: 1,
      totalProduct: 1,
      status: ReceiptReturnStatus.COMPLETED,
      type: ReceiptReturnType.CUSTOMER,
      operationType: "return",
    },
    {
      id: "2",
      receiptNumber: "TH02",
      totalAmount: 200000,
      differenceAmount: 50000,
      totalQuantity: 2,
      totalProduct: 1,
      status: ReceiptReturnStatus.DRAFT,
      type: ReceiptReturnType.CUSTOMER,
      operationType: "exchange",
    },
  ];

  it("loads initial customer return data with summary calculations", async () => {
    mockGetList.mockResolvedValueOnce({
      data: sampleItems,
      metadata: { totalCount: 2, totalPages: 1 },
    });

    const { result } = renderHook(() => useReceiptReturnList());

    await waitFor(() => {
      expect(result.current.receipts.length).toBe(2);
    });

    expect(mockGetList).toHaveBeenCalledWith(
      expect.objectContaining({ type: ReceiptReturnType.CUSTOMER }),
      1,
      15,
    );

    expect(result.current.activeType).toBe(ReceiptReturnType.CUSTOMER);
    expect(result.current.summary.totalCount).toBe(2);
    // 100000 (from return) + 50000 (from exchange difference) = 150000
    expect(result.current.summary.totalAmount).toBe(150000);
    expect(result.current.summary.statusCounts.completed).toBe(1);
    expect(result.current.summary.statusCounts.draft).toBe(1);
  });

  it("switches partner tab to supplier and resets search and status", async () => {
    mockGetList.mockResolvedValue({
      data: [],
      metadata: { totalCount: 0, totalPages: 1 },
    });

    const { result } = renderHook(() => useReceiptReturnList());

    act(() => {
      result.current.setSearchText("Tìm kiếm");
      result.current.setSelectedStatus("draft");
    });

    act(() => {
      result.current.handleTabChange(ReceiptReturnType.SUPPLIER);
    });

    expect(result.current.activeType).toBe(ReceiptReturnType.SUPPLIER);
    expect(result.current.searchText).toBe("");
    expect(result.current.selectedStatus).toBe("all");

    await waitFor(() => {
      expect(mockGetList).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: ReceiptReturnType.SUPPLIER }),
        1,
        15,
      );
    });
  });

  it("applies advanced filters and forwards them to API", async () => {
    mockGetList.mockResolvedValue({
      data: [],
      metadata: { totalCount: 0, totalPages: 1 },
    });

    const { result } = renderHook(() => useReceiptReturnList());

    act(() => {
      result.current.setAdvancedFilters({
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: ReceiptReturnStatus.COMPLETED,
        operationType: "exchange",
        refType: "order",
      });
    });

    await waitFor(() => {
      expect(mockGetList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: ReceiptReturnType.CUSTOMER,
          startDate: "2026-09-01",
          endDate: "2026-09-30",
          status: ReceiptReturnStatus.COMPLETED,
          operationType: "exchange",
          refType: "order",
        }),
        1,
        15,
      );
    });

    expect(result.current.activeFiltersCount).toBe(5);
  });

  it("handles pagination via handleLoadMore", async () => {
    mockGetList
      .mockResolvedValueOnce({
        data: [sampleItems[0]],
        metadata: { totalCount: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        data: [sampleItems[1]],
        metadata: { totalCount: 2, totalPages: 2 },
      });

    const { result } = renderHook(() => useReceiptReturnList());

    await waitFor(() => {
      expect(result.current.receipts.length).toBe(1);
      expect(result.current.hasMore).toBe(true);
    });

    await act(async () => {
      await result.current.handleLoadMore();
    });

    await waitFor(() => {
      expect(result.current.receipts.length).toBe(2);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it("sets isError to true when API call fails", async () => {
    mockGetList.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useReceiptReturnList());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
