import React, { useEffect, useState } from "react";
import useCashbook from "@/hooks/apis/useCashbook";
import { formatCurrency } from "@/helpers/formatters";

type Source = { name: string; amount: number };
interface Props {
  date: string;
  sources: Source[];
  disabled?: boolean;
  onSaved: () => Promise<void>;
}

export default function CashSourcesEditor({ date, sources, disabled, onSaved }: Props) {
  const { updateCashForDay } = useCashbook();
  const [rows, setRows] = useState<Source[]>(sources);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setRows(sources); setError(""); }, [date, sources]);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const save = async () => {
    if (rows.some((row) => !row.name.trim() || !Number.isSafeInteger(row.amount) || row.amount < 0) || !Number.isSafeInteger(total)) {
      setError("Nhập tên nguồn và số tiền VND nguyên, không âm.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateCashForDay({ date, cashForDay: total, cashSources: rows });
      await onSaved();
    } catch (cause) {
      console.error("Save daily cash sources failed", cause);
      setError(cause instanceof Error ? cause.message : "Không thể lưu nguồn tiền. Hãy thử lại.");
    } finally { setSaving(false); }
  };
  const locked = disabled || saving;
  return <div className="space-y-3">
    {rows.length === 0 && <p className="text-sm text-slate-500">Chưa có nguồn tiền. Thêm nguồn để ghi nhận tiền mặt ngày.</p>}
    {rows.map((row, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3">
      <label className="block text-sm">Tên nguồn tiền
        <input className="w-full min-h-11 rounded-lg border p-2" maxLength={120} value={row.name} disabled={locked}
          onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
      </label>
      <label className="block text-sm">Số tiền (VND)
        <input type="number" min="0" step="1" className="w-full min-h-11 rounded-lg border p-2" value={row.amount} disabled={locked}
          onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, amount: event.target.value === "" ? 0 : Number(event.target.value) } : item))} />
      </label>
      <button type="button" className="min-h-11 text-red-600" disabled={locked} onClick={() => {
        if (window.confirm("Xóa nguồn tiền này khỏi danh sách? Bấm Lưu để áp dụng.")) setRows(rows.filter((_, i) => i !== index));
      }}>Xóa nguồn</button>
    </div>)}
    <p className="font-semibold">Tổng: {formatCurrency(total)}</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" className="min-h-11 rounded-lg border px-4" disabled={locked || rows.length >= 100} onClick={() => setRows([...rows, { name: "", amount: 0 }])}>Thêm nguồn</button>
      <button type="button" className="min-h-11 rounded-lg bg-blue-600 px-4 text-white" disabled={locked} onClick={save}>{saving ? "Đang lưu..." : "Lưu nguồn tiền"}</button>
    </div>
  </div>;
}
