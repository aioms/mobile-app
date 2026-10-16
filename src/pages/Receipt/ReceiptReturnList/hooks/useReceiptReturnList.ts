import { useState, useEffect, useCallback, useRef } from "react";
import {
  IReceiptReturn,
  IReceiptReturnSummary,
  ReceiptReturnStatus,
  ReceiptReturnType,
} from "@/types/receipt-return.type";
import useReceiptReturn from "@/hooks/apis/useReceiptReturn";
import { parseArrayData } from "@/helpers/common";
import { ReturnFilterState } from "../components/ReturnFilterModal";

export const initialFilterState: ReturnFilterState = {
  startDate: "",
  endDate: "",
  status: "all",
  operationType: "all",
  refType: "all",
};

const defaultSummary: IReceiptReturnSummary = {
  totalCount: 0,
  totalAmount: 0,
  trendPercent: 0,
  statusCounts: {
    all: 0,
    draft: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  },
};

export const useReceiptReturnList = () => {
  const { getList } = useReceiptReturn();

  // Tab: Customer or Supplier
  const [activeType, setActiveType] = useState<ReceiptReturnType>(
    ReceiptReturnType.CUSTOMER,
  );

  // Search & Filter state
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [advancedFilters, setAdvancedFilters] =
    useState<ReturnFilterState>(initialFilterState);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IReceiptReturn | null>(
    null,
  );

  // Data & loading state
  const [receipts, setReceipts] = useState<IReceiptReturn[]>([]);
  const [summary, setSummary] = useState<IReceiptReturnSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Keep latest request ID to prevent race conditions
  const requestIdRef = useRef(0);

  // Core data fetching function
  const fetchData = useCallback(
    async (
      currentPage: number,
      isRefresh: boolean,
      type: ReceiptReturnType,
      keyword: string,
      status: string,
      advFilters: ReturnFilterState,
    ) => {
      const currentRequestId = ++requestIdRef.current;

      if (isRefresh) {
        setIsLoading(true);
        setIsError(false);
      }

      try {
        const queryParams: Record<string, any> = {
          type,
        };

        if (keyword.trim()) {
          queryParams.keyword = keyword.trim();
        }

        const effectiveStatus =
          advFilters.status !== "all" ? advFilters.status : status;
        if (effectiveStatus !== "all") {
          queryParams.status = effectiveStatus;
        }

        if (advFilters.operationType !== "all") {
          queryParams.operationType = advFilters.operationType;
        }

        if (advFilters.startDate) {
          queryParams.startDate = advFilters.startDate;
        }
        if (advFilters.endDate) {
          queryParams.endDate = advFilters.endDate;
        }
        if (advFilters.refType !== "all") {
          queryParams.refType = advFilters.refType;
        }

        const limit = 15;
        const response = await getList(queryParams, currentPage, limit);

        // Ignore stale responses from previous requests
        if (currentRequestId !== requestIdRef.current) return;

        const rawData = parseArrayData(response) as IReceiptReturn[];
        const metadata = (response as any)?.metadata || {
          totalCount: rawData?.length || 0,
          totalPages: 1,
        };

        const list = Array.isArray(rawData) ? rawData : [];

        if (isRefresh || currentPage === 1) {
          setReceipts(list);

          const totalAmount = list.reduce((sum, item) => {
            const amount =
              item.operationType === "exchange" && item.differenceAmount
                ? item.differenceAmount
                : item.totalAmount || 0;
            return sum + (+amount || 0);
          }, 0);

          const statusCounts = {
            all: metadata.totalCount || list.length,
            draft: list.filter((i) => i.status === ReceiptReturnStatus.DRAFT)
              .length,
            processing: list.filter(
              (i) => i.status === ReceiptReturnStatus.PROCESSING,
            ).length,
            completed: list.filter(
              (i) => i.status === ReceiptReturnStatus.COMPLETED,
            ).length,
            cancelled: list.filter(
              (i) => i.status === ReceiptReturnStatus.CANCELLED,
            ).length,
          };

          setSummary({
            totalCount: metadata.totalCount || list.length,
            totalAmount,
            trendPercent: 0,
            statusCounts,
          });
        } else {
          setReceipts((prev) => [...prev, ...list]);
        }

        const currentTotalLoaded = (currentPage - 1) * limit + list.length;
        setHasMore(currentTotalLoaded < (metadata.totalCount || 0));
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          setIsError(true);
        }
      } finally {
        if (currentRequestId === requestIdRef.current && isRefresh) {
          setIsLoading(false);
        }
      }
    },
    [getList],
  );

  // Trigger fetch ONLY when filter parameters change by value (primitives)
  useEffect(() => {
    setPage(1);
    fetchData(
      1,
      true,
      activeType,
      searchText,
      selectedStatus,
      advancedFilters,
    );
  }, [
    activeType,
    searchText,
    selectedStatus,
    advancedFilters.startDate,
    advancedFilters.endDate,
    advancedFilters.status,
    advancedFilters.operationType,
    advancedFilters.refType,
    fetchData,
  ]);

  const handleRefresh = useCallback(async () => {
    setPage(1);
    await fetchData(
      1,
      true,
      activeType,
      searchText,
      selectedStatus,
      advancedFilters,
    );
  }, [fetchData, activeType, searchText, selectedStatus, advancedFilters]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchData(
      nextPage,
      false,
      activeType,
      searchText,
      selectedStatus,
      advancedFilters,
    );
  }, [hasMore, isLoading, page, fetchData, activeType, searchText, selectedStatus, advancedFilters]);

  const handleTabChange = useCallback((type: ReceiptReturnType) => {
    setActiveType(type);
    setSelectedStatus("all");
    setSearchText("");
  }, []);

  const activeFiltersCount = [
    advancedFilters.status !== "all",
    advancedFilters.operationType !== "all",
    advancedFilters.refType !== "all",
    Boolean(advancedFilters.startDate),
    Boolean(advancedFilters.endDate),
  ].filter(Boolean).length;

  return {
    activeType,
    receipts,
    summary,
    isLoading,
    isError,
    hasMore,
    searchText,
    selectedStatus,
    advancedFilters,
    isFilterModalOpen,
    selectedReceipt,
    activeFiltersCount,
    setSearchText,
    setSelectedStatus,
    setAdvancedFilters,
    setIsFilterModalOpen,
    setSelectedReceipt,
    handleTabChange,
    handleRefresh,
    handleLoadMore,
  };
};

export default useReceiptReturnList;
