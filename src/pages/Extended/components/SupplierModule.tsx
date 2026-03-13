import React from 'react';
import { IonIcon } from '@ionic/react';
import { briefcaseOutline } from 'ionicons/icons';

const SupplierModule: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3 text-gray-800">Nhà cung cấp</h2>
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <IonIcon icon={briefcaseOutline} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Quản lý nhà cung cấp</h3>
            <p className="text-xs text-gray-500 mt-1">Xem và quản lý danh sách nhà cung cấp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierModule;
