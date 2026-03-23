import React from 'react';
import { formatCurrency } from '@/helpers/formatters';
import { ISupplierDetail } from '../types';

interface StatsSectionProps {
  supplier: ISupplierDetail;
}

const StatsSection: React.FC<StatsSectionProps> = ({ supplier }) => {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 mb-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          Tổng đã chi
        </span>
        <span className="text-[18px] font-bold text-blue-600">
          {formatCurrency(supplier.totalPurchased || 0)}
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          Đơn nhập
        </span>
        <span className="text-[18px] font-bold text-gray-900">
          {supplier.totalOrders || 0}
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          Tổng công nợ
        </span>
        <span className="text-[18px] font-bold text-gray-900">
          {formatCurrency(supplier.totalDebt || 0)}
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Phiếu nhập CTT
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[18px] font-bold text-gray-900">
            {supplier.totalReceiptCheck || 0}
          </span>
          <span className="text-yellow-400 text-sm">★</span>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
