import React, { useState, useEffect, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSpinner,
  useIonActionSheet,
} from "@ionic/react";
import { ellipsisVertical, searchOutline, optionsOutline, filterOutline, calendarOutline } from "ionicons/icons";
import { Toast } from "@capacitor/toast";
import { debounce } from "radash";
import dayjs from "dayjs";

import useCustomer from "@/hooks/apis/useCustomer";
import useOrder from "@/hooks/apis/useOrder";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { useLoading } from "@/hooks";
import { IOrder } from "@/types/order.type";
import { ICustomerDetail } from "./types";
import { OrderStatus } from "@/common/enums/order";

import CustomerHero from "./components/CustomerHero";
import StatsSection from "./components/StatsSection";
import OrderItem from "./components/OrderItem";

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [customer, setCustomer] = useState<ICustomerDetail | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSearchText, setOrderSearchText] = useState("");
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");

  // Tabs and Filters
  const [activeTab, setActiveTab] = useState<'orders' | 'receipts'>('orders');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');

  const { getDetail: getCustomerDetail, remove: removeCustomer } = useCustomer();
  const { getList: getOrderList } = useOrder();
  const { getList: getDebtList } = useReceiptDebt();
  const { isLoading, withLoading } = useLoading();
  const [presentActionSheet] = useIonActionSheet();

  const fetchCustomerData = async () => {
    await withLoading(async () => {
      try {
        const data = await getCustomerDetail(id);
        if (data) {
          setCustomer(data);
        }
      } catch (error) {
        console.error("Failed to fetch customer detail:", error);
        Toast.show({ text: "Không thể tải thông tin khách hàng" });
      }
    });
  };

  const fetchOrders = async (page = 1, isRefresh = false) => {
    try {
      setOrderLoading(true);
      const limit = 10;

      const filters: any = {
        customerId: id,
        keyword: orderSearchKeyword
      };

      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      if (timeRange === 'day') {
        filters.startDate = dayjs().startOf('day').toISOString();
        filters.endDate = dayjs().endOf('day').toISOString();
      } else if (timeRange === 'month') {
        filters.startDate = dayjs().startOf('month').toISOString();
        filters.endDate = dayjs().endOf('month').toISOString();
      } else if (timeRange === 'year') {
        filters.startDate = dayjs().startOf('year').toISOString();
        filters.endDate = dayjs().endOf('year').toISOString();
      }

      const response = await getOrderList(filters, page, limit);
      const newOrders = response?.data || [];

      if (isRefresh) {
        setOrders(newOrders);
      } else {
        setOrders((prev) => [...prev, ...newOrders]);
      }

      setHasMoreOrders(newOrders.length === limit);
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
    } finally {
      setOrderLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce({ delay: 500 }, (val: string) => setOrderSearchKeyword(val)),
    []
  );

  useEffect(() => {
    debouncedSearch(orderSearchText);
  }, [orderSearchText, debouncedSearch]);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'orders') {
      fetchOrders(1, true);
      setOrderPage(1);
    }
  }, [id, activeTab, orderSearchKeyword, selectedStatus, timeRange]);

  const loadMoreOrders = () => {
    const nextPage = orderPage + 1;
    fetchOrders(nextPage);
    setOrderPage(nextPage);
  };

  const handleEdit = () => {
    Toast.show({ text: "Tính năng chỉnh sửa đang được phát triển" });
  };

  const handleDelete = async () => {
    presentActionSheet({
      header: "Bạn có chắc chắn muốn xoá khách hàng này?",
      buttons: [
        {
          text: "Xoá",
          role: "destructive",
          handler: async () => {
            try {
              await removeCustomer(id);
              Toast.show({ text: "Đã xoá khách hàng thành công" });
              history.goBack();
            } catch (error) {
              Toast.show({ text: "Xoá thất bại" });
            }
          }
        },
        { text: "Huỷ", role: "cancel" }
      ]
    });
  };

  const statusOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Nháp', value: OrderStatus.DRAFT },
    { label: 'Hoàn thành', value: OrderStatus.COMPLETED },
    { label: 'Chờ xử lý', value: OrderStatus.PENDING },
    { label: 'Trả hàng', value: 'returned' },
    { label: 'Đã hủy', value: OrderStatus.CANCELLED },
  ];

  const timeOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Hôm nay', value: 'day' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Năm nay', value: 'year' },
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended/customers" color="dark" />
          </IonButtons>
          <div className="flex justify-center flex-1 w-full absolute inset-0 items-center pointer-events-none">
            <IonTitle className="text-center font-bold text-gray-900 text-[17px]">Chi tiết khách hàng</IonTitle>
          </div>
          <IonButtons slot="end">
            <IonButton color="dark">
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : customer ? (
          <div className="pb-10">
            {/* Hero Section */}
            <CustomerHero
              customer={customer}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Stats Section */}
            <StatsSection
              totalTransactions={customer.totalAmountSpent || 0}
              totalOrders={customer.totalOrders || 0}
            />

            {/* Content Tabs */}
            <div className="px-4 mb-6">
              <div className="flex p-1 bg-gray-100 rounded-2xl">
                <button
                  className={`flex-1 py-3 text-[14px] font-bold rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  Đơn hàng
                </button>
                <button
                  className={`flex-1 py-3 text-[14px] font-bold rounded-xl transition-all ${activeTab === 'receipts' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('receipts')}
                >
                  Phiếu nhập/nợ
                </button>
              </div>
            </div>

            {/* Orders Tab Content */}
            {activeTab === 'orders' && (
              <div className="px-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
                    Lịch sử đơn hàng
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                      Hoạt động
                    </span>
                  </h3>
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  <div className="flex gap-2 flex-nowrap">
                    {/* Status Select */}
                    <div className="relative">
                      <select
                        className="appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2 pr-10 text-[13px] font-medium text-gray-700 shadow-sm focus:outline-none"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <IonIcon icon={filterOutline} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Time Select */}
                    <div className="relative">
                      <select
                        className="appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2 pr-10 text-[13px] font-medium text-gray-700 shadow-sm focus:outline-none"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                      >
                        {timeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <IonIcon icon={calendarOutline} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Order Search */}
                <div className="relative mb-2">
                  <IonSearchbar
                    value={orderSearchText}
                    onIonInput={(e) => setOrderSearchText(e.detail.value!)}
                    placeholder="Tìm tên sản phẩm hoặc mã đơn"
                    className="p-0 custom-searchbar h-[48px]"
                    searchIcon={searchOutline}
                    clearIcon={undefined}
                    style={{
                      '--background': '#fff',
                      '--border-radius': '12px',
                      '--box-shadow': '0 1px 2px rgba(0,0,0,0.05)',
                      '--placeholder-color': '#9CA3AF',
                      '--icon-color': '#9CA3AF',
                      '--padding-start': '44px'
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IonIcon icon={optionsOutline} className="text-xl" />
                  </div>
                </div>

                {/* Order Grid List */}
                {orderLoading && orders.length === 0 ? (
                  <div className="flex justify-center py-10">
                    <IonSpinner name="crescent" color="primary" />
                  </div>
                ) : orders.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-3">
                      {orders.map((order) => (
                        <OrderItem
                          key={order.id}
                          order={order}
                          onClick={() => history.push(`/tabs/orders/detail/${order.id}`)}
                          isCompact={false}
                        />
                      ))}
                    </div>

                    {hasMoreOrders && (
                      <div className="mt-4">
                        <IonButton
                          fill="clear"
                          expand="block"
                          className="h-[48px] bg-blue-50 text-blue-600 font-semibold rounded-2xl border border-dashed border-blue-200"
                          onClick={loadMoreOrders}
                          disabled={orderLoading}
                        >
                          {orderLoading ? <IonSpinner name="dots" /> : 'Tải thêm đơn hàng'}
                        </IonButton>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">Không có đơn hàng nào khớp với bộ lọc.</p>
                  </div>
                )}
              </div>
            )}

            {/* Receipts Tab Content */}
            {activeTab === 'receipts' && (
              <div className="px-4 text-center py-10">
                <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IonIcon icon={filterOutline} className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-500 font-medium">Lịch sử phiếu nhập và công nợ</p>
                  <p className="text-gray-400 text-sm mt-1">Tính năng này đang được cập nhật dữ liệu.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <p className="text-gray-500 mb-4">Không tìm thấy thông tin khách hàng.</p>
            <IonButton fill="outline" onClick={() => history.goBack()}>Quay lại</IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CustomerDetail;
