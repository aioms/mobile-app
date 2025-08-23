import React, { useEffect, useState } from "react";
import { IonList, IonButton, RefresherEventDetail } from "@ionic/react";
import { Toast } from "@capacitor/toast";
import { Dialog } from "@capacitor/dialog";

import useReceiptImport from "@/hooks/apis/useReceiptImport";
import ItemListItem from "./components/ItemList";
import { ReceiptListSkeleton } from "./components/ReceiptListSkeleton";
import { Refresher } from "@/components/Refresher/Refresher";
import { ReceiptImportStatus } from "@/common/enums/receipt";

interface ItemList {
  id: string;
  receiptNumber: string;
  importDate: string;
  quantity: number;
  status: string;
  warehouse: string;
  note: string;
  userCreated: string;
  createdAt: string;
}

type Props = {
  keyword: string;
};

const pageSize = 10;

const ReceiptImportList: React.FC<Props> = ({ keyword }) => {
  const [receiptImports, setReceiptImports] = useState<ItemList[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { getList: getListReceiptImport, update: updateReceiptImport } =
    useReceiptImport();

  const fetchReceiptImports = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      }

      const response = await getListReceiptImport(
        {
          keyword,
        },
        page,
        pageSize
      );

      if (isLoadMore) {
        if (response.length < pageSize) {
          setHasMore(false);
        }
        setReceiptImports((prev) => [...prev, ...response]);
      } else {
        if (response.length < pageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        setReceiptImports(response);

        if (!response.length) {
          await Toast.show({
            text: "Không tìm thấy kết quả",
            duration: "short",
            position: "top",
          });
        }
      }
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReceiptImports();
  }, [keyword]);

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
      await Toast.show({
        text: "Đã gửi yêu cầu duyệt",
        duration: "short",
        position: "top",
      });
      fetchReceiptImports();
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
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
      await Toast.show({
        text: "Đã hoàn thành phiếu nhập",
        duration: "short",
        position: "top",
      });
      fetchReceiptImports();
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  return (
    <>
      <Refresher onRefresh={handleRefresh} />

      <IonList>
        {loading ? (
          <>
            <ReceiptListSkeleton />
            <ReceiptListSkeleton />
            <ReceiptListSkeleton />
          </>
        ) : (
          receiptImports.map((item) => (
            <ItemListItem
              key={item.id}
              {...item}
              onRequestApproval={handleRequestApproval}
              onComplete={handleComplete}
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
        <div className="text-center py-4">
          <IonButton
            fill="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Đang tải..." : "Xem thêm"}
          </IonButton>
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
