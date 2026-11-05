import React, { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import { createOutline } from "ionicons/icons";
import useCashbook from "@/hooks/apis/useCashbook";
import { formatCurrency, formatCurrencyWithoutSymbol } from "@/helpers/formatters";

type Source = { name: string; amount: number };

interface Props {
  date: string;
  sources: Source[];
  disabled?: boolean;
  isEditing?: boolean;
  onToggleEdit?: (editing: boolean) => void;
  onSaved: () => Promise<void>;
}

export default function CashSourcesEditor({
  date,
  sources,
  disabled,
  isEditing: propIsEditing,
  onToggleEdit,
  onSaved,
}: Props) {
  const { updateCashForDay } = useCashbook();
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = propIsEditing !== undefined ? propIsEditing : internalIsEditing;

  const setIsEditing = (val: boolean) => {
    setInternalIsEditing(val);
    onToggleEdit?.(val);
  };

  const [rows, setRows] = useState<Source[]>(sources);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRows(sources);
    setError("");
  }, [date, sources]);

  // When entering edit mode with no rows, provide an empty first row to fill in
  useEffect(() => {
    if (isEditing && rows.length === 0) {
      setRows([{ name: "", amount: 0 }]);
    }
  }, [isEditing, rows.length]);

  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const sourcesTotal = sources.reduce((sum, s) => sum + s.amount, 0);

  const save = async () => {
    const trimmedRows = rows.map((row) => ({
      ...row,
      name: row.name.trim(),
    }));

    if (
      trimmedRows.some(
        (row) => !row.name || !Number.isSafeInteger(row.amount) || row.amount < 0
      ) ||
      !Number.isSafeInteger(total)
    ) {
      setError("Nhập tên nguồn và số tiền VND nguyên, không âm.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await updateCashForDay({ date, cashForDay: total, cashSources: trimmedRows });
      await onSaved();
      setIsEditing(false);
    } catch (cause) {
      console.error("Save daily cash sources failed", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể lưu nguồn tiền. Hãy thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const locked = disabled || saving;

  // VIEW MODE: Compact list display matching the Chi phí (Expense) list
  if (!isEditing) {
    if (sources.length === 0) {
      return (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-400">
          <span>Chưa có nguồn tiền trong ngày.</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setRows([{ name: "", amount: 0 }]);
              setIsEditing(true);
            }}
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 active:opacity-80"
          >
            <IonIcon icon={createOutline} className="text-base" />
            <span>Thêm nguồn</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2 text-sm text-slate-600">
        {sources.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-0.5">
            <span className="text-slate-700">{item.name}</span>
            <span className="font-semibold text-slate-900">
              {formatCurrencyWithoutSymbol(item.amount)}
            </span>
          </div>
        ))}
        {sources.length > 1 && (
          <div className="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              Tổng tiền mặt ngày
            </span>
            <span className="font-bold text-slate-900">
              {formatCurrencyWithoutSymbol(sourcesTotal)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-slate-500">
          Chưa có nguồn tiền. Thêm nguồn để ghi nhận tiền mặt ngày.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={index}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tên nguồn tiền
            </label>
            <input
              type="text"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
              style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
              maxLength={120}
              placeholder="VD: Cô 2, Tiền mang về..."
              value={row.name}
              disabled={locked}
              onChange={(event) =>
                setRows(
                  rows.map((item, i) =>
                    i === index ? { ...item, name: event.target.value } : item
                  )
                )
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Số tiền (VND)
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
              style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
              placeholder="0"
              value={row.amount > 0 ? formatCurrencyWithoutSymbol(row.amount) : ""}
              disabled={locked}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, "");
                const parsed = digitsOnly
                  ? Math.min(parseInt(digitsOnly, 10), Number.MAX_SAFE_INTEGER)
                  : 0;
                setRows(
                  rows.map((item, i) =>
                    i === index ? { ...item, amount: parsed } : item
                  )
                );
              }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              className="min-h-11 px-2 text-xs font-semibold text-red-600 hover:text-red-700 active:opacity-80 transition"
              disabled={locked}
              onClick={() => {
                if (
                  window.confirm(
                    "Xóa nguồn tiền này khỏi danh sách? Bấm Lưu để áp dụng."
                  )
                ) {
                  setRows(rows.filter((_, i) => i !== index));
                }
              }}
            >
              Xóa nguồn
            </button>
          </div>
        </div>
      ))}

      <p className="font-semibold text-slate-900">
        Tổng: {formatCurrency(total)}
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: "#ffffff", color: "#334155" }}
          disabled={locked || rows.length >= 100}
          onClick={() => setRows([...rows, { name: "", amount: 0 }])}
        >
          Thêm nguồn
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
          disabled={locked}
          onClick={save}
        >
          {saving ? "Đang lưu..." : "Lưu nguồn tiền"}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: "#ffffff" }}
          disabled={locked}
          onClick={() => {
            setRows(sources);
            setError("");
            setIsEditing(false);
          }}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
