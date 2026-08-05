import React from 'react';
import { formatCurrency } from '@/helpers/formatters';
import { ICustomer } from '../types';
import { AppListItem } from '@/components/UI';

interface CustomerItemProps {
  customer: ICustomer;
  onClick?: () => void;
}

const CustomerItem: React.FC<CustomerItemProps> = ({ customer, onClick }) => {
  return (
    <AppListItem onClick={onClick}>
      <div className="flex items-center gap-3 w-full">
        {customer.avatarUrl ? (
          <img src={customer.avatarUrl} alt={customer.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg flex-shrink-0">
            {customer.name && customer.name.length > 0 ? customer.name.charAt(0).toUpperCase() : 'C'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate text-[15px]">{customer.name}</span>
            {customer.isVip && (
              <span className="px-1.5 py-[1px] bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                VIP
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[13px] mt-0.5 truncate">
            {customer.totalOrders || 0} Tổng đơn hàng • đã chi {formatCurrency(customer.totalAmountSpent || 0)}
          </p>
        </div>
      </div>
    </AppListItem>
  );
};

export default CustomerItem;
