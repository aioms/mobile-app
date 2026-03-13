import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { mailOutline, callOutline } from 'ionicons/icons';
import { ICustomerDetail } from '../types';

interface CustomerHeroProps {
  customer: ICustomerDetail;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CustomerHero: React.FC<CustomerHeroProps> = ({ customer, onEdit, onDelete }) => {
  return (
    <div className="flex flex-col items-center pt-6 pb-8 bg-white">
      {/* Name */}
      <h1 className="text-[28px] font-bold text-gray-900 mb-2">{customer.name}</h1>

      {/* Email */}
      {customer.email && (
        <div className="flex items-center gap-2 mb-1">
          <IonIcon icon={mailOutline} className="text-blue-500 text-lg" />
          <span className="text-blue-500 text-[15px]">{customer.email}</span>
        </div>
      )}

      {/* Phone */}
      {customer.phone && (
        <div className="flex items-center gap-2 mb-6">
          <IonIcon icon={callOutline} className="text-gray-400 text-lg" />
          <span className="text-gray-400 text-[15px]">{customer.phone}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full px-8">
        <IonButton 
          expand="block" 
          className="flex-1 h-[48px] m-0 text-white font-semibold shadow-none"
          onClick={onEdit}
          style={{ 
            '--border-radius': '24px',
            '--background': '#2F6BFF',
            '--background-activated': '#1E4DB7',
            '--background-hover': '#2558D8'
          }}
        >
          Chỉnh sửa
        </IonButton>
        <IonButton 
          expand="block" 
          className="flex-1 h-[48px] m-0 text-[#2F6BFF] font-semibold shadow-none"
          onClick={onDelete}
          style={{ 
            '--border-radius': '24px', 
            '--background': '#E5EDFF',
            '--background-activated': '#D0E0FF',
            '--background-hover': '#D8E5FF'
          }}
        >
          Xoá liên hệ
        </IonButton>
      </div>
    </div>
  );
};

export default CustomerHero;
