import React from 'react';
import { formatCurrency } from '@/helpers/formatters';

interface StatsSectionProps {
  totalTransactions: number;
  totalOrders: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ totalTransactions, totalOrders }) => {
  return (
    <div className="flex gap-4 px-4 mb-3 mt-3">
      <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">TỔNG GIAO DỊCH</p>
        <p className="text-[22px] font-bold text-gray-900">{formatCurrency(totalTransactions)}</p>
      </div>
      <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">TỔNG ĐƠN HÀNG</p>
        <p className="text-[22px] font-bold text-gray-900">{totalOrders}</p>
      </div>
    </div>
  );
};

export default StatsSection;
