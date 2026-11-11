import { AppBadge, AppCard } from "@/components/UI";
import { formatCurrency } from "@/helpers/formatters";
import type { DmsgFinancials } from "@/types/dmsg.type";

const getBadgeColor = (label?: string, isDraft?: boolean) => {
  if (label === "Đã hủy") return "danger";
  if (label === "Chưa lưu") return "warning";
  if (label) return "medium";
  return isDraft ? "primary" : "success";
};

export default function FinancialSummary({ value, draft, stateLabel }: { value: DmsgFinancials | null; draft: boolean; stateLabel?: string }) {
  return <AppCard data-cy="dmsg-summary">
    <div className="flex items-center justify-between mb-3 gap-2">
      <h2 className="text-base font-bold text-gray-900">Chi tiết phân bổ</h2>
      <AppBadge
        color={getBadgeColor(stateLabel, draft)}
        variant="soft"
        className="font-semibold text-xs px-2.5 py-1"
      >
        {stateLabel || (draft ? "Dự kiến" : "Đã ghi nhận")}
      </AppBadge>
    </div>
    {!value ? <p className="text-sm text-gray-500 py-2 text-center">Nhập đủ tài chính để xem kết quả.</p> : <div className="space-y-2.5 text-sm">
      {[["Giá trị trước VAT", value.beforeVat, "beforeVat"], ["Tiền VAT", value.vatAmount, "vatAmount"], ["Chênh lệch hoa hồng", value.commissionAmount, "commissionAmount"], ["Tiền chuyển khách", value.customerTransfer, "customerTransfer"], ["Tổng giá vốn", value.totalCost, "cost"], ["Phí hóa đơn", value.invoiceFee, "fee"]].map(([label, amount, key]) => <div key={key} className="flex justify-between items-center gap-3 py-0.5"><span className="text-gray-500 text-xs">{label}</span><strong className="text-right text-gray-800 tabular-nums text-sm font-semibold" data-cy={`dmsg-result-${key}`}>{formatCurrency(Number(amount))}</strong></div>)}
      <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center gap-3"><span className="font-semibold text-gray-900 text-sm">Doanh thu ĐMSG</span><strong className="text-blue-600 text-right text-base font-bold" data-cy="dmsg-result-revenue">{formatCurrency(value.revenue)}</strong></div>
      <div className={`rounded-xl p-3.5 border ${value.profit < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}><div className="flex justify-between items-center gap-3"><span className="font-semibold text-sm">Lợi nhuận</span><strong className="text-lg text-right font-bold" data-cy="dmsg-result-profit">{formatCurrency(value.profit)}</strong></div>
        <p className="text-xs mt-1 opacity-90">Biên lợi nhuận: {value.revenue > 0 ? new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value.profit / value.revenue * 100) + "%" : "—"}. Đã trừ vốn và phí hóa đơn.</p></div>
      {value.profit < 0 && <p role="alert" className="text-xs font-medium text-red-600 mt-1">⚠️ Đơn đang lỗ. Kiểm tra tài chính trước khi xác nhận.</p>}
    </div>}
  </AppCard>;
}
