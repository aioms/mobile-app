import { useEffect, useRef, useState } from "react";
import {
  IonList,
  IonButton,
  RefresherEventDetail,
  useIonToast,
  IonIcon,
  useIonModal,
  IonChip,
  IonLabel,
  IonSpinner,
} from "@ionic/react";
import { AppSearchBar, AppButton } from "@/components/UI";
import { Dialog } from "@capacitor/dialog";
import { close } from "ionicons/icons";

import { captureException, createExceptionContext } from "@/helpers/posthogHelper";
import { parseArrayData } from "@/helpers/common";

import useReceiptImport from "@/hooks/apis/useReceiptImport";
import ImportItemList from "./components/ItemList";
import { ReceiptListSkeleton } from "./components/ReceiptListSkeleton";
import { Refresher } from "@/components/Refresher/Refresher";
import { ReceiptImportStatus } from "@/common/enums/receipt";
import { useHistory } from "react-router";
import { useBarcodeScanner } from "@/hooks";
import { scanOutline } from "ionicons/icons";
import { ReceiptImportItemList } from "./types/receipt-import.type";
import FilterModal from "./components/FilterModal";
import { ReceiptImportFilterValues, defaultReceiptImportFilters } from "./types/FilterModal.d";
import { getStatusColor, getStatusLabel } from "@/common/constants/receipt-import.constant";
import { createRequestId } from "@/helpers/common";

const pageSize = 10;

const ReceiptImportList = () => {
  const history = useHistory();

  const [receiptImports, setReceiptImports] = useState<ReceiptImportItemList[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filterValues, setFilterValues] = useState<ReceiptImportFilterValues>(defaultReceiptImportFilters);
  const [activeFilters, setActiveFilters] = useState<ReceiptImportFilterValues>(defaultReceiptImportFilters);
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const isCreatingReceiptRef = useRef(false);
  const createRequestIdRef = useRef(createRequestId());

  const [presentToast] = useIonToast();

  const {
    getList: getListReceiptImport,
    createWithProductCode,
    update: updateReceiptImport,
    cancelReceiptImport,
  } = useReceiptImport();

  const fetchReceiptImports = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      }

      // Build filter parameters
      const filterParams: any = {
        keyword,
      };

      // Add supplier filters
      if (activeFilters.suppliers.length > 0) {
        filterParams.suppliers = activeFilters.suppliers.map(s => s.split("__")[0]);
      }

      // Add status filters
      if (activeFilters.status.length > 0) {
        filterParams.statuses = activeFilters.status;
      }

      // Add date range filters
      if (activeFilters.dateRange.from) {
        filterParams.fromDate = activeFilters.dateRange.from;
      }
      if (activeFilters.dateRange.to) {
        filterParams.toDate = activeFilters.dateRange.to;
      }

      const response: any = await getListReceiptImport(
        filterParams,
        page,
        pageSize,
      );

      const data = parseArrayData(response);

      if (isLoadMore) {
        if (data.length < pageSize) {
          setHasMore(false);
        }
        setReceiptImports((prev) => [...prev, ...data]);
      } else {
        if (data.length < pageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        setReceiptImports(data);

        if (!data.length) {
          presentToast({
            message: "Không tìm thấy kết quả",
            duration: 2000,
            position: "top",
          });
        }
      }
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'Inventory',
        'ReceiptImportList',
        'fetchReceiptImports'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReceiptImports();
  }, [keyword, activeFilters]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchReceiptImports(nextPage, true);
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchReceiptImports().finally(() => {
      event.detail.complete();
    });
  };

  const handleRequestApproval = async (id: string) => {
    try {
      // Show confirmation dialog
      const { value } = await Dialog.confirm({
        title: "Xác nhận yêu cầu duyệt",
        message:
          "Bạn có chắc chắn muốn gửi yêu cầu duyệt phiếu nhập này không?",
      });

      if (!value) return;

      await updateReceiptImport(id, { status: ReceiptImportStatus.WAITING });

      presentToast({
        message: "Đã gửi yêu cầu duyệt",
        duration: 2000,
        position: "top",
        color: "success",
      });
      fetchReceiptImports();
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'Inventory',
        'ReceiptImportList',
        'handleRequestApproval'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      // Show confirmation dialog
      const { value } = await Dialog.confirm({
        title: "Xác nhận hoàn thành",
        message: "Bạn có chắc chắn muốn hoàn thành phiếu nhập này không?",
      });

      if (!value) return;

      await updateReceiptImport(id, { status: ReceiptImportStatus.COMPLETED });
      
      presentToast({
        message: "Đã hoàn thành phiếu nhập",
        duration: 2000,
        position: "top",
      });
      fetchReceiptImports();
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'Inventory',
        'ReceiptImportList',
        'handleComplete'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      // Show confirmation dialog
      const { value } = await Dialog.confirm({
        title: "Xác nhận hủy phiếu",
        message: "Bạn có chắc chắn muốn hủy phiếu nhập này không?",
      });

      if (!value) return;

      const response = await cancelReceiptImport(id);

      if (!response?.id) {
        throw new Error("Hủy phiếu nhập thất bại");
      }

      presentToast({
        message: "đã hủy phiếu nhập",
        duration: 2000,
        position: "top",
        color: "success",
      });

      fetchReceiptImports();
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'Inventory',
        'ReceiptImportList',
        'handleCancel'
      ));

      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const createReceipt = async (receiptNumber: string) => {
    if (isCreatingReceiptRef.current) return;

    try {
      if (!receiptNumber) {
        presentToast({
          message: "Không tìm thấy phiếu",
          duration: 1000,
          position: "top",
        });
        return;
      }

      isCreatingReceiptRef.current = true;
      setIsCreatingReceipt(true);
      const response = await createWithProductCode(
        { code: receiptNumber },
        createRequestIdRef.current,
      );
      const receiptId = response?.id;

      if (!receiptId) {
        throw new Error("Cập nhật thất bại");
      }

      createRequestIdRef.current = createRequestId();
      history.push(`/tabs/receipt-import/detail/${receiptId}`);
      presentToast({
        message: 'Cập nhật thành công',
        duration: 1000,
        position: "top",
      });
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'Inventory',
        'ReceiptCreation',
        'createReceipt'
      ));
      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      isCreatingReceiptRef.current = false;
      setIsCreatingReceipt(false);
    }
  };

  const handleBarcodeScanned = async (value: string) => {
    stopScan();
    createReceipt(value);
  };

  const handleError = async (error: Error) => {
    captureException(error, createExceptionContext(
      'Inventory',
      'BarcodeScanner',
      'handleError'
    ));
    presentToast({
      message: error.message || "Có lỗi xảy ra",
      duration: 2000,
      position: "top",
      color: "danger",
    });
  };

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: handleError,
    toastTimeout: 800,
    delay: 1000,
  });

  // Filter Modal
  const [presentFilter, dismissFilter] = useIonModal(FilterModal, {
    dismiss: (data: ReceiptImportFilterValues, role: string) => dismissFilter(data, role),
    initialFilters: filterValues,
  });

  const openFilterModal = () => {
    presentFilter({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const newFilters = ev.detail.data;
          setFilterValues(newFilters);
          setActiveFilters(newFilters);
        }
      },
    });
  };

  // Count active filters
  const activeFilterCount = 
    (activeFilters.suppliers?.length || 0) +
    (activeFilters.status?.length || 0) +
    (activeFilters.dateRange.from ? 1 : 0) +
    (activeFilters.dateRange.to ? 1 : 0);

  return (
    <>
      <Refresher onRefresh={handleRefresh} />

      <div className="mb-2">
        <AppSearchBar
          searchText={keyword}
          setSearchText={(val) => {
            setKeyword(val);
          }}
          placeholder="Tìm kiếm phiếu nhập..."
          isFiltered={activeFilterCount > 0}
          onFilterClick={openFilterModal}
          extraAction={
            <IonButton
              fill="clear"
              className="h-10 w-10 m-0 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => startScan()}
              disabled={isCreatingReceipt}
              style={{
                '--padding-start': '0px',
                '--padding-end': '0px',
                '--padding-top': '0px',
                '--padding-bottom': '0px',
                '--min-height': '40px',
                '--min-width': '40px',
              }}
            >
              {isCreatingReceipt ? (
                <IonSpinner name="crescent" />
              ) : (
                <IonIcon icon={scanOutline} slot="icon-only" className="text-xl" />
              )}
            </IonButton>
          }
        />
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {activeFilters.suppliers.map((supplier) => {
                const [, name] = supplier.split("__");
                return (
                  <IonChip key={supplier} className="bg-blue-50 text-blue-600">
                    <IonLabel>{name}</IonLabel>
                    <IonIcon 
                      icon={close} 
                      onClick={() => {
                        const newFilters = {
                          ...activeFilters,
                          suppliers: activeFilters.suppliers.filter(s => s !== supplier)
                        };
                        setFilterValues(newFilters);
                        setActiveFilters(newFilters);
                      }}
                    />
                  </IonChip>
                );
              })}
              {activeFilters.status.map((status) => (
                <IonChip key={status} color={getStatusColor(status)}>
                  <IonLabel>{getStatusLabel(status)}</IonLabel>
                  <IonIcon 
                    icon={close} 
                    onClick={() => {
                      const newFilters = {
                        ...activeFilters,
                        status: activeFilters.status.filter(s => s !== status)
                      };
                      setFilterValues(newFilters);
                      setActiveFilters(newFilters);
                    }}
                  />
                </IonChip>
              ))}
              {(activeFilters.dateRange.from || activeFilters.dateRange.to) && (
                <IonChip className="bg-orange-50 text-orange-600">
                  <IonLabel>
                    {activeFilters.dateRange.from && activeFilters.dateRange.to
                      ? `${new Date(activeFilters.dateRange.from!).toLocaleDateString('vi-VN')} - ${new Date(activeFilters.dateRange.to!).toLocaleDateString('vi-VN')}`
                      : activeFilters.dateRange.from
                      ? `Từ ${new Date(activeFilters.dateRange.from).toLocaleDateString('vi-VN')}`
                      : `Đến ${new Date(activeFilters.dateRange.to!).toLocaleDateString('vi-VN')}`
                    }
                  </IonLabel>
                  <IonIcon 
                    icon={close} 
                    onClick={() => {
                      const newFilters = {
                        ...activeFilters,
                        dateRange: { from: null, to: null }
                      };
                      setFilterValues(newFilters);
                      setActiveFilters(newFilters);
                    }}
                  />
                </IonChip>
              )}
            </div>
            <IonButton 
              fill="clear" 
              size="small" 
              onClick={() => {
                setFilterValues(defaultReceiptImportFilters);
                setActiveFilters(defaultReceiptImportFilters);
              }}
            >
              Xóa tất cả
            </IonButton>
          </div>
        </div>
      )}

      <IonList className="bg-transparent">
        {loading ? (
          <>
            <ReceiptListSkeleton />
            <ReceiptListSkeleton />
            <ReceiptListSkeleton />
          </>
        ) : (
          receiptImports.map((item) => (
            <ImportItemList
              key={item.id}
              {...item}
              onRequestApproval={handleRequestApproval}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))
        )}

        {receiptImports.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-4">
            <p>Không tìm thấy kết quả</p>
          </div>
        )}
      </IonList>

      {/* Load More Button */}
      {hasMore && receiptImports.length > 0 && (
        <div className="flex justify-center my-3">
          <AppButton
            variant="pill"
            onClick={handleLoadMore}
            loading={loadingMore}
            loadingText="Đang tải..."
          >
            Xem thêm
          </AppButton>
        </div>
      )}

      {/* Show loading skeleton when loading more */}
      {loadingMore && (
        <IonList>
          <ReceiptListSkeleton />
          <ReceiptListSkeleton />
        </IonList>
      )}
    </>
  );
};

export default ReceiptImportList;
