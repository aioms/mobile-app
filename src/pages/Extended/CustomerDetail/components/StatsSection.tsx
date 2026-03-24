import React from 'react';
import { formatCurrency } from '@/helpers/formatters';

interface StatsSectionProps {
  totalPaid: number;
  totalOrders: number;
  totalDebt: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ totalPaid, totalOrders, totalDebt }) => {
  return (
    <div className="flex flex-col gap-3 px-4 mb-3 mt-3">
      <div className="flex gap-3">
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">TỔNG THANH TOÁN</p>
          <p className="text-[22px] font-bold text-blue-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">TỔNG ĐƠN HÀNG</p>
          <p className="text-[22px] font-bold text-gray-900">{totalOrders}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">TỔNG CÔNG NỢ</p>
        <p className="text-[22px] font-bold text-red-500">{formatCurrency(totalDebt)}</p>
      </div>
    </div>
  );
};

export default StatsSection;
