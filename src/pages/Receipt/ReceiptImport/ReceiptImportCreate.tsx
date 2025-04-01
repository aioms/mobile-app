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
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { checkmark, saveOutline, scanOutline, search } from "ionicons/icons";
import { Toast } from "@capacitor/toast";
import { getDate } from "@/helpers/date";
import dayjs from "dayjs";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

import { formatCurrency } from "@/helpers/formatters";
import useReceiptImport from "@/hooks/apis/useReceiptImport";

import DatePicker from "@/components/DatePicker";
import ModalSelectProduct from "../components/ModalSelectProduct";
import ReceiptItem from "../components/ReceiptItem";
import ModalSelectSupplier from "../components/ModalSelectSupplier";

import "./ReceiptImportCreate.css";

const initialDefaultItem = {
  note: "",
  importDate: getDate(new Date()).format(),
  paymentDate: getDate(new Date()).format(),
  quantity: 0,
  supplier: "",
  warehouseLocation: "Kho KS1",
  totalAmount: 0,
  totalProduct: 0,
  items: [],
};

const ReceiptImportCreate: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptItems, setReceiptItems] = useState<any[]>([]);
  const history = useHistory();

  const { create: createReceipt } = useReceiptImport();
  const [formData, setFormData] = useState(initialDefaultItem);

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

  const scanBarcode = async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) {
        return await Toast.show({
          text: "Bạn cần cấp quyền truy cập camera để quét mã vạch",
          duration: "short",
          position: "center",
        });
      }

      const { barcodes } = await BarcodeScanner.scan();

      const barcodeValue = barcodes.find((barcode) => barcode.rawValue);

      await Toast.show({
        text: JSON.stringify(barcodeValue),
        duration: "long",
        position: "top",
      });
    } catch (error: any) {
      await Toast.show({
        text: (error as Error).message,
        duration: "long",
        position: "top",
      });
    }
  };

  const requestPermissions = async () => {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === "granted" || camera === "limited";
  };

  const clearErrors = (key: string) => {
    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const validateForm = async (values: Record<string, any>) => {
    const newErrors: Record<string, string> = {
      quantity: "",
      expectedImportDate: "",
      paymentDate: "",
      supplier: "",
    };

    if (values.quantity <= 0) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!values.expectedImportDate) {
      newErrors.expectedImportDate = "Vui lòng chọn ngày nhập";
    }

    if (!values.paymentDate) {
      newErrors.paymentDate = "Vui lòng chọn ngày thanh toán";
    }

    if (
      values.paymentDate &&
      values.expectedImportDate &&
      values.paymentDate < values.expectedImportDate
    ) {
      newErrors.paymentDate = "Ngày thanh toán phải sau ngày nhập";
    }

    if (!values.supplier) {
      newErrors.supplier = "Vui lòng chọn nhà cung cấp";
    }

    if (receiptItems.length === 0) {
      await Toast.show({
        text: "Vui lòng chọn ít nhất 1 mặt hàng",
        duration: "short",
        position: "center",
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
      expectedImportDate: formData.importDate,
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
        await Toast.show({
          text: "Tạo phiếu nhập thành công",
          duration: "short",
          position: "top",
        });
      } else {
        await Toast.show({
          text: "Tạo phiếu nhập thất bại",
          duration: "short",
          position: "top",
        });
      }

      history.push("/tabs/inventory");
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
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
              <IonButton color="primary" onClick={scanBarcode}>
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
              className={clsx(
                "mt-3",
                errors.expectedImportDate ? "ion-invalid" : ""
              )}
            >
              <IonLabel position="stacked">Ngày nhập dự kiến *</IonLabel>
              <DatePicker
                attrs={{ id: "expectedImportDate" }}
                value={formData.importDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    importDate: e.detail.value! as string,
                  }))
                }
              />
              {errors.expectedImportDate && (
                <IonNote slot="error">{errors.expectedImportDate}</IonNote>
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
                  {formData.supplier ? formData.supplier.split("__")[1] : "Nhà cung cấp"}
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
