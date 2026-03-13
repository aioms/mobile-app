import React from 'react';
import { IonIcon } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const CustomerModule: React.FC = () => {
  const history = useHistory();

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3 text-gray-800">Khách hàng</h2>
      <div 
        className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
        onClick={() => history.push('/tabs/extended/customers')}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <IonIcon icon={peopleOutline} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Quản lý khách hàng</h3>
            <p className="text-xs text-gray-500 mt-1">Xem và quản lý danh sách thông tin khách hàng</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerModule;
