import { request } from "@/helpers/axios";
import type { IHttpResponse } from "@/types";
import type { IOrder } from "@/types/order.type";
import type { DmsgInput, DmsgSettlementKind, DmsgSummary } from "@/types/dmsg.type";

export interface DmsgMutation {
  attachments?: import("@/types/dmsg.type").DmsgAttachment[];
  orderType?: "dmsg_bulk"; requestId: string; revision?: number;
  dmsg?: Partial<DmsgInput> & Pick<DmsgInput, "totalCost">; items?: Array<{ productId: string; quantity: number }>;
  receipts?: Array<{ amount: number; paymentMethod: "cash" | "bank_transfer" }>;
  customer?: string | null; note?: string; status?: "draft" | "completed" | "cancelled";
}
export default function useDmsgOrder() {
  const save = async (body: DmsgMutation, id?: string) => {
    const response: IHttpResponse<IOrder> = id ? await request.put(`/orders/${id}`, body) : await request.post("/orders", body);
    if (!response.success || !response.data) throw new Error(response.message || "Không thể lưu đơn ĐMSG");
    return response.data;
  };
  const settle = async (id: string, body: { kind: DmsgSettlementKind; amount: number; paymentMethod: string; requestId: string; note?: string }) => {
    const response: IHttpResponse = await request.post(`/orders/${id}/dmsg-settlements`, body);
    if (!response.success) throw new Error(response.message || "Không thể ghi khoản thu/chi");
  };
  const report = async (startDate: string, endDate: string) => {
    const response: IHttpResponse<DmsgSummary> = await request.get(`/orders/dmsg-summary?${new URLSearchParams({ startDate, endDate })}`);
    if (!response.success || !response.data) throw new Error(response.message || "Không tải được báo cáo ĐMSG");
    return response.data;
  };
  const upload = async (file: File) => {
    const response: IHttpResponse<{ fileId: string; url: string }> = await request.post("/orders/dmsg-files/upload", { name: file.name, size: file.size, mimeType: file.type });
    if (!response.success || !response.data) throw new Error(response.message || "Không tạo được tệp");
    const sent = await fetch(response.data.url, { method: "PUT", body: file, headers: { "Content-Type": file.type, "x-amz-acl": "private" } });
    if (!sent.ok) throw new Error("Tải tệp thất bại. Chọn lại để thử lại.");
    return response.data.fileId;
  };
  const download = async (id: string, fileId: string) => {
    const response: IHttpResponse<{ url: string; name: string; mimeType: string; size: number }> = await request.get(`/orders/${id}/dmsg-files/${fileId}`);
    if (!response.success || !response.data) throw new Error(response.message || "Không tải được tệp");
    return response.data;
  };
  return { save, settle, report, upload, download };
}
