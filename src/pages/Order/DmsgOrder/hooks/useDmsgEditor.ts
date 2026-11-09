import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useHistory } from "react-router";
import { useLoading } from "@/hooks";
import useOrder from "@/hooks/apis/useOrder";
import useDmsgOrder, { type DmsgMutation } from "@/hooks/apis/useDmsgOrder";
import { calculateDmsgFinancials } from "@/helpers/dmsgFinancials";
import type { IOrder, IOrderItem } from "@/types/order.type";
import type { DmsgForm } from "../components/FinancialFields";

export default function useDmsgEditor(id?: string) {
  const history = useHistory();
  const { getDetail } = useOrder();
  const { save } = useDmsgOrder();
  const { isLoading, withLoading } = useLoading();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [items, setItems] = useState<IOrderItem[]>([]);
  const [customerName, setCustomerName] = useState("Khách lẻ");
  const [customer, setCustomer] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(!id);
  const submitting = useRef(false);
  const pending = useRef<{ fingerprint: string; requestId: string }>();
  const form = useForm<DmsgForm>({ defaultValues: { vatRate: 8, commissionRate: 10, invoiceFee: 0, note: "" } });
  const values = useWatch({ control: form.control });
  const financials = useMemo(() => {
    try {
      const input = values as DmsgForm;
      return calculateDmsgFinancials({ ...input, invoiceFee: Number.isFinite(input.invoiceFee) ? input.invoiceFee : 0 });
    } catch { return null; }
  }, [values]);
  const cancelled = order?.status === "cancelled";
  const completed = order?.status === "completed";

  async function load() {
    if (!id) return;
    setError("");
    await withLoading(async () => {
      try {
        const result = await getDetail(id);
        if (!result.dmsg) throw new Error("Đây không phải đơn ĐMSG");
        setOrder(result); setItems(result.items); setCustomer(result.customer?.id || null); setCustomerName(result.customer?.name || "Khách lẻ");
        const { enteredFields, ...savedFinancials } = result.dmsg;
        const formValues: DmsgForm = { ...savedFinancials, note: result.note || "" };
        if (enteredFields) {
          for (const field of ["invoiceTotal", "vatRate", "commissionRate", "invoiceFee"] as const) {
            if (!enteredFields.includes(field)) formValues[field] = Number.NaN;
          }
        }
        form.reset(formValues); setLoaded(true);
      } catch (cause) { setError((cause as Error).message); throw cause; }
    });
  }
  useEffect(() => { void load(); }, [id]);

  async function persist(status: "draft" | "completed" | "cancelled", receipts?: DmsgMutation["receipts"]) {
    if (submitting.current) return;
    const requiredFields = status === "draft"
      ? ["totalCost" as const]
      : status === "completed"
      ? ["totalCost", "invoiceTotal", "vatRate", "commissionRate"] as const
      : [];
    if (status !== "cancelled" && !(await form.trigger([...requiredFields]))) return;
    if (status !== "cancelled" && !items.length) { setError("Chọn ít nhất một sản phẩm để xuất kho"); return; }
    const current = form.getValues();
    const body: Omit<DmsgMutation, "requestId"> = status === "cancelled"
      ? { status, revision: order?.revision }
      : {
        orderType: "dmsg_bulk", status, revision: order?.revision, receipts,
        ...(!order && { customer }), note: current.note,
        dmsg: {
          totalCost: current.totalCost,
          ...(Number.isFinite(current.invoiceTotal) && { invoiceTotal: current.invoiceTotal }),
          ...(Number.isFinite(current.vatRate) && { vatRate: current.vatRate }),
          ...(Number.isFinite(current.commissionRate) && { commissionRate: current.commissionRate }),
          ...(Number.isFinite(current.invoiceFee) && { invoiceFee: current.invoiceFee }),
        },
        ...(!completed && { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) }),
      };
    const fingerprint = JSON.stringify(body);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, requestId: crypto.randomUUID() };
    const requestId = pending.current.requestId;
    submitting.current = true; setError("");
    await withLoading(async () => {
      try {
        const saved = await save({ ...body, requestId }, id);
        pending.current = undefined;
        if (!id) history.replace(`/tabs/orders/dmsg/detail/${saved.id}`);
        else await load();
      } catch (cause) { setError((cause as Error).message); throw cause; }
    });
    submitting.current = false;
  }
  function addProducts(products: Array<{ id?: string; productId?: string; productName: string; productCode?: string | number; code?: string; quantity?: number }>) {
    setItems((current) => {
      const merged = current.map((item) => ({ ...item }));
      for (const product of products) {
        const productId = product.productId || product.id;
        if (!productId) continue;
        const existing = merged.find((item) => item.productId === productId);
        if (existing) existing.quantity += product.quantity || 1;
        else merged.push({ productId, productName: product.productName, code: String(product.productCode || product.code || ""), quantity: product.quantity || 1, price: 0, vatRate: 0 });
      }
      return merged.map((item) => ({ ...item }));
    });
  }
  return { order, items, setItems, customer, setCustomer, customerName, setCustomerName, error, setError, loaded, isLoading, form, financials, cancelled, completed, load, persist, addProducts };
}
