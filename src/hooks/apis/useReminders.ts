import { useCallback } from "react";
import { request } from "@/helpers/axios";
import type { IHttpResponse } from "@/types";
export interface ReminderRow { id: string; code: string; status: string; referenceType: string; }
export default function useReminders() {
  return useCallback(async (search: string, page: number) => {
    const query = new URLSearchParams(search); query.set("page", String(page));
    const response: IHttpResponse<ReminderRow[]> = await request.get("/notifications/reminders?" + query);
    if (!response.success) throw new Error(response.message || "Không tải được nhắc việc");
    return response.data || [];
  }, []);
}
