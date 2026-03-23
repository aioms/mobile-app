import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
} from '@ionic/react';
import { searchOutline, optionsOutline, ellipsisVertical, filterOutline, calendarOutline } from 'ionicons/icons';
import useSupplier from '@/hooks/apis/useSupplier';
import { ReceiptImportStatus } from '@/common/enums/receipt';

// Components
import SupplierHero from './components/SupplierHero';
import StatsSection from './components/StatsSection';
import ReceiptItem from './components/ReceiptItem';

// Types
import { ISupplierDetail } from './types';

const MOCK_RECEIPTS = [
  {
    id: '1',
    code: 'TXN-882941',
    createdAt: '2023-10-24T10:00:00Z',
    totalAmount: 12450.00,
    status: 'Đã nhận',
    items: [
      { productName: 'Arm Cortex-M4 Microcontrollers', quantity: 500, price: 20 },
      { productName: 'Multi-layer PCB Prototypes', quantity: 20, price: 122.5 }
    ]
  },
  {
    id: '2',
    code: 'TXN-881520',
    createdAt: '2023-10-12T09:30:00Z',
    totalAmount: 1200.00,
    status: 'Đã nhận',
    items: [
      { productName: 'SMD Resistor Kits - 0805', quantity: 100, price: 12 }
    ]
  },
  {
    id: '3',
    code: 'TXN-880112',
    createdAt: '2023-09-28T14:15:00Z',
    totalAmount: 8920.50,
    status: 'Đang xử lý',
    items: [
      { productName: 'Custom Aluminum Enclosures', quantity: 100, price: 40 },
      { productName: 'Tactile Switches - Silent', quantity: 2500, price: 1.9682 }
    ]
  }
];

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoàn thành', value: ReceiptImportStatus.COMPLETED },
  { label: 'Đang xử lý', value: ReceiptImportStatus.PROCESSING },
  { label: 'Đã hủy', value: ReceiptImportStatus.CANCELLED },
];

const timeOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hôm nay', value: 'day' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm nay', value: 'year' },
];

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<ISupplierDetail | null>(null);

  const [receiptSearchText, setReceiptSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [receipts] = useState(MOCK_RECEIPTS);

  const { getList } = useSupplier();
  // const { getList: getReceiptsList } = useReceiptImport();

  useEffect(() => {
    fetchSupplierDetail();
  }, [id]);

  const fetchSupplierDetail = async () => {
    try {
      setLoading(true);

      // We simulate fetching detail from list since there's no getDetail endpoint
      const response = await getList({ supplierIds: id }, 1, 1);

      if (response && response.data && response.data.length > 0) {
        const data = response.data[0];

        // Enrich with mock details matching the design
        setSupplier({
          ...data,
          status: 1, // Mock verified status
          email: 'orders@nexus-elec.com', // Mock email
          type: 'linh kiện bán dẫn & PCB chính', // Mock type
          phone: '+1 (555) 012-3456', // Mock phone
          totalOrders: 24, // Mock total orders
          totalReceiptCheck: 6 // Mock total check receipts
        });
      } else {
        // Fallback for demo
        setSupplier({
          id: id,
          name: 'Nexus Electronics Ltd.',
          status: 1,
          email: 'orders@nexus-elec.com',
          phone: '+1 (555) 012-3456',
          type: 'linh kiện bán dẫn & PCB chính',
          totalPurchased: 142500,
          totalDebt: 500,
          totalOrders: 24,
          totalReceiptCheck: 6
        });
      }
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = r.code.toLowerCase().includes(receiptSearchText.toLowerCase()) ||
      r.items.some(i => i.productName.toLowerCase().includes(receiptSearchText.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === ReceiptImportStatus.COMPLETED && r.status === 'Đã nhận') ||
      (selectedStatus === ReceiptImportStatus.PROCESSING && r.status === 'Đang xử lý');

    return matchesSearch && matchesStatus;
  });

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
                    placeholder="Tìm kiếm theo sản phẩm hoặc mã giao..."
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
                </div>
                {/* <button className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm flex-shrink-0 text-gray-700">
                  <IonIcon icon={optionsOutline} className="text-xl" />
                </button> */}
              </div>

              {/* Filters Row */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-3">
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


              {/* Receipt List */}
              <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">
                GIAO DỊCH CUNG ỨNG
              </h3>

              <div className="flex flex-col">
                {filteredReceipts.length > 0 ? (
                  <>
                    {filteredReceipts.map((receipt) => (
                      <ReceiptItem
                        key={receipt.id}
                        receipt={receipt}
                        onClick={() => {}}
                      />
                    ))}

                    <div className="mt-4">
                      <IonButton
                        fill="clear"
                        expand="block"
                        className="text-blue-600 font-semibold"
                      >
                        Xem các giao dịch cũ hơn
                      </IonButton>
                    </div>
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
