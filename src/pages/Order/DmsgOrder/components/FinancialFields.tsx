import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { AppCard } from "@/components/UI";
import type { DmsgInput } from "@/types/dmsg.type";

export interface DmsgForm extends DmsgInput { note: string; }
interface Props { control: Control<DmsgForm>; errors: FieldErrors<DmsgForm>; disabled: boolean; requireCompletionFields: boolean; }
const fields = [
  ["totalCost", "Tổng giá vốn (chưa VAT)", false],
  ["invoiceTotal", "Tổng hóa đơn (gồm VAT)", false],
  ["vatRate", "Thuế VAT", true],
  ["commissionRate", "Hoa hồng", true],
  ["invoiceFee", "Phí hóa đơn", false],
] as const;

export default function FinancialFields({ control, errors, disabled, requireCompletionFields }: Props) {
  return <AppCard>
    <h2 className="text-lg font-bold mb-1">Tài chính đơn gộp</h2>
    <p className="text-xs text-gray-500 mb-4">Giá vốn nhập tay là tổng vốn cuối cùng, chưa VAT.</p>
    <div className="grid grid-cols-2 gap-3">
      {fields.map(([name, label, rate]) => {
        const required = name === "totalCost" || (requireCompletionFields && name !== "invoiceFee");
        return <label key={name} className={rate ? "block" : "block col-span-2"}>
        <span className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</span>
        <Controller name={name} control={control} rules={{ required: name !== "invoiceFee" ? "Vui lòng nhập giá trị" : false, min: { value: 0, message: "Không được âm" }, validate: (v) => {
          if (v === undefined || Number.isNaN(v)) return name === "invoiceFee" ? true : "Vui lòng nhập giá trị";
          if (!Number.isFinite(v)) return rate ? "Từ 0–100%, tối đa 2 số lẻ" : "Nhập số nguyên VND hợp lệ";
          return (rate ? v <= 100 && Math.abs(v * 100 - Math.round(v * 100)) < 0.000001 : Number.isSafeInteger(v)) || (rate ? "Từ 0–100%, tối đa 2 số lẻ" : "Nhập số nguyên VND hợp lệ");
        } }} render={({ field }) => <div className="flex items-center border border-gray-200 rounded-xl mt-1 bg-gray-50 focus-within:border-blue-500">
          <input {...field} value={Number.isFinite(field.value) ? rate ? field.value : field.value.toLocaleString("vi-VN") : ""}
            onChange={(event) => { const raw = rate ? event.target.value : event.target.value.replace(/\D/g, ""); field.onChange(raw === "" ? Number.NaN : Number(raw)); }}
            inputMode={rate ? "decimal" : "numeric"} type={rate ? "number" : "text"} step={rate ? "0.01" : undefined}
            disabled={disabled} data-cy={`dmsg-${name}`} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}
            className="w-full min-w-0 h-12 bg-transparent px-3 text-right font-semibold outline-none rounded-xl" placeholder="Nhập giá trị" />
          <span className="text-xs text-gray-500 pr-3">{rate ? "%" : "đ"}</span>
        </div>} />
        {errors[name] && <span id={`${name}-error`} role="alert" className="text-xs text-red-600">{errors[name]?.message}</span>}
      </label>;
      })}
    </div>
    <p className="text-xs text-gray-500 mt-3">VAT 8% → chia 1,08. Hoa hồng 10% → chia tiếp 1,10.</p>
  </AppCard>;
}
