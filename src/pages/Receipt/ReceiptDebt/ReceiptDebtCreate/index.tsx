import React, { useState, useMemo } from "react";
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
  useIonModal,
  IonRippleEffect,
  IonText,
  useIonToast,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from "@ionic/react";
import { OverlayEventDetail } from "@ionic/core";
import { checkmarkCircleOutline, printOutline, search } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useStorage } from "@/hooks";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { RECEIPT_DEBT_TYPE } from "@/common/constants/receipt-debt.constant";
import { isHasProperty } from "@/helpers/common";
import { getDate } from "@/helpers/date";
import { formatCurrency } from "@/helpers/formatters";

import DatePicker from "@/components/DatePicker";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import ErrorMessage from "@/components/ErrorMessage";
import ProductList from "./components/ProductList";

import "./ReceiptDebtCreate.css";

interface IProductItem {
  id: string;
  productName: string;
  productCode: number;
  code: string;
  quantity: number;
  sellingPrice: number;
  inventory?: number; // Add inventory field
}

const initialFormData = {
  customer: "",
  estimatedDate: getDate(new Date()).format(),
  note: "",
};

const ReceiptDebtCreate: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [formData, setFormData] = useState(initialFormData);
  const [productItems, setProductItems] = useState<IProductItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { getItem, removeItem } = useStorage();
  const { create: createReceiptDebt } = useReceiptDebt();

  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");

  // Modal for customer selection
  const [presentModalCustomer, dismissModalCustomer] = useIonModal(
    ModalSelectCustomer,
    {
      dismiss: (data: any, role: string) => dismissModalCustomer(data, role),
    }
  );

  const openModalSelectCustomer = () => {
    presentModalCustomer({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role !== "confirm") return;

        if (!data) {
          setSelectedCustomerName("");
          handleFormChange("customer", "");
          return;
        }

        const [customerId, customerName] = data.split("__");
        setSelectedCustomerName(customerName);

        // Update form data with the selected customer ID
        handleFormChange("customer", customerId);
      },
    });
  };

  const totalAmount = useMemo(() => {
    return productItems.reduce((total, product) => {
      return total + product.sellingPrice * product.quantity;
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

    if (!formData.customer) {
      newErrors.customer = "Vui lòng chọn khách hàng";
    }

    if (!formData.estimatedDate) {
      newErrors.estimatedDate = "Vui lòng chọn ngày dự kiến thu";
    }

    if (productItems.length === 0) {
      newErrors.productItems = "Vui lòng chọn ít nhất 1 sản phẩm";
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

    try {
      const payload = {
        type: RECEIPT_DEBT_TYPE.CUSTOMER_DEBT,
        customerId: formData.customer,
        dueDate: formData.estimatedDate,
        totalAmount,
        note: formData.note,
        items: productItems.map((item) => ({
          productId: item.id,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.sellingPrice,
        })),
      };

      const response = await createReceiptDebt(payload);

      if (response.id) {
        await presentToast({
          message: "Tạo mới Phiếu Thu thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });
      }

      // API call to create receipt debt
      history.goBack();
    } catch (error) {
      await presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  useIonViewWillEnter(() => {
    const loadDataFromStorage = async () => {
      const draftReceipt = await getItem("debt_draft");

      if (draftReceipt) {
        const { items, ...rest } = draftReceipt;

        items && setProductItems(items);
        isHasProperty(rest) && setFormData(rest);
      }
    };

    loadDataFromStorage();
  }, []);

  useIonViewWillLeave(() => {
    removeItem("debt_draft");
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>Tạo mới Phiếu Thu</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" size="default">
              <IonIcon icon={printOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Khách hàng section */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Ngày tạo
            </h2>
            <div>{getDate(new Date()).format("DD/MM/YYYY")}</div>
          </div>

          {/* Khách hàng */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Khách hàng
            </h2>
            <div
              className="ion-activatable receipt-debt-ripple-parent break-normal p-2"
              onClick={() => openModalSelectCustomer()}
            >
              <IonIcon icon={search} className="text-2xl mr-2" />
              {selectedCustomerName || "Chọn khách hàng"}
              <IonRippleEffect className="custom-ripple"></IonRippleEffect>
            </div>
            <ErrorMessage message={errors.customer} />
          </div>
        </div>

        {/* Danh sách sản phẩm */}

        <ProductList
          error={errors.productItems}
          productItems={productItems}
          onAddItem={(product) => {
            if (errors.productItems) {
              setErrors((prev) => ({
                ...prev,
                productItems: "",
              }));
            }

            setProductItems((prev) => {
              const existingItem = prev.find((item) => item.id === product.id);

              if (existingItem) {
                return prev.map((item) =>
                  item.id === product.id
                    ? {
                        ...item,
                        ...product,
                      }
                    : item
                );
              } else {
                return [{ ...product }, ...prev];
              }
            });
          }}
          onRemoveItem={(id) => {
            setProductItems((prev) => prev.filter((item) => item.id !== id));
          }}
        />

        <div className="bg-card rounded-lg shadow-sm p-4 mt-3">
          <IonText className="text-lg">Tổng Tiền Phải Thu: </IonText>
          <IonText className="text-lg font-semibold" color="danger">
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
                value={formData.estimatedDate}
                presentation="date"
                onChange={(e) =>
                  handleFormChange("estimatedDate", e.detail.value)
                }
                attrs={{ id: "estimated-date" }}
                extraClassName="w-full flex items-center justify-start"
              />
            </div>
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
      </IonContent>

      <IonFooter>
        <div className="ion-padding">
          <IonButton
            expand="block"
            size="default"
            onClick={handleSubmit}
            // className="submit-button"
          >
            <IonIcon icon={checkmarkCircleOutline} slot="start" />
            Xác nhận tạo Phiếu Thu
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ReceiptDebtCreate;
