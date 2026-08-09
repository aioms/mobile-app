import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    useIonModal,
    IonFooter,
    IonRefresher,
    IonRefresherContent,
    RefresherEventDetail,
    useIonToast,
    IonTextarea,
    IonLabel,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { checkmark, search, chevronDown } from "ionicons/icons";
import clsx from "clsx";
import { getDate } from "@/helpers/date";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import useUser from "@/hooks/apis/useUser";
import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { useLoading } from "@/hooks";

import DatePicker from "@/components/DatePicker";
import ModalSelectProduct from "@/components/ModalSelectProduct";
import ReceiptCheckItem from "./components/ReceiptCheckItem";
import { RECEIPT_CHECK_STATUS } from "@/common/constants/receipt-check.constant";
import AppCard from "@/components/UI/AppCard";
import AppButton from "@/components/UI/AppButton";
import ErrorMessage from "@/components/ErrorMessage";

const initialDefaultItem = {
    note: "",
    checkDate: getDate(new Date()).format(),
    checkStaff: "",
    warehouse: "Kho KS",
    totalProduct: 0,
    items: [],
    periodic: "Đột xuất",
};

const ReceiptCheckCreate: React.FC = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [receiptItems, setReceiptItems] = useState<any[]>([]);
    const [checkStaffList, setCheckStaffList] = useState<any[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const history = useHistory();

    const [presentToast] = useIonToast();
    const { getList: getUserList } = useUser();
    const { create: createReceiptCheck } = useReceiptCheck();
    const { withLoading } = useLoading();
    const [formData, setFormData] = useState(initialDefaultItem);

    // Fetch check staff list
    useEffect(() => {
        const fetchCheckStaff = async () => {
            setLoadingStaff(true);
            try {
                const response = await getUserList({}, 1, 100);
                setCheckStaffList(response || []);
            } catch (error) {
                presentToast({
                    message: (error as Error).message || "Lỗi tải danh sách nhân viên",
                    duration: 2000,
                    position: "top",
                    color: "danger",
                });
            } finally {
                setLoadingStaff(false);
            }
        };

        fetchCheckStaff();
    }, []);

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
                    // Handle both array (multi-select) and single object (legacy support)
                    const products = Array.isArray(data) ? data : [data];

                    // Process each selected product
                    products.forEach(product => {
                        // Check if product already exists
                        const existingItem = receiptItems.find((item) => item.id === product.id);
                        if (existingItem) {
                            presentToast({
                                message: `${product.productName} đã có trong danh sách`,
                                duration: 2000,
                                position: "top",
                                color: "warning",
                            });
                            return;
                        }

                        // Add product to list
                        setReceiptItems((prev) => [...prev, product]);
                    });
                }
            },
        });
    };

    const clearErrors = (key: string) => {
        setErrors((prev) => ({
            ...prev,
            [key]: "",
        }));
    };

    const validateForm = async (values: Record<string, any>) => {
        const newErrors: Record<string, string> = {
            checkDate: "",
            checkStaff: "",
            warehouse: "",
        };

        if (!values.checkDate) {
            newErrors.checkDate = "Vui lòng chọn ngày kiểm";
        }

        if (!values.checkStaff) {
            newErrors.checkStaff = "Vui lòng chọn nhân viên kiểm";
        }

        if (!values.warehouse) {
            newErrors.warehouse = "Vui lòng chọn kho";
        }

        setErrors(newErrors);

        const hasFieldErrors = Object.values(newErrors).some((error) => error.length > 0);
        if (hasFieldErrors) return false;

        if (receiptItems.length === 0) {
            presentToast({
                message: "Vui lòng chọn ít nhất 1 sản phẩm",
                duration: 2000,
                position: "top",
                color: "danger",
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        const isValid = await validateForm(formData);
        if (!isValid) return;

        const items = receiptItems.map((item) => {
            const rawProductCode = item.productCode ?? item.code;
            const numericProductCode =
                typeof rawProductCode === "number"
                    ? rawProductCode
                    : parseInt(String(rawProductCode || "").replace(/\D/g, ""), 10) || 0;

            return {
                productId: item.id,
                productCode: numericProductCode,
                productName: item.productName || item.name || "",
                quantity: 1,
                inventory: item.inventory ?? 0,
                actualInventory: item.actualInventory ?? item.inventory ?? 0,
                costPrice: item.costPrice ?? item.price ?? 0,
            };
        });

        const payload = {
            date: getDate(formData.checkDate).format(),
            note: formData.note,
            periodic: "Đột xuất",
            checker: formData.checkStaff,
            items: items,
            warehouse: formData.warehouse,
            status: RECEIPT_CHECK_STATUS.PROCESSING
        };

        try {
            await withLoading(async () => {
                const result = await createReceiptCheck(payload);

                presentToast({
                    message: "Tạo phiếu kiểm thành công",
                    duration: 2000,
                    position: "top",
                    color: "success",
                });

                history.push(`/tabs/receipt-check/detail/${result.id}`);
            });
        } catch (error) {
            presentToast({
                message: (error as Error).message || "Lỗi tạo phiếu kiểm",
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
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/tabs/inventory" />
                    </IonButtons>
                    <IonTitle>Mã phiếu kiểm</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="bg-gray-50 pb-20">
                <IonRefresher
                    slot="fixed"
                    pullFactor={0.5}
                    pullMin={100}
                    pullMax={200}
                    onIonRefresh={handleRefresh}
                >
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                <AppCard className="mx-4 mt-4 mb-3" noPadding>
                    <div className="p-4 space-y-4">
                        {/* Check Date */}
                        <div className={clsx(errors.checkDate && "border-red-500")}>
                            <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                Ngày kiểm *
                            </IonLabel>
                            <div className="border border-gray-300 rounded-lg bg-white h-[46px] overflow-hidden">
                                <DatePicker
                                    attrs={{ id: "checkDate" }}
                                    extraClassName="w-full h-full bg-white !rounded-none !px-3"
                                    value={formData.checkDate}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            checkDate: e.detail.value! as string,
                                        }));
                                        clearErrors("checkDate");
                                    }}
                                />
                            </div>
                            <ErrorMessage message={errors.checkDate || ""} />
                        </div>

                        {/* Search Product */}
                        <div>
                            <button
                                className="w-full p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-center active:bg-blue-100 transition-colors shadow-sm"
                                onClick={openModalSelectProduct}
                            >
                                <IonIcon icon={search} className="text-xl text-blue-600 mr-2" />
                                <span className="text-blue-700 font-medium text-[15px]">
                                    Chạm để tìm kiếm sản phẩm
                                </span>
                            </button>
                        </div>
                    </div>
                </AppCard>

                {/* Product List */}
                {receiptItems.length > 0 && (
                    <AppCard className="mx-4 mb-3" noPadding>
                        {/* Column Headers */}
                        <div className="px-4 py-3 flex justify-between items-center text-sm font-medium text-gray-600 bg-gray-50/80 border-b border-gray-100 rounded-t-2xl">
                            <div>Sản phẩm đã chọn</div>
                        </div>

                        <div className="bg-white rounded-b-2xl overflow-hidden">
                            {receiptItems.map((item, index) => (
                                <ReceiptCheckItem
                                    key={index}
                                    {...item}
                                    onRemoveItem={(id) => {
                                        setReceiptItems((prev) =>
                                            prev.filter((item) => item.id !== id)
                                        );
                                    }}
                                />
                            ))}
                        </div>
                    </AppCard>
                )}

                {/* Check Staff and Warehouse Selection */}
                <AppCard className="mx-4 mb-3">
                    <div className="space-y-4">
                        {/* Check Staff Selection */}
                        <div className={clsx(errors.checkStaff && "border-red-500")}>
                            <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                Nhân viên kiểm *
                            </IonLabel>
                            <div className="relative border border-gray-300 rounded-lg bg-white">
                                <select
                                    value={formData.checkStaff}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            checkStaff: e.target.value,
                                        }));
                                        clearErrors("checkStaff");
                                    }}
                                    disabled={loadingStaff}
                                    className="w-full p-3 bg-transparent appearance-none outline-none z-10 relative"
                                >
                                    <option value="" disabled hidden>
                                        Chọn nhân viên
                                    </option>
                                    {checkStaffList.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.fullname || staff.username || staff.email}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <IonIcon icon={chevronDown} />
                                </div>
                            </div>
                            <ErrorMessage message={errors.checkStaff || ""} />
                        </div>

                        {/* Warehouse Selection */}
                        <div className={clsx(errors.warehouse && "border-red-500")}>
                            <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                Kho *
                            </IonLabel>
                            <div className="relative border border-gray-300 rounded-lg bg-white">
                                <select
                                    value={formData.warehouse}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            warehouse: e.target.value,
                                        }));
                                        clearErrors("warehouse");
                                    }}
                                    className="w-full p-3 bg-transparent appearance-none outline-none z-10 relative"
                                >
                                    <option value="" disabled hidden>
                                        Chọn kho
                                    </option>
                                    <option value="Kho KS">Kho KS</option>
                                    <option value="Kho KH">Kho KH</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <IonIcon icon={chevronDown} />
                                </div>
                            </div>
                            <ErrorMessage message={errors.warehouse || ""} />
                        </div>

                        {/* Note */}
                        <div>
                            <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                Ghi chú
                            </IonLabel>
                            <div className="border border-gray-300 rounded-lg bg-white p-1">
                                <IonTextarea
                                    value={formData.note}
                                    placeholder="Nhập ghi chú (không bắt buộc)"
                                    rows={3}
                                    className="!m-0 px-2"
                                    onIonInput={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            note: e.detail.value || "",
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </AppCard>
            </IonContent>

            <IonFooter className="bg-white ion-no-border border-t border-gray-100">
                <div className="px-4 py-3 pb-8 safe-area-bottom">
                    <div className="text-gray-500 text-sm mb-3 font-medium">
                        {receiptItems.length} sản phẩm
                    </div>
                    <AppButton
                        fullWidth
                        variant="primary"
                        onClick={handleSubmit}
                        icon={<IonIcon icon={checkmark} />}
                    >
                        Tạo phiếu
                    </AppButton>
                </div>
            </IonFooter>
        </IonPage>
    );
};

export default ReceiptCheckCreate;