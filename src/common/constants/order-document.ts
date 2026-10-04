export type DocumentKind = "quotation" | "invoice";
export type LegalEntity = "kim-sang" | "ngan-kim";
export type OrderExportFormat = "pdf" | "excel" | "image";
export interface EntityHeader {
  name: string;
  address: string;
  phone: string;
  bank: string;
  taxCode?: string;
  logo: string;
}
export const ORDER_ENTITIES: Record<LegalEntity, EntityHeader> = {
  "kim-sang": {
    name: "Cửa hàng Kim Sang",
    address: "DS02 - Đối diện 65 Yersin. P. Bến Thành, TP.HCM.",
    phone: "0385866721 - 0912440342",
    bank: "VCB - 1901781613",
    logo: "/order-documents/kimsang_logo.png",
  },
  "ngan-kim": {
    name: "Công ty TNHH TM Ngân Kim",
    address: "113, Đường số 10, KDC Nam Long, Phường Tân Thuận, TP.HCM",
    phone: "0385866721",
    bank: "Sacombank - 060077546777",
    taxCode: "0305974197",
    logo: "/order-documents/ngankim_logo.png",
  },
};
