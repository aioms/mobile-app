import React, { useMemo, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonNote,
  IonText,
  IonCard,
  IonCardContent,
  useIonModal,
  IonRippleEffect,
  IonFooter,
  IonList,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { checkmark, saveOutline, scanOutline, search } from "ionicons/icons";
import { getDate } from "@/helpers/date";
import dayjs from "dayjs";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import { formatCurrency } from "@/helpers/formatters";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import useReceiptImport from "@/hooks/apis/useReceiptImport";
import useProduct from "@/hooks/apis/useProduct";

import DatePicker from "@/components/DatePicker";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import ModalSelectProduct from "../../components/ModalSelectProduct";
import ReceiptItem from "../../components/ReceiptItem";

import "./ReceiptImportCreate.css";

const initialDefaultItem = {
  note: "",
  importDate: getDate(new Date()).format(),
  paymentDate: getDate(new Date()).format(),
  quantity: 0,
  supplier: "",
  warehouse: "Kho KS1",
  totalAmount: 0,
  totalProduct: 0,
  items: [],
};

/**
 * Current not use this component
 * @deprecated
 */
const ReceiptImportCreate: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptItems, setReceiptItems] = useState<any[]>([]);
  const history = useHistory();

  const [presentToast] = useIonToast();

  const { create: createReceipt } = useReceiptImport();
  const { getDetail: getProductDetail } = useProduct();
  const [formData, setFormData] = useState(initialDefaultItem);

  // Add product to receipt items from barcode scan
  const addProductToReceiptItem = async (productCode: string) => {
    try {
      const product = await getProductDetail(productCode);

      const productData = {
        id: product.id,
        productId: product.id,
        productName: product.productName,
        productCode: product.productCode,
        code: product.code,
        costPrice: product.costPrice,
        totalPrice: product.costPrice,
        quantity: 1,
        discount: 0,
      };

      // Check if item already exists in receiptItems, then increase quantity
      const existingItem = receiptItems.find((item) => item.id === product.id);
      if (existingItem) {
        setReceiptItems((prev) =>
          prev.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  totalPrice: (item.quantity + 1) * item.costPrice,
                }
              : item
          )
        );

        presentToast({
          message: `Đã tăng số lượng ${product.productName} lên ${
            existingItem.quantity + 1
          }`,
          duration: 2000,
          position: "top",
          color: "success", 
        });
      } else {
        setReceiptItems((prev) => [...prev, productData]);

        presentToast({
          message: `Đã thêm ${product.productName} vào phiếu nhập`,
          duration: 2000,
          position: "top",
          color: "success", 
        });
      }
    } catch (error) {
      presentToast({
        message: (error as Error).message || "Không tìm thấy sản phẩm",
        duration: 2000,
        position: "top",
        color: "danger", 
      });
    }
  };

  const handleBarcodeScanned = (value: string) => {
    stopScan();
    addProductToReceiptItem(value);
  };

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error: Error) => {
      presentToast({
        message: error.message || "Lỗi đọc mã vạch",
        duration: 2000,
        position: "top",
        color: "danger", 
      });
    },
  });

  // OPEN MODAL SELECT PRODUCT
  const [presentModalProduct, dismissModalProduct] = useIonModal(
    ModalSelectProduct,
    {
      dismiss: (data: string, role: string) => dismissModalProduct(data, role),
    }
  );

  const openModalSelectProduct = () => {
    presentModalProduct({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role === "confirm") {
          setReceiptItems((prev) => [...prev, data]);
        }
      },
    });
  };

  // OPEN MODAL SELECT SUPPLIERS
  const [presentModalSupplier, dismissModalSupplier] = useIonModal(
    ModalSelectSupplier,
    {
      dismiss: (data: string, role: string) => dismissModalSupplier(data, role),
    }
  );

  const openModalSelectSupplier = () => {
    presentModalSupplier({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;
        if (role !== "confirm") return;
        if (formData.supplier === data) return;

        if (!formData.supplier) {
          clearErrors("supplier");
        }

        setFormData((prev) => ({
          ...prev,
          supplier: data,
        }));
      },
    });
  };

  const totalAmount = useMemo(() => {
    return receiptItems.reduce((total, row) => {
      return total + row.totalPrice;
    }, 0);
  }, [receiptItems]);

  const quantity = useMemo(() => {
    return receiptItems.reduce((total, row) => {
      return total + row.quantity;
    }, 0);
  }, [receiptItems]);

  const clearErrors = (key: string) => {
    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const validateForm = async (values: Record<string, any>) => {
    const newErrors: Record<string, string> = {
      quantity: "",
      importDate: "",
      paymentDate: "",
      supplier: "",
    };

    if (values.quantity <= 0) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!values.importDate) {
      newErrors.importDate = "Vui lòng chọn ngày nhập";
    }

    if (!values.paymentDate) {
      newErrors.paymentDate = "Vui lòng chọn ngày thanh toán";
    }

    if (
      values.paymentDate &&
      values.importDate &&
      values.paymentDate < values.importDate
    ) {
      newErrors.paymentDate = "Ngày thanh toán phải sau ngày nhập";
    }

    if (!values.supplier) {
      newErrors.supplier = "Vui lòng chọn nhà cung cấp";
    }

    if (receiptItems.length === 0) {
      presentToast({
        message: "Vui lòng chọn ít nhất 1 mặt hàng",
        duration: 2000,
        position: "top",
        color: "danger", 
      });
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error.length > 0);
  };

  const handleSubmit = async (type: "draft" | "active") => {
    const newItems = receiptItems.map((item) => {
      return {
        productId: item.id,
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.totalPrice,
        discount: item.discount,
      };
    });

    const newFormData = {
      ...formData,
      importDate: formData.importDate,
      quantity,
      totalAmount,
      totalProduct: newItems.length,
      items: newItems,
      status: type === "draft" ? "draft" : "processing",
      supplier: formData.supplier.split("__")[0],
    };

    try {
      const isValid = await validateForm(newFormData);
      if (!isValid) return;

      const result = await createReceipt(newFormData);

      if (result.id) {
        presentToast({
          message: "Tạo phiếu nhập thành công",
          duration: 2000,
          position: "top",
          color: "success", 
        });
      } else {
        presentToast({
          message: "Tạo phiếu nhập thất bại",
          duration: 2000,
          position: "top",
          color: "danger", 
        });
      }

      history.push("/tabs/inventory");
    } catch (error) {
      presentToast({
        message: (error as Error).message || "Lỗi tạo phiếu nhập",
        duration: 2000,
        position: "top",
        color: "danger", 
      });
    }
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setReceiptItems([]);
    setFormData(initialDefaultItem);

    event.detail.complete();
  };

  return (
    <>
      <IonContent className="ion-padding">
        <IonRefresher
          slot="fixed"
          pullFactor={0.5}
          pullMin={100}
          pullMax={200}
          onIonRefresh={handleRefresh}
        >
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/inventory" />
            </IonButtons>
            <IonTitle> Tạo mới phiếu nhập </IonTitle>
          </IonToolbar>
          <IonToolbar className="mt-2 flex justify-between">
            <div
              className="ion-activatable receipt-import-ripple-parent"
              onClick={() => openModalSelectProduct()}
            >
              <IonIcon icon={search} className="text-2xl" />
              Tìm kiếm hàng hóa
              <IonRippleEffect className="custom-ripple"></IonRippleEffect>
            </div>

            <IonButtons slot="end" className="ml-2">
              <IonButton color="primary" onClick={() => startScan()}>
                <IonIcon icon={scanOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonCard className="p-2 mt-2">
          <IonCardContent>
            <div className="flex justify-between items-center">
              <IonText color="medium">
                Mã phiếu: {`NH${dayjs().format("YYMMDDHHmm")}`}
              </IonText>
            </div>

            {/* Import date selection */}
            <IonItem
              className={clsx("mt-3", errors.importDate ? "ion-invalid" : "")}
            >
              <IonLabel position="stacked">Ngày nhập dự kiến *</IonLabel>
              <DatePicker
                attrs={{ id: "importDate" }}
                value={formData.importDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    importDate: e.detail.value! as string,
                  }))
                }
              />
              {errors.importDate && (
                <IonNote slot="error">{errors.importDate}</IonNote>
              )}
            </IonItem>

            {/* Payment date selection */}
            <IonItem
              className={clsx("mt-3", errors.paymentDate ? "ion-invalid" : "")}
            >
              <IonLabel position="stacked">Ngày thanh toán *</IonLabel>
              <DatePicker
                attrs={{ id: "paymentDate" }}
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDate: e.detail.value! as string,
                  }))
                }
              />
              {errors.paymentDate && (
                <IonNote color="danger">{errors.paymentDate}</IonNote>
              )}
            </IonItem>

            {/* Supplier selection */}
            <IonItem
              button={true}
              detail={false}
              onClick={openModalSelectSupplier}
              className={clsx("mt-3", errors.supplier ? "ion-invalid" : "")}
            >
              <IonLabel position="stacked">Chọn nhà cung cấp *</IonLabel>
              <button className="w-full p-4 rounded-lg border border-gray-300 text-left flex items-center justify-between">
                <span className="text-gray-500">
                  {formData.supplier
                    ? formData.supplier.split("__")[1]
                    : "Nhà cung cấp"}
                </span>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
              {errors.supplier && (
                <IonNote color="danger">*{errors.supplier}</IonNote>
              )}
            </IonItem>
          </IonCardContent>
        </IonCard>

        {receiptItems.length > 0 && (
          <IonList>
            {receiptItems.map((item, index) => (
              <ReceiptItem
                key={index}
                {...item}
                quantity={item.quantity} // Pass quantity prop
                onRowChange={(data) => {
                  setReceiptItems((prev) => {
                    const newItems = [...prev];
                    newItems[index] = data;
                    return newItems;
                  });
                }}
                onRemoveItem={(id) => {
                  setReceiptItems((prev) =>
                    prev.filter((item) => item.id !== id)
                  );
                }}
              />
            ))}
          </IonList>
        )}
      </IonContent>

      <IonFooter>
        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-1">
            <div className="text-lg font-bold">Tổng tiền hàng</div>
            <div className="text-lg font-bold">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <div className="text-gray-500 mb-4">
            {receiptItems.length} mặt hàng • Số lượng: {quantity}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              onClick={handleSubmit.bind(null, "draft")}
            >
              <IonIcon icon={saveOutline} slot="start" />
              Lưu tạm
            </IonButton>
            <IonButton
              expand="block"
              onClick={handleSubmit.bind(null, "active")}
            >
              <IonIcon icon={checkmark} slot="start" />
              Xác nhận
            </IonButton>
          </div>
        </div>
      </IonFooter>
    </>
  );
};

export default ReceiptImportCreate;
