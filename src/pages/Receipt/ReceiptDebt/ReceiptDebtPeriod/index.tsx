import React, { useState, useMemo, useEffect } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Dialog } from "@capacitor/dialog";
import { Toast } from "@capacitor/toast";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonBackButton,
  IonFooter,
  IonPage,
  IonIcon,
  IonTextarea,
  IonText,
  useIonToast,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonLabel,
  useIonModal,
} from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { checkmarkCircleOutline, printOutline } from "ionicons/icons";

import { getDate } from "@/helpers/date";
import { formatCurrency } from "@/helpers/formatters";
import { getStatusLabel, getStatusColor } from "@/common/constants/receipt";
import { IProductItem } from "@/types/product.type";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import useProduct from "@/hooks/apis/useProduct";
import { useBarcodeScanner, useLoading } from "@/hooks";

import DatePicker from "@/components/DatePicker";
import ContentSkeleton from "@/components/Loading/ContentSkeleton";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import EmptyPage from "@/components/EmptyPage";
import ModalSelectProduct from "@/components/ModalSelectProduct";
import PurchasePeriodList from "./components/PurchasePeriodList";

const initialFormData = {
  customer: "",
  dueDate: "",
  note: "",
};

interface IReceiptDebtDetail {
  id: string;
  code: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
  paymentDate: string | null;
  note: string;
  receiptImportId: string | null;
  receiptReturnId: string | null;
  createdAt: string;
  updatedAt: string;
  supplierName: string | null;
  customerName: string | null;
}

interface ReceiptDebtDetailResponse {
  receipt: IReceiptDebtDetail;
  items: Record<string, IProductItem[]>;
}

const ReceiptDebtPeriod: React.FC<{}> = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const [presentToast] = useIonToast();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptDebt, setReceiptDebt] = useState<IReceiptDebtDetail | null>(
    null
  );
  const [productItems, setProductItems] = useState<
    Record<string, IProductItem[]>
  >({});

  const { withLoading, isLoading } = useLoading();

  const { getDetail, updateInventoryForNewPeriod } = useReceiptDebt();
  const { getDetail: getProductDetail } = useProduct();

  // Barcode scanner hook
  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: (value: string) => {
      stopScan();
      addProductByBarcode(value);
    },
    onError: async (error: Error) => {
      await presentToast({
        message: error.message || "Có lỗi xảy ra khi quét mã vạch",
        duration: 1500,
        position: "top",
        color: "danger",
      });
    },
  });

  // Modal for product selection
  const [presentModalProduct, dismissModalProduct] = useIonModal(
    ModalSelectProduct,
    {
      dismiss: (data: any, role: string) => dismissModalProduct(data, role),
    }
  );

  const fetchReceiptDebtDetails = async () => {
    if (!id) {
      await presentToast({
        message: "Không thể load dữ liệu",
        duration: 1000,
        position: "top",
        color: "warning",
      });
      return;
    }

    await withLoading(async () => {
      const response: ReceiptDebtDetailResponse = await getDetail(id);

      if (!response.receipt) {
        Toast.show({
          text: "Không tìm thấy thông tin phiếu",
          duration: "short",
          position: "center",
        });
        history.goBack();
        return;
      }

      const { customerName, dueDate, note } = response.receipt;

      setReceiptDebt(response.receipt);
      setProductItems(response.items);

      setFormData({
        customer: customerName || "",
        dueDate: getDate(dueDate || new Date()).format(),
        note,
      });
    });
  };

  useEffect(() => {
    fetchReceiptDebtDetails();
  }, [id]);

  // New useEffect to handle barcode parameter
  useEffect(() => {
    const { barcode } = getUrlParams();

    if (barcode && receiptDebt) {
      // Wait for receipt debt details to be loaded first
      handleBarcodeFromUrl(barcode);

      // Clean up URL parameter after processing
      const newUrl = window.location.pathname;
      history.replace(newUrl);
    }
  }, [receiptDebt, location.search]); // Depend on receiptDebt to ensure it's loaded

  // Handle barcode from URL parameter
  const handleBarcodeFromUrl = async (barcode: string) => {
    try {
      const product = await getProductDetail(barcode);

      if (!product) {
        await presentToast({
          message: "Không tìm thấy sản phẩm với mã vạch này",
          duration: 2000,
          position: "top",
          color: "warning",
        });
        return;
      }

      await addNewCollectionPeriod(product);

      presentToast({
        message: `Đã tự động thêm ${product.productName} từ mã vạch quét`,
        duration: 3000,
        position: "top",
        color: "success",
      });
    } catch (error) {
      await presentToast({
        message: "Có lỗi xảy ra khi xử lý mã vạch",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    fetchReceiptDebtDetails().then(() => {
      event.detail.complete();
    });
  };

  // Function to get URL search parameters
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      barcode: searchParams.get("barcode"),
    };
  };

  // Add product by barcode scanning
  const addProductByBarcode = async (barcode: string) => {
    try {
      const product = await getProductDetail(barcode);

      if (!product) {
        await presentToast({
          message: "Không tìm thấy sản phẩm với mã vạch này",
          duration: 2000,
          position: "top",
          color: "warning",
        });
        return;
      }

      await addNewCollectionPeriod(product);
    } catch (error) {
      await presentToast({
        message: "Có lỗi xảy ra khi tìm sản phẩm",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  // Add new collection period for a product
  const addNewCollectionPeriod = async (product: any) => {
    const currentDate = new Date().toISOString();
    const dateKey = getDate(currentDate).format("YYYY-MM-DD");

    setProductItems((prev) => {
      const updated = { ...prev };

      // Initialize current date period if it doesn't exist
      if (!updated[dateKey]) {
        updated[dateKey] = [];
      }

      // Check if product already exists in current period
      const existingProductIndex = updated[dateKey].findIndex(
        (item) => item.productId === product.id
      );

      if (existingProductIndex !== -1) {
        // Product exists, increment quantity - CREATE NEW ARRAY REFERENCE
        updated[dateKey] = updated[dateKey].map((item, index) => {
          if (index === existingProductIndex) {
            // Add temp_ prefix if it doesn't already have it (marking as edited)
            const newId = item.id.startsWith("temp_")
              ? item.id
              : `temp_${item.id}`;

            // Store original quantity if not already stored
            const originalQuantity =
              item.originalQuantity !== undefined
                ? item.originalQuantity
                : item.quantity;

            return {
              ...item,
              id: newId,
              quantity: item.quantity + 1,
              originalQuantity,
            };
          }
          return item;
        });
      } else {
        // Product doesn't exist, add new item
        const newProductItem: IProductItem = {
          id: `temp_${Date.now()}`,
          code: product.code,
          receiptId: id!,
          productId: product.id,
          productName: product.productName,
          productCode: product.productCode,
          quantity: 1,
          costPrice: product.costPrice,
          createdAt: currentDate,
          originalQuantity: 0, // New item, so original quantity is 0
        };
        updated[dateKey] = [...updated[dateKey], newProductItem];
      }

      return updated;
    });

    await presentToast({
      message: `Đã thêm ${product.productName} vào danh sách thu`,
      duration: 2000,
      position: "top",
      color: "success",
    });
  };

  // Function to handle quantity changes (only for current date items)
  const handleQuantityChange = (
    dateKey: string,
    itemId: string,
    newQuantity: number
  ) => {
    const currentDateKey = getDate(new Date()).format("YYYY-MM-DD");

    // Only allow changes to current date items
    if (dateKey !== currentDateKey) {
      presentToast({
        message: "Không thể thay đổi số lượng của đợt thu cũ",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    setProductItems((prev) => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        const itemIndex = updated[dateKey].findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            updated[dateKey].splice(itemIndex, 1);
            // Remove date key if no items left
            if (updated[dateKey].length === 0) {
              delete updated[dateKey];
            }
          } else {
            const currentItem = updated[dateKey][itemIndex];
            // Add temp_ prefix if it doesn't already have it (marking as edited)
            const newId = currentItem.id.startsWith("temp_")
              ? currentItem.id
              : `temp_${currentItem.id}`;

            // Store original quantity if not already stored
            const originalQuantity =
              currentItem.originalQuantity !== undefined
                ? currentItem.originalQuantity
                : currentItem.quantity;

            updated[dateKey][itemIndex] = {
              ...currentItem,
              id: newId,
              quantity: newQuantity,
              originalQuantity,
            };
          }
        }
      }
      return updated;
    });
  };

  // Function to handle price changes (only for current date items)
  const handlePriceChange = (
    dateKey: string,
    itemId: string,
    newPrice: number
  ) => {
    const currentDateKey = getDate(new Date()).format("YYYY-MM-DD");

    // Only allow changes to current date items
    if (dateKey !== currentDateKey) {
      presentToast({
        message: "Không thể thay đổi giá của đợt thu cũ",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    setProductItems((prev) => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        const itemIndex = updated[dateKey].findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          const currentItem = updated[dateKey][itemIndex];
          // Add temp_ prefix if it doesn't already have it (marking as edited)
          const newId = currentItem.id.startsWith("temp_")
            ? currentItem.id
            : `temp_${currentItem.id}`;

          // Store original quantity if not already stored
          const originalQuantity =
            currentItem.originalQuantity !== undefined
              ? currentItem.originalQuantity
              : currentItem.quantity;

          updated[dateKey][itemIndex] = {
            ...currentItem,
            id: newId,
            costPrice: newPrice,
            originalQuantity,
          };
        }
      }
      return updated;
    });
  };

  // Function to remove product (only for current date items)
  const handleRemoveProduct = (dateKey: string, itemId: string) => {
    const currentDateKey = getDate(new Date()).format("YYYY-MM-DD");

    // Only allow removal of current date items
    if (dateKey !== currentDateKey) {
      presentToast({
        message: "Không thể xóa sản phẩm của đợt thu cũ",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    setProductItems((prev) => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        const itemIndex = updated[dateKey].findIndex(
          (item) => item.id === itemId
        );
        if (itemIndex !== -1) {
          updated[dateKey].splice(itemIndex, 1);
          // Remove date key if no items left
          if (updated[dateKey].length === 0) {
            delete updated[dateKey];
          }
        }
      }
      return updated;
    });
  };

  // Handle manual product selection
  const handleAddProduct = () => {
    presentModalProduct({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm" && ev.detail.data) {
          addNewCollectionPeriod(ev.detail.data);
        }
      },
    });
  };

  const totalAmount = useMemo(() => {
    const currentDate = new Date().toISOString();
    const currentDateKey = getDate(currentDate).format("YYYY-MM-DD");

    // Only get items from current period that have been edited or added (temp_ prefix)
    const currentPeriodItems = productItems[currentDateKey] || [];
    const editedOrAddedItems = currentPeriodItems.filter((item) =>
      item.id.startsWith("temp_")
    );

    return editedOrAddedItems.reduce((total, product) => {
      const originalQuantity = product.originalQuantity || 0;
      return total + product.costPrice * (product.quantity - originalQuantity);
    }, 0);
  }, [productItems]);

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dueDate) {
      newErrors.estimatedDate = "Vui lòng chọn ngày dự kiến thu";
    }

    // Check if there are any edited or added items (with temp_ prefix)
    const currentDate = new Date().toISOString();
    const currentDateKey = getDate(currentDate).format("YYYY-MM-DD");
    const currentPeriodItems = productItems[currentDateKey] || [];
    const editedOrAddedItems = currentPeriodItems.filter((item) =>
      item.id.startsWith("temp_")
    );

    if (editedOrAddedItems.length === 0) {
      newErrors.products = "Vui lòng thêm ít nhất một sản phẩm cho đợt thu mới";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = validateForm();

    if (!isValid) {
      presentToast({
        message: "Vui lòng kiểm tra lại thông tin phiếu",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    const { value } = await Dialog.confirm({
      title: "Xác nhận cập nhật phiếu",
      message: "Bạn có chắc chắn muốn cập nhật phiếu không?",
    });

    if (!value) return;

    await withLoading(async () => {
      // Get current date key to filter only new period items
      const currentDate = new Date().toISOString();
      const currentDateKey = getDate(currentDate).format("YYYY-MM-DD");

      // Only get items from current period that were edited or added (have temp_ IDs)
      const currentPeriodItems = productItems[currentDateKey] || [];
      const editedOrAddedItems = currentPeriodItems.filter((item) =>
        item.id.startsWith("temp_")
      );

      const payload = {
        dueDate: formData.dueDate,
        note: formData.note,
        items: editedOrAddedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          originalQuantity: item.originalQuantity || 0,
          costPrice: item.costPrice, // This will now include any price changes
          receiptPeriodId: item.periodId,
        })),
      };

      const response = await updateInventoryForNewPeriod(id!, payload);

      if (response.success) {
        await presentToast({
          message: "Cập nhật Phiếu Thu thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });
      }

      history.goBack();
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Đang tải dữ liệu..." />;
  }

  if (!receiptDebt) {
    return <EmptyPage />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>Quản lý Đợt Thu</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" size="default">
              <IonIcon icon={printOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {isLoading ? (
          <ContentSkeleton lines={5} />
        ) : (
          <>
            {/* Display receipt information */}
            <div className="bg-card rounded-lg shadow-sm">
              <div className="px-4 pt-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Mã phiếu thu
                </h2>
                <div>{receiptDebt?.code}</div>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Trạng thái
                </h2>
                <IonChip color={getStatusColor(receiptDebt?.status as any)}>
                  <IonLabel>
                    {getStatusLabel(receiptDebt?.status as any)}
                  </IonLabel>
                </IonChip>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Tổng tiền
                </h2>
                <div>{formatCurrency(receiptDebt?.totalAmount || 0)}</div>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Đã thanh toán
                </h2>
                <div>{formatCurrency(receiptDebt?.paidAmount || 0)}</div>
              </div>

              <div className="px-4 mt-4 pb-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Còn lại
                </h2>
                <div className="text-red-600 font-semibold">
                  {formatCurrency(receiptDebt?.remainingAmount || 0)}
                </div>
              </div>

              {/* Khách hàng */}
              <div className="px-4 pb-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Khách hàng
                </h2>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {receiptDebt?.customerName || "Chưa có thông tin khách hàng"}
                </div>
              </div>
            </div>

            <PurchasePeriodList
              items={productItems}
              onAddPeriod={handleAddProduct}
              onScanBarcode={startScan}
              onQuantityChange={handleQuantityChange}
              onPriceChange={handlePriceChange}
              onRemoveProduct={handleRemoveProduct}
            />

            <div className="bg-card rounded-lg shadow-sm p-4 mt-3">
              <IonText className="text-lg">Tổng Tiền Đợt Thu Mới: </IonText>
              <IonText className="text-lg font-semibold" color="primary">
                {formatCurrency(totalAmount)}
              </IonText>
            </div>

            <div className="bg-card rounded-lg shadow-sm mt-3">
              {/* Dự kiến thu */}
              <div className="p-4">
                <h2 className="text-md font-medium text-foreground mb-2">
                  Dự kiến thu
                </h2>
                <div>
                  <DatePicker
                    value={formData.dueDate}
                    presentation="date"
                    onChange={(e) =>
                      handleFormChange("dueDate", e.detail.value)
                    }
                    attrs={{ id: "estimated-date" }}
                    extraClassName="w-full flex items-center justify-start"
                  />
                </div>
                {errors.estimatedDate && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.estimatedDate}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="p-4">
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Ghi chú
                </h2>
                <IonTextarea
                  name="note"
                  value={formData.note}
                  onIonInput={(e) => handleFormChange("note", e.target.value)}
                  placeholder="Nhập ghi chú đơn hàng"
                  rows={3}
                  className="border border-input rounded-lg px-2"
                ></IonTextarea>
              </div>
            </div>

            {errors.products && (
              <div className="text-red-500 text-sm mt-2 text-center">
                {errors.products}
              </div>
            )}
          </>
        )}
      </IonContent>

      <IonFooter>
        <div className="ion-padding">
          <IonButton expand="block" size="default" onClick={handleSubmit}>
            <IonIcon icon={checkmarkCircleOutline} slot="start" />
            Cập nhật Đợt Thu
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ReceiptDebtPeriod;
