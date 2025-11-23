import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonIcon,
  useIonToast,
  useIonModal,
} from "@ionic/react";
import { cameraOutline, chevronDown } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import clsx from "clsx";

import { useLoading } from "@/hooks";
import useProduct from "@/hooks/apis/useProduct";
import {
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import ModalSelectCategory from "@/components/ModalSelectCategory";
import ErrorMessage from "@/components/ErrorMessage";

import type {
  IProductCreateForm,
  IProductCreateFormErrors,
  IProductCreatePayload,
} from "./productCreate.d";

const initialFormData: IProductCreateForm = {
  name: "",
  categoryId: "",
  supplierId: "",
  costPrice: "0",
  salePrice: "0",
  inventory: "0",
  unit: "",
  description: "",
  notes: "",
};

const ProductCreate: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { withLoading, isLoading } = useLoading();
  const { create } = useProduct();

  const [formData, setFormData] = useState<IProductCreateForm>(initialFormData);
  const [errors, setErrors] = useState<IProductCreateFormErrors>({});
  // Category selection via modal
  const [presentCategoryModal, dismissCategoryModal] = useIonModal(
    ModalSelectCategory,
    {
      dismiss: (data: any, role?: string) => {
        if (data && role === "confirm") {
          setFormData((prev) => ({
            ...prev,
            categoryId: data,
          }));
          clearError("categoryId");
        }
        dismissCategoryModal();
      },
    }
  );

  // Modal for supplier selection
  const [presentSupplierModal, dismissSupplierModal] = useIonModal(
    ModalSelectSupplier,
    {
      dismiss: (data: any, role?: string) => {
        if (data && role === "confirm") {
          setFormData((prev) => ({
            ...prev,
            supplierId: data,
          }));
          clearError("supplierId");
        }
        dismissSupplierModal();
      },
    }
  );

  // No initial categories fetch; modal handles category loading

  const openCategoryModal = () => {
    presentCategoryModal();
  };

  const openSupplierModal = () => {
    presentSupplierModal();
  };

  const handleInputChange = (
    field: keyof IProductCreateForm,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    clearError(field);
  };

  const handleCurrencyInputChange = (
    field: "costPrice" | "salePrice",
    value: string
  ) => {
    // Remove non-numeric characters and format
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = numericValue
      ? formatCurrencyWithoutSymbol(parseInt(numericValue))
      : "0";

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
    clearError(field);
  };

  const handleNumericInputChange = (field: "inventory", value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
    clearError(field);
  };

  const clearError = (field: keyof IProductCreateForm) => {
    if (errors[field as keyof IProductCreateFormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof IProductCreateFormErrors];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: IProductCreateFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên sản phẩm là bắt buộc";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Nhóm hàng là bắt buộc";
    }

    if (!formData.supplierId) {
      newErrors.supplierId = "Nhà cung cấp là bắt buộc";
    }

    if (!formData.costPrice || parseCurrencyInput(formData.costPrice) <= 0) {
      newErrors.costPrice = "Giá vốn phải lớn hơn 0";
    }

    if (!formData.salePrice || parseCurrencyInput(formData.salePrice) <= 0) {
      newErrors.salePrice = "Giá bán phải lớn hơn 0";
    }

    if (!formData.inventory || parseInt(formData.inventory) < 0) {
      newErrors.inventory = "Tồn kho không được âm";
    }

    if (!formData.unit.trim()) {
      newErrors.unit = "Đơn vị là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPayload = (status: "draft" | "active"): IProductCreatePayload => {
    const suppliers = [
      {
        id: formData.supplierId.includes("__")
          ? formData.supplierId.split("__")[0]
          : formData.supplierId,
        costPrice: parseCurrencyInput(formData.costPrice),
      },
    ];

    return {
      productName: formData.name.trim(),
      category: formData.categoryId,
      suppliers,
      costPrice: parseCurrencyInput(formData.costPrice),
      sellingPrice: parseCurrencyInput(formData.salePrice),
      inventory: parseInt(formData.inventory),
      unit: formData.unit.trim(),
      description: formData.description?.trim() || undefined,
      note: formData.notes?.trim() || undefined,
      status,
    };
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      await presentToast({
        message: "Vui lòng kiểm tra lại thông tin",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    const payload = createPayload("draft");

    await withLoading(async () => {
      await create(payload);
      await presentToast({
        message: "Lưu tạm sản phẩm thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });
      history.goBack();
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      await presentToast({
        message: "Vui lòng kiểm tra lại thông tin",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    const payload = createPayload("active");

    await withLoading(async () => {
      await create(payload);
      await presentToast({
        message: "Tạo sản phẩm thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });
      history.goBack();
    });
  };

  const getSupplierName = () => {
    if (!formData.supplierId) return "Chọn nhà cung cấp";
    return formData.supplierId.split("__")[1] || "Chọn nhà cung cấp";
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/products" />
          </IonButtons>
          <IonTitle>Tạo sản phẩm</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Product Image Upload */}
        <div className="mb-6">
          <div className="w-full h-48 border-2 border-dashed border-teal-300 rounded-lg flex flex-col items-center justify-center bg-teal-50">
            <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center mb-3">
              <IonIcon
                icon={cameraOutline}
                className="text-2xl text-teal-600"
              />
            </div>
            <p className="text-teal-600 font-medium">Thêm ảnh sản phẩm</p>
          </div>
        </div>

        {/* Product Name */}
        <div className="mb-4">
          <IonItem className={clsx(errors.name && "ion-invalid")}>
            <IonLabel position="stacked">Tên sản phẩm *</IonLabel>
            <IonInput
              placeholder="Nhập tên sản phẩm"
              value={formData.name}
              onIonInput={(e) => handleInputChange("name", e.detail.value!)}
            />
          </IonItem>
          <ErrorMessage message={errors.name || ""} />
        </div>

        {/* Category Selection */}
        <div className={clsx("mb-4", errors.categoryId && "border-red-500")}>
          <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
            Nhóm hàng *
          </IonLabel>
          <button
            className="w-full p-3 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white"
            onClick={openCategoryModal}
          >
            <span
              className={clsx(
                formData.categoryId ? "text-gray-900" : "text-gray-500"
              )}
            >
              {formData.categoryId || "Chọn nhóm hàng"}
            </span>
            <IonIcon icon={chevronDown} className="text-gray-400" />
          </button>
          <ErrorMessage message={errors.categoryId || ""} />
        </div>

        {/* Supplier Selection */}
        <div className={clsx("mb-4", errors.supplierId && "border-red-500")}>
          <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
            Nhà cung cấp *
          </IonLabel>
          <button
            className="w-full p-3 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white"
            onClick={openSupplierModal}
          >
            <span
              className={clsx(
                formData.supplierId ? "text-gray-900" : "text-gray-500"
              )}
            >
              {getSupplierName()}
            </span>
            <IonIcon icon={chevronDown} className="text-gray-400" />
          </button>
          <ErrorMessage message={errors.supplierId || ""} />
        </div>

        {/* Price Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <IonItem className={clsx(errors.costPrice && "ion-invalid")}>
              <IonLabel position="stacked">Giá vốn *</IonLabel>
              <IonInput
                placeholder="0"
                value={formData.costPrice}
                onIonInput={(e) =>
                  handleCurrencyInputChange("costPrice", e.detail.value!)
                }
              />
            </IonItem>
            <ErrorMessage message={errors.costPrice || ""} />
          </div>

          <div>
            <IonItem className={clsx(errors.salePrice && "ion-invalid")}>
              <IonLabel position="stacked">Giá bán *</IonLabel>
              <IonInput
                placeholder="0"
                value={formData.salePrice}
                onIonInput={(e) =>
                  handleCurrencyInputChange("salePrice", e.detail.value!)
                }
              />
            </IonItem>
            <ErrorMessage message={errors.salePrice || ""} />
          </div>
        </div>

        {/* Inventory and Unit */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <IonItem className={clsx(errors.inventory && "ion-invalid")}>
              <IonLabel position="stacked">Tồn kho *</IonLabel>
              <IonInput
                placeholder="0"
                value={formData.inventory}
                onIonInput={(e) =>
                  handleNumericInputChange("inventory", e.detail.value!)
                }
              />
            </IonItem>
            <ErrorMessage message={errors.inventory || ""} />
          </div>

          <div>
            <IonItem className={clsx(errors.unit && "ion-invalid")}>
              <IonLabel position="stacked">Đơn vị *</IonLabel>
              <IonInput
                placeholder="Cái, hộp, kg..."
                value={formData.unit}
                onIonInput={(e) => handleInputChange("unit", e.detail.value!)}
              />
            </IonItem>
            <ErrorMessage message={errors.unit || ""} />
          </div>
        </div>

        {/* Description */}
        <IonItem className="mb-4">
          <IonLabel position="stacked">Thông tin chi tiết về sản phẩm</IonLabel>
          <IonTextarea
            placeholder="Thông tin chi tiết về sản phẩm"
            rows={4}
            value={formData.description}
            onIonInput={(e) =>
              handleInputChange("description", e.detail.value!)
            }
          />
        </IonItem>

        {/* Notes */}
        <IonItem className="mb-6">
          <IonLabel position="stacked">Ghi chú</IonLabel>
          <IonTextarea
            placeholder="Ghi chú thêm"
            rows={3}
            value={formData.notes}
            onIonInput={(e) => handleInputChange("notes", e.detail.value!)}
          />
        </IonItem>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <IonButton
            fill="outline"
            expand="block"
            className="flex-1"
            onClick={handleSaveDraft}
            disabled={isLoading}
          >
            Lưu tạm
          </IonButton>
          <IonButton
            expand="block"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Lưu
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProductCreate;
