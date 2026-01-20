import React, { useState, useEffect } from "react";
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
    IonCard,
    IonCardContent,
    useIonModal,
    IonFooter,
    IonList,
    IonRefresher,
    IonRefresherContent,
    RefresherEventDetail,
    useIonToast,
    IonSelect,
    IonSelectOption,
    IonTextarea,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { checkmark, search } from "ionicons/icons";
import { getDate } from "@/helpers/date";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import useUser from "@/hooks/apis/useUser";
import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { useLoading } from "@/hooks";

import DatePicker from "@/components/DatePicker";
import ModalSelectProduct from "@/components/ModalSelectProduct";
import ReceiptCheckItem from "./components/ReceiptCheckItem";
import { RECEIPT_CHECK_STATUS } from "@/common/constants/receipt-check.constant";

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

        if (receiptItems.length === 0) {
            presentToast({
                message: "Vui lòng chọn ít nhất 1 sản phẩm",
                duration: 2000,
                position: "top",
                color: "danger",
            });
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some((error) => error.length > 0);
    };

    const handleSubmit = async () => {
        const isValid = await validateForm(formData);
        if (!isValid) return;

        const items = receiptItems.map((item) => ({
            productId: item.id,
            productCode: item.productCode,
            productName: item.productName,
            quantity: 1,
            inventory: item.inventory,
            costPrice: item.costPrice || 0,
        }));

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
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/tabs/inventory" />
                    </IonButtons>
                    <IonTitle>Mã phiếu kiểm</IonTitle>
                </IonToolbar>
            </IonHeader>

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

                <IonCard className="p-2 mt-2">
                    <IonCardContent>
                        {/* Check Date */}
                        <IonItem
                            className={`mt-3 ${errors.checkDate ? "ion-invalid" : ""}`}
                        >
                            <IonLabel position="stacked">Ngày kiểm *</IonLabel>
                            <DatePicker
                                attrs={{ id: "checkDate" }}
                                value={formData.checkDate}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        checkDate: e.detail.value! as string,
                                    }));
                                    clearErrors("checkDate");
                                }}
                            />
                            {errors.checkDate && (
                                <IonNote slot="error">{errors.checkDate}</IonNote>
                            )}
                        </IonItem>

                        {/* Search Product */}
                        <IonItem className="mt-3" lines="none">
                            <div
                                className="w-full p-3 rounded-lg border border-gray-300 flex items-center cursor-pointer hover:bg-gray-50"
                                onClick={openModalSelectProduct}
                            >
                                <IonIcon icon={search} className="text-xl mr-2" />
                                <span className="text-gray-500">
                                    Tìm kiếm sản phẩm theo tên, mã
                                </span>
                            </div>
                        </IonItem>
                    </IonCardContent>
                </IonCard>

                {/* Product List */}
                {receiptItems.length > 0 && (
                    <>
                        {/* Column Headers */}
                        <div className="mt-4 px-4 py-2 flex justify-between items-center bg-gray-50">
                            <div className="text-sm font-medium text-gray-500">Sản phẩm</div>
                            <div className="text-sm font-medium text-gray-500 mr-16">Tồn kho</div>
                        </div>

                        <IonList>
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
                        </IonList>
                    </>
                )}

                {/* Check Staff and Warehouse Selection */}
                <IonCard className="mt-4">
                    <IonCardContent>
                        {/* Check Staff Selection */}
                        <IonItem
                            className={`mt-3 ${errors.checkStaff ? "ion-invalid" : ""}`}
                        >
                            <IonLabel position="stacked">Nhân viên kiểm *</IonLabel>
                            <IonSelect
                                value={formData.checkStaff}
                                placeholder="Chọn nhân viên"
                                onIonChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        checkStaff: e.detail.value,
                                    }));
                                    clearErrors("checkStaff");
                                }}
                                interface="action-sheet"
                                disabled={loadingStaff}
                            >
                                {checkStaffList.map((staff) => (
                                    <IonSelectOption key={staff.id} value={staff.id}>
                                        {staff.fullname || staff.username || staff.email}
                                    </IonSelectOption>
                                ))}
                            </IonSelect>
                            {errors.checkStaff && (
                                <IonNote slot="error">{errors.checkStaff}</IonNote>
                            )}
                        </IonItem>

                        {/* Warehouse Selection */}
                        <IonItem
                            className={`mt-3 ${errors.warehouse ? "ion-invalid" : ""}`}
                        >
                            <IonLabel position="stacked">Kho *</IonLabel>
                            <IonSelect
                                value={formData.warehouse}
                                placeholder="Chọn kho"
                                onIonChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        warehouse: e.detail.value,
                                    }));
                                    clearErrors("warehouse");
                                }}
                                interface="action-sheet"
                            >
                                <IonSelectOption value="Kho KS">Kho KS</IonSelectOption>
                                <IonSelectOption value="Kho KH">Kho KH</IonSelectOption>
                            </IonSelect>
                            {errors.warehouse && (
                                <IonNote slot="error">{errors.warehouse}</IonNote>
                            )}
                        </IonItem>

                        {/* Note */}
                        <IonItem className="mt-3">
                            <IonLabel position="stacked">Ghi chú</IonLabel>
                            <IonTextarea
                                value={formData.note}
                                placeholder="Nhập ghi chú (không bắt buộc)"
                                rows={3}
                                onIonInput={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        note: e.detail.value || "",
                                    }))
                                }
                            />
                        </IonItem>
                    </IonCardContent>
                </IonCard>
            </IonContent>

            <IonFooter>
                <div className="p-4 border-t">
                    <div className="text-gray-500 mb-4">
                        {receiptItems.length} sản phẩm
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <IonButton
                            expand="block"
                            onClick={handleSubmit}
                        >
                            <IonIcon icon={checkmark} slot="start" />
                            Tạo phiếu
                        </IonButton>
                    </div>
                </div>
            </IonFooter>
        </>
    );
};

export default ReceiptCheckCreate;