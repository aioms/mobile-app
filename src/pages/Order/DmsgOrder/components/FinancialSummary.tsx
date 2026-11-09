import { AppCard } from "@/components/UI";
import { formatCurrency } from "@/helpers/formatters";
import type { DmsgFinancials } from "@/types/dmsg.type";

export default function FinancialSummary({ value, draft, stateLabel }: { value: DmsgFinancials | null; draft: boolean; stateLabel?: string }) {
  return <AppCard data-cy="dmsg-summary">
    <div className="flex items-center justify-between mb-3 gap-2"><h2 className="text-lg font-bold">Chi tiết phân bổ</h2><span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-1">{stateLabel || (draft ? "Dự kiến" : "Đã ghi nhận")}</span></div>
    {!value ? <p className="text-sm text-gray-500">Nhập đủ tài chính để xem kết quả.</p> : <div className="space-y-3 text-sm">
      {[["Giá trị trước VAT", value.beforeVat, "beforeVat"], ["Tiền VAT", value.vatAmount, "vatAmount"], ["Chênh lệch hoa hồng", value.commissionAmount, "commissionAmount"], ["Tiền chuyển khách", value.customerTransfer, "customerTransfer"], ["Tổng giá vốn", value.totalCost, "cost"], ["Phí hóa đơn", value.invoiceFee, "fee"]].map(([label, amount, key]) => <div key={key} className="flex justify-between gap-3"><span className="text-gray-500">{label}</span><strong className="text-right tabular-nums" data-cy={`dmsg-result-${key}`}>{formatCurrency(Number(amount))}</strong></div>)}
      <div className="border-t pt-3 flex justify-between gap-3"><span className="font-medium">Doanh thu ĐMSG</span><strong className="text-blue-600 text-right" data-cy="dmsg-result-revenue">{formatCurrency(value.revenue)}</strong></div>
      <div className={`rounded-xl p-3 ${value.profit < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}><div className="flex justify-between gap-3"><span className="font-medium">Lợi nhuận</span><strong className="text-lg text-right" data-cy="dmsg-result-profit">{formatCurrency(value.profit)}</strong></div>
        <p className="text-xs mt-1">Đã trừ vốn và phí hóa đơn đúng một lần.</p></div>
      {value.profit < 0 && <p role="alert" className="text-red-600">Đơn đang lỗ. Kiểm tra tài chính trước khi xác nhận.</p>}
    </div>}
  </AppCard>;
}
