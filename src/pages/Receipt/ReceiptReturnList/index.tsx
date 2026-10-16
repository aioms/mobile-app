import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonIcon,
  RefresherEventDetail,
} from "@ionic/react";
import { add, scanOutline, cubeOutline, alertCircleOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { AppSearchBar, AppFAB, AppButton } from "@/components/UI";
import { Refresher } from "@/components/Refresher/Refresher";
import { useBarcodeScanner } from "@/hooks";
import ReturnCard from "./components/ReturnCard";
import ReturnSummaryCard from "./components/ReturnSummaryCard";
import ReturnPartnerTabs from "./components/ReturnPartnerTabs";
import ReturnStatusChips from "./components/ReturnStatusChips";
import ReturnFilterModal from "./components/ReturnFilterModal";
import ReturnDetailModal from "./components/ReturnDetailModal";
import useReceiptReturnList from "./hooks/useReceiptReturnList";
import { ReceiptReturnType } from "@/types/receipt-return.type";

const ReceiptReturnListScreen: React.FC = () => {
  const history = useHistory();

  const {
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
  } = useReceiptReturnList();

  const handleBarcodeScanned = React.useCallback(
    (code: string) => {
      setSearchText(code);
    },
    [setSearchText],
  );

  const handleBarcodeError = React.useCallback((err: Error) => {
    console.warn("Barcode scanner error:", err.message);
  }, []);

  const { startScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: handleBarcodeError,
  });


  const isCustomer = activeType === ReceiptReturnType.CUSTOMER;
  const searchPlaceholder = isCustomer
    ? "Tìm mã phiếu, khách hàng, sản phẩm"
    : "Tìm mã phiếu, NCC, sản phẩm";

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await handleRefresh();
    event.detail.complete();
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended" text="" />
          </IonButtons>
          <IonTitle className="text-base font-bold text-gray-900">
            Danh sách phiếu trả
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              data-cy="return-scan-header-btn"
              onClick={() => startScan()}
              aria-label="Quét mã vạch"
              className="text-gray-700"
            >
              <IonIcon icon={scanOutline} className="text-xl" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <Refresher onRefresh={onRefresh} />

        {/* 1. Partner Tabs: Khách hàng / NCC */}
        <div className="mx-4 mt-3 mb-2">
          <ReturnPartnerTabs
            activeType={activeType}
            onChange={handleTabChange}
          />
        </div>

        {/* 2. Summary Card */}
        <div className="mx-4 mb-3">
          <ReturnSummaryCard
            totalCount={summary.totalCount}
            totalAmount={summary.totalAmount}
            trendPercent={summary.trendPercent}
            onScanClick={startScan}
          />
        </div>

        {/* 3. Search Bar with Filter Button and Scanner Action */}
        <div className="mx-4 mb-2 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <AppSearchBar
            data-cy="return-searchbar"
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder={searchPlaceholder}
            onFilterClick={() => setIsFilterModalOpen(true)}
            isFiltered={activeFiltersCount > 0}
            extraAction={
              <IonButton
                fill="clear"
                onClick={() => startScan()}
                className="h-10 w-10 m-0 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-500 bg-gray-100 hover:bg-gray-200"
                style={{
                  "--padding-start": "0px",
                  "--padding-end": "0px",
                  "--padding-top": "0px",
                  "--padding-bottom": "0px",
                  "--min-height": "40px",
                  "--min-width": "40px",
                }}
              >
                <IonIcon icon={scanOutline} slot="icon-only" className="text-lg" />
              </IonButton>
            }
          />
        </div>

        {/* 4. Horizontal Status Filter Chips */}
        <div className="mb-3">
          <ReturnStatusChips
            selectedStatus={selectedStatus}
            onChange={setSelectedStatus}
            counts={summary.statusCounts}
          />
        </div>

        {/* 5. Return Slips List Wrapper */}
        <div className="px-4 pb-20">
          {isLoading && receipts.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : isError ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-rose-100 shadow-sm">
              <IonIcon icon={alertCircleOutline} className="text-3xl text-rose-500 mb-2" />
              <p className="text-rose-600 font-semibold text-sm mb-3">
                Không thể tải danh sách phiếu trả.
              </p>
              <button
                type="button"
                onClick={() => handleRefresh()}
                className="py-2 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs active:scale-95 transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : receipts.length === 0 ? (
            <div
              data-cy="return-empty-state"
              className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <IonIcon icon={cubeOutline} className="text-2xl" />
              </div>
              <p className="text-gray-800 font-bold text-sm mb-1">
                {searchText ? "Không tìm thấy phiếu trả nào" : "Chưa có phiếu trả hàng"}
              </p>
              <p className="text-gray-500 text-xs mb-4 max-w-xs">
                {searchText
                  ? `Không tìm thấy phiếu trả khớp với "${searchText}". Thử tìm với từ khóa khác.`
                  : isCustomer
                  ? "Hiện chưa có phiếu trả hàng nào của khách hàng."
                  : "Hiện chưa có phiếu trả hàng nào cho nhà cung cấp."}
              </p>
              <button
                type="button"
                data-cy="return-empty-create-btn"
                onClick={() =>
                  history.push({
                    pathname: "/tabs/receipt/return",
                    state: { type: activeType },
                  })
                }
                className="py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs active:scale-95 transition-all shadow-sm shadow-blue-500/20"
              >
                Tạo phiếu trả ngay
              </button>
            </div>
          ) : (
            <>
              {receipts.map((receipt) => (
                <ReturnCard
                  key={receipt.id}
                  receipt={receipt}
                  onClick={setSelectedReceipt}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center my-3">
                  <AppButton
                    variant="pill"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang tải..." : "Xem thêm"}
                  </AppButton>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>

      {/* Floating Action Button (FAB) for creating return slip */}
      <AppFAB
        data-cy="return-create-fab"
        icon={add}
        onClick={() =>
          history.push({
            pathname: "/tabs/receipt/return",
            state: { type: activeType },
          })
        }
      />

      {/* Filter Modal */}
      <ReturnFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={advancedFilters}
        onApply={setAdvancedFilters}
      />

      {/* Detail Modal */}
      <ReturnDetailModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </IonPage>
  );
};

export default ReceiptReturnListScreen;
