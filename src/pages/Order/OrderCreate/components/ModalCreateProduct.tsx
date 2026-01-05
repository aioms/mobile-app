import React, { useState } from "react";
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonTextarea,
    IonTitle,
    IonToolbar,
    InputCustomEvent,
    IonSpinner,
} from "@ionic/react";
import { formatCurrencyWithoutSymbol, parseCurrencyInput } from "@/helpers/formatters";
import { cn } from "@/lib/utils";

interface ModalCreateProductProps {
    dismiss: (data?: any, role?: string) => void;
}

interface IProductFormData {
    productName: string;
    costPrice: number;
    costPriceFormatted: string;
    sellingPrice: number;
    sellingPriceFormatted: string;
    note: string;
}

const initialFormData: IProductFormData = {
    productName: "",
    costPrice: 0,
    costPriceFormatted: "",
    sellingPrice: 0,
    sellingPriceFormatted: "",
    note: "",
};

const ModalCreateProduct: React.FC<ModalCreateProductProps> = ({
    dismiss,
}) => {
    const [formData, setFormData] = useState<IProductFormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: InputCustomEvent) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when field is updated
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePriceChange = (e: InputCustomEvent) => {
        const { name, value } = e.target;
        const numericValue = parseCurrencyInput(`${value || 0}`);

        if (numericValue >= 0) {
            const formattedValue = formatCurrencyWithoutSymbol(numericValue);

            if (name === "costPrice") {
                setFormData((prev) => ({
                    ...prev,
                    costPrice: numericValue,
                    costPriceFormatted: formattedValue,
                }));
            } else if (name === "sellingPrice") {
                setFormData((prev) => ({
                    ...prev,
                    sellingPrice: numericValue,
                    sellingPriceFormatted: formattedValue,
                }));
            }

            // Clear error when field is updated
            if (errors[name]) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.productName.trim()) {
            newErrors.productName = "Vui lòng nhập tên sản phẩm";
        }

        if (formData.costPrice <= 0) {
            newErrors.costPrice = "Vui lòng nhập giá vốn hợp lệ";
        }

        if (formData.sellingPrice <= 0) {
            newErrors.sellingPrice = "Vui lòng nhập giá bán hợp lệ";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Prepare product data
        const productData = {
            productName: formData.productName.trim(),
            costPrice: formData.costPrice,
            sellingPrice: formData.sellingPrice,
            description: formData.note.trim(),
        };

        // Pass data back to parent
        dismiss(productData, "confirm");
    };

    const handleCancel = () => {
        dismiss(null, "cancel");
    };

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={handleCancel} disabled={isSubmitting}>
                            Hủy
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Thêm sản phẩm mới</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={handleConfirm}
                            strong={true}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <IonSpinner name="crescent" /> : "Xác nhận"}
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div className="space-y-4">
                    {/* Product Name */}
                    <div className={cn({ "ion-invalid": errors.productName, "ion-touched": errors.productName })}>
                        <IonInput
                            className={cn("custom-padding border rounded-lg", {
                                "ion-valid": !errors.productName && formData.productName.length > 0,
                                "ion-invalid ion-touched": errors.productName,
                            })}
                            label="Tên sản phẩm"
                            labelPlacement="floating"
                            fill="solid"
                            name="productName"
                            value={formData.productName}
                            onIonChange={handleInputChange}
                            placeholder="Nhập tên sản phẩm"
                            disabled={isSubmitting}
                            errorText={errors.productName}
                        >
                            <div slot="label">
                                Tên sản phẩm <span className="text-red-500">*</span>
                            </div>
                        </IonInput>
                    </div>

                    {/* Cost Price */}
                    <div className={cn({ "ion-invalid": errors.costPrice, "ion-touched": errors.costPrice })}>
                        <IonInput
                            className={cn("custom-padding border rounded-lg", {
                                "ion-valid": !errors.costPrice && formData.costPrice > 0,
                                "ion-invalid ion-touched": errors.costPrice,
                            })}
                            label="Giá vốn (VND)"
                            labelPlacement="floating"
                            fill="solid"
                            name="costPrice"
                            value={formData.costPriceFormatted}
                            onIonInput={handlePriceChange}
                            placeholder="Nhập giá vốn"
                            disabled={isSubmitting}
                            errorText={errors.costPrice}
                        >
                            <div slot="label">
                                Giá vốn (VND) <span className="text-red-500">*</span>
                            </div>
                        </IonInput>
                    </div>

                    {/* Selling Price */}
                    <div className={cn({ "ion-invalid": errors.sellingPrice, "ion-touched": errors.sellingPrice })}>
                        <IonInput
                            className={cn("custom-padding border rounded-lg", {
                                "ion-valid": !errors.sellingPrice && formData.sellingPrice > 0,
                                "ion-invalid ion-touched": errors.sellingPrice,
                            })}
                            label="Giá bán (VND)"
                            labelPlacement="floating"
                            fill="solid"
                            name="sellingPrice"
                            value={formData.sellingPriceFormatted}
                            onIonInput={handlePriceChange}
                            placeholder="Nhập giá bán"
                            disabled={isSubmitting}
                            errorText={errors.sellingPrice}
                        >
                            <div slot="label">
                                Giá bán (VND) <span className="text-red-500">*</span>
                            </div>
                        </IonInput>
                    </div>

                    {/* Note */}
                    <IonTextarea
                        className="border border-input rounded-lg px-2"
                        label="Ghi chú"
                        labelPlacement="floating"
                        fill="outline"
                        name="note"
                        value={formData.note}
                        onIonChange={(e) => {
                            const { name, value } = e.target;
                            setFormData((prev) => ({
                                ...prev,
                                [name as string]: value,
                            }));
                        }}
                        placeholder="Nhập ghi chú (tùy chọn)"
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Lưu ý:</strong> Sản phẩm mới sẽ được tạo với số lượng tồn kho ban đầu là 0.
                        Bạn có thể cập nhật tồn kho sau khi tạo sản phẩm.
                    </p>
                </div>
            </IonContent>
        </>
    );
};

export default ModalCreateProduct;
