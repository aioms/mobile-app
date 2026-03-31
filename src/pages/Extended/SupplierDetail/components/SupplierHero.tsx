import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  mailOutline,
  callOutline,
  businessOutline
} from 'ionicons/icons';
import { ISupplierDetail } from '../types';

interface SupplierHeroProps {
  supplier: ISupplierDetail;
}

const SupplierHero: React.FC<SupplierHeroProps> = ({ supplier }) => {
  return (
    <div className="bg-white px-6 pb-6 pt-2 rounded-b-[32px] shadow-sm mb-4">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-3">
          <IonIcon icon={businessOutline} className="text-3xl text-blue-600" />
        </div>

        <h2 className="text-[22px] font-bold text-gray-900 mb-1">{supplier.name}</h2>

        <div className="mb-3">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            supplier.status === 'collaborating'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {supplier.status === 'collaborating' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
          </span>
        </div>

        {supplier.company && (
          <p className="text-gray-500 text-[14px] mb-4">
            {supplier.company}
          </p>
        )}

        <div className="w-full space-y-2 mt-2">
          {supplier.email && (
            <div className="flex items-center justify-center gap-2 text-[14px] text-gray-600">
              <IonIcon icon={mailOutline} className="text-blue-600 text-lg" />
              <span>{supplier.email}</span>
            </div>
          )}

          {supplier.phone && (
            <div className="flex items-center justify-center gap-2 text-[14px] text-gray-600">
              <IonIcon icon={callOutline} className="text-blue-600 text-lg" />
              <span>{supplier.phone}</span>
            </div>
          )}
        </div>

        {/* <div className="flex gap-3 w-full mt-6">
          <button className="flex-1 bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
            Chỉnh sửa hồ sơ
          </button>
          <button className="flex-1 bg-red-500 active:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors">
            Xoá liên hệ
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default SupplierHero;
