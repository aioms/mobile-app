import React, { useState, useEffect, useMemo } from "react";
import { debounce } from "radash";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
} from "@ionic/react";
import { filterOutline, searchOutline, add, receiptOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { formatCurrency } from "@/helpers/formatters";
import dayjs from "dayjs";

import { AppButton } from "@/components/UI";
import PaymentReceiptCard from "./components/PaymentReceiptCard";
import PaymentReceiptFilter from "./components/PaymentReceiptFilter";
import PaymentReceiptFilterModal, { FilterState } from "./components/PaymentReceiptFilterModal";
import { ReceiptPaymentStatus } from "@/common/enums/receipt";
import useReceiptPayment from "@/hooks/apis/useReceiptPayment";
import { mapBackendToReceiptPayment } from "../common/utils";
import { IReceiptPayment } from "@/types/receiptPayment.type";

const PaymentReceiptListScreen: React.FC = () => {
  const history = useHistory();
  const { getList, getSummary } = useReceiptPayment();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    expenseType: "all",
    startDate: "",
    endDate: "",
    paymentMethod: "all",
    isDirectExport: null,
  });

  const [receipts, setReceipts] = useState<IReceiptPayment[]>([]);
  const [totalAmountToday, setTotalAmountToday] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSetKeyword = useMemo(
    () => debounce({ delay: 500 }, (val: string) => setSearchKeyword(val)),
    []
  );

  useEffect(() => {
    debouncedSetKeyword(searchTerm);
  }, [searchTerm, debouncedSetKeyword]);

  const activeFilterCount = [
    advancedFilters.expenseType !== "all",
    advancedFilters.paymentMethod !== "all",
    advancedFilters.isDirectExport !== null,
    advancedFilters.startDate !== "",
    advancedFilters.endDate !== "",
  ].filter(Boolean).length;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async (pageNumber: number = 1, isRefresh: boolean = true) => {
    if (isRefresh) {
      setIsLoading(true);
    }
    try {
      // 1. Fetch Today's Summary
      if (isRefresh) {
        const todayStr = dayjs().format("YYYY-MM-DD");
        const summary = await getSummary({ paymentDate: todayStr });
        if (summary) {
          setTotalAmountToday((summary.totalPaidAmount || 0) + (summary.totalDebtAmount || 0));
        } else {
          setTotalAmountToday(0);
        }
      }

      // 2. Fetch List of payments
      const apiFilters: Record<string, any> = {};
      if (searchKeyword.trim()) {
        apiFilters.keyword = searchKeyword;
      }
      if (advancedFilters.expenseType !== "all") {
        apiFilters.expenseType = advancedFilters.expenseType;
      }
      if (advancedFilters.startDate) {
        apiFilters.startDate = advancedFilters.startDate;
      }
      if (advancedFilters.endDate) {
        apiFilters.endDate = advancedFilters.endDate;
      }
      if (advancedFilters.paymentMethod !== "all") {
        apiFilters.paymentMethod = advancedFilters.paymentMethod;
      }
      if (advancedFilters.isDirectExport !== null) {
        apiFilters.isDirectExport = advancedFilters.isDirectExport.toString();
      }
      
      if (activeFilter !== "all") {
        if (activeFilter === ReceiptPaymentStatus.PAID) {
          apiFilters.status = `${ReceiptPaymentStatus.PAID},${ReceiptPaymentStatus.DEBT_PAYMENT}`;
        } else {
          apiFilters.status = activeFilter;
        }
      }

      const limit = 15;
      const response = await getList(apiFilters, pageNumber, limit);
      if (response && response.success && Array.isArray(response.data)) {
        const mapped = response.data.map((item: any) => mapBackendToReceiptPayment(item));
        if (isRefresh) {
          setReceipts(mapped);
        } else {
          setReceipts((prev) => [...prev, ...mapped]);
        }

        const metadata = response.metadata;
        if (metadata && typeof metadata.totalPages === "number") {
          setHasMore(pageNumber < metadata.totalPages);
        } else {
          setHasMore(mapped.length === limit);
        }
      } else {
        if (isRefresh) {
          setReceipts([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching receipt payments:", err);
      if (isRefresh) {
        setReceipts([]);
      }
      setHasMore(false);
    } finally {
      if (isRefresh) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(1, true);
    setPage(1);
  }, [searchKeyword, activeFilter, advancedFilters]);

  useIonViewWillEnter(() => {
    fetchData(1, true);
    setPage(1);
  });

  const handleRefresh = async (event: CustomEvent) => {
    await fetchData(1, true);
    setPage(1);
    event.detail.complete();
  };

  const loadMore = async (event: any) => {
    if (!hasMore) {
      event.target.complete();
      return;
    }
    const nextPage = page + 1;
    await fetchData(nextPage, false);
    setPage(nextPage);
    event.target.complete();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended" color="dark" />
          </IonButtons>
          <div className="pointer-events-none absolute inset-0 flex w-full flex-1 items-center justify-center">
            <IonTitle className="text-center text-[17px] font-bold text-gray-900">
              Danh sách Phiếu Chi
            </IonTitle>
          </div>
          <IonButtons slot="end">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="pr-4 text-gray-600 focus:outline-none relative flex items-center"
            >
              <IonIcon icon={filterOutline} className="w-6 h-6" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-red-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Kéo để tải lại" refreshingSpinner="circular" />
        </IonRefresher>

        <div className="p-4">
          {/* Search Bar */}
          <div className="bg-white rounded-xl flex items-center px-4 py-2 mb-4 shadow-sm">
            <IonIcon icon={searchOutline} className="text-gray-400 w-5 h-5 mr-2" />
            <input
              type="text"
              placeholder="Tìm kiếm mã phiếu, đối tượng..."
              className="w-full bg-transparent outline-none text-sm text-gray-700 py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Total Overview Card */}
          <div className="bg-blue-500 rounded-xl p-5 mb-5 relative overflow-hidden text-white shadow-md">
            <div className="relative z-10">
              <div className="text-xs font-semibold mb-1 opacity-90 uppercase">Tổng chi hôm nay</div>
              <div className="text-3xl font-bold">{formatCurrency(totalAmountToday)}</div>
            </div>
            <IonIcon
              icon={receiptOutline}
              className="absolute -right-4 -bottom-4 text-white opacity-20 w-32 h-32"
            />
          </div>

          {/* Filters */}
          <PaymentReceiptFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* List */}
          <div className="mt-2">
            {isLoading && receipts.length === 0 ? (
              <div className="text-center text-gray-500 mt-10 text-sm">
                Đang tải danh sách...
              </div>
            ) : receipts.length > 0 ? (
              <>
                {receipts.map((receipt) => (
                  <PaymentReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    onClick={(r) => history.push(`/tabs/extended/payment-receipts/detail/${r.id}`)}
                  />
                ))}

                {hasMore && (
                  <div className="flex justify-center my-3">
                    <AppButton
                      variant="pill"
                      onClick={async () => {
                        const nextPage = page + 1;
                        await fetchData(nextPage, false);
                        setPage(nextPage);
                      }}
                      loading={isLoading && page > 1}
                      loadingText="Đang tải..."
                    >
                      Xem thêm
                    </AppButton>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 mt-10 text-sm">
                Không tìm thấy phiếu chi nào khớp bộ lọc.
              </div>
            )}
          </div>
        </div>
        <div className="pb-20" />
      </IonContent>

      <IonFab vertical="bottom" horizontal="end" slot="fixed" className="mb-4 mr-2">
        <IonFabButton color="primary" onClick={() => history.push("/tabs/extended/payment-receipts/create")}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <PaymentReceiptFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={setAdvancedFilters}
        currentFilters={advancedFilters}
      />
    </IonPage>
  );
};

export default PaymentReceiptListScreen;

