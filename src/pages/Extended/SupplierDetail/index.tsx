import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { searchOutline, ellipsisVertical, filterOutline } from 'ionicons/icons';
import useSupplier from '@/hooks/apis/useSupplier';
import useReceiptImport from '@/hooks/apis/useReceiptImport';
import { ReceiptImportStatus } from '@/common/enums/receipt';

// Components
import { AppButton } from '@/components/UI';
import SupplierHero from './components/SupplierHero';
import StatsSection from './components/StatsSection';
import ReceiptItem, { IReceiptImport } from './components/ReceiptItem';
import DatePicker from '@/components/DatePicker';

// Types
import { ISupplierDetail } from './types';

dayjs.extend(utc);

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoàn thành', value: ReceiptImportStatus.COMPLETED },
  { label: 'Đang xử lý', value: ReceiptImportStatus.PROCESSING },
  { label: 'Đã hủy', value: ReceiptImportStatus.CANCELLED },
];

const dateFilterFormat = {
  date: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
};

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<ISupplierDetail | null>(null);

  const [receiptSearchText, setReceiptSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [fromDate, setFromDate] = useState<string | undefined>(dayjs().startOf('month').toISOString());
  const [toDate, setToDate] = useState<string | undefined>(dayjs().endOf('day').toISOString());

  const [receipts, setReceipts] = useState<IReceiptImport[]>([]);
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState<{ totalPages: number; total: number } | null>(null);
  const [isFetchingReceipts, setIsFetchingReceipts] = useState(false);

  const { getDetail } = useSupplier();
  const { getList: getReceiptsList } = useReceiptImport();

  const fetchSupplierDetail = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getDetail(id);

      if (response && response.data) {
        setSupplier(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSupplierDetail();
  }, [fetchSupplierDetail]);

  const fetchReceipts = useCallback(async (pageNum = 1, shouldAppend = false) => {
    try {
      setIsFetchingReceipts(true);
      const filters: any = {
        suppliers: [id],
        isGetItems: "true",
      };

      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      if (fromDate) {
        filters.fromDate = dayjs(fromDate).startOf('day').utc().format();
      }

      if (toDate) {
        filters.toDate = dayjs(toDate).endOf('day').utc().format();
      }

      if (receiptSearchText) {
        filters.keyword = receiptSearchText;
      }

      const response: any = await getReceiptsList(filters, pageNum);
      if (response?.success) {
        if (shouldAppend) {
          setReceipts(prev => [...prev, ...response.data]);
        } else {
          setReceipts(response.data);
        }
        setMetadata(response.metadata);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setIsFetchingReceipts(false);
    }
  }, [id, selectedStatus, fromDate, toDate, receiptSearchText, getReceiptsList]);

  useEffect(() => {
    fetchReceipts(1, false);
  }, [fetchReceipts]);

  const handleRefresh = async (event: CustomEvent) => {
    await Promise.all([fetchSupplierDetail(), fetchReceipts(1, false)]);
    event.detail.complete();
  };

  const handleLoadMore = () => {
    if (metadata && page < metadata.totalPages) {
      fetchReceipts(page + 1, true);
    }
  };


  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended/suppliers" color="dark" />
          </IonButtons>
          <IonTitle className="text-center font-bold text-[17px] text-gray-900 absolute inset-0 pointer-events-none flex items-center justify-center">
            Chi tiết nhà cung cấp
          </IonTitle>
          <IonButtons slot="end">
            <IonButton className="text-gray-900">
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : supplier ? (
          <div className="pb-8">
            <SupplierHero supplier={supplier} />

            <StatsSection supplier={supplier} />

            <div className="px-4 mt-6">
              {/* Receipt Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IonSearchbar
                    value={receiptSearchText}
                    onIonInput={(e) => setReceiptSearchText(e.detail.value!)}
                    debounce={800}
                    placeholder="Tìm kiếm theo sản phẩm hoặc mã giao..."
                    className="custom-app-searchbar p-0 m-0 w-full"
                    searchIcon={searchOutline}
                    clearIcon={undefined}
                    style={{
                      '--background': '#fff',
                      '--border-radius': '12px',
                      '--box-shadow': '0 1px 2px rgba(0,0,0,0.05)',
                      '--placeholder-color': '#9CA3AF',
                      '--icon-color': '#9CA3AF',
                      '--padding-start': '40px'
                    }}
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2 items-center">
                  {/* Status Select */}
                  <div className="relative flex-1">
                    <select
                      className="w-full appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2.5 pr-10 text-[13px] font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <IonIcon icon={filterOutline} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* From Date */}
                  <div className="relative flex-1 group">
                    <div className="absolute -top-2 left-3 bg-gray-50 px-1.5 z-10">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Từ ngày</span>
                    </div>
                    <DatePicker
                      attrs={{ id: 'fromDate' }}
                      value={fromDate}
                      presentation="date"
                      formatOptions={dateFilterFormat}
                      onChange={(e) => setFromDate(e.detail.value!)}
                      extraClassName="bg-white border border-gray-100 rounded-xl px-3 !pt-3.5 !pb-1.5 text-[13px] font-medium text-gray-700 shadow-sm w-full transition-all group-focus-within:border-blue-500/50"
                    />
                  </div>

                  {/* To Date */}
                  <div className="relative flex-1 group">
                    <div className="absolute -top-2 left-3 bg-gray-50 px-1.5 z-10">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đến ngày</span>
                    </div>
                    <DatePicker
                      attrs={{ id: 'toDate' }}
                      value={toDate}
                      presentation="date"
                      formatOptions={dateFilterFormat}
                      onChange={(e) => setToDate(e.detail.value!)}
                      extraClassName="bg-white border border-gray-100 rounded-xl px-3 !pt-3.5 !pb-1.5 text-[13px] font-medium text-gray-700 shadow-sm w-full transition-all group-focus-within:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>


              {/* Receipt List */}
              <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">
                GIAO DỊCH CUNG ỨNG
              </h3>

              <div className="flex flex-col">
                {isFetchingReceipts && receipts.length === 0 ? (
                  <div className="flex justify-center py-10">
                    <IonSpinner name="crescent" color="primary" />
                  </div>
                ) : receipts.length > 0 ? (
                  <>
                    {receipts.map((receipt) => (
                      <ReceiptItem
                        key={receipt.id}
                        receipt={receipt}
                        onClick={() => history.push(`/tabs/receipt-import/detail/${receipt.id}`)}
                      />
                    ))}

                    {metadata && page < metadata.totalPages && (
                      <div className="flex justify-center mt-4">
                        <AppButton
                          variant="pill"
                          onClick={handleLoadMore}
                          loading={isFetchingReceipts}
                          loadingText="Đang tải giao dịch..."
                        >
                          Xem các giao dịch cũ hơn
                        </AppButton>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">Không có giao dịch nào khớp với bộ lọc.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <p className="text-gray-500 mb-4">Không tìm thấy thông tin nhà cung cấp.</p>
            <IonButton fill="outline" onClick={() => history.goBack()}>Quay lại</IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SupplierDetail;
