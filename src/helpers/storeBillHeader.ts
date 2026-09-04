/**
 * Store header info for receipt bill export.
 * Address is hardcoded because the DB `stores` table has no address column.
 */

interface StoreBillHeader {
  name: string;
  address: string;
}

const STORE_HEADERS: Record<string, StoreBillHeader> = {
  KS: {
    name: "CỬA HÀNG KIM SANG",
    address: "DS-02 - 104 Yersin, Phường Bến Thành, TPHCM",
  },
  KH: {
    name: "CỬA HÀNG KIM HẬU",
    address: "",
  },
};

const DEFAULT_HEADER: StoreBillHeader = {
  name: "CỬA HÀNG",
  address: "",
};

export const getStoreBillHeader = (storeCode: string): StoreBillHeader => {
  return STORE_HEADERS[storeCode] || DEFAULT_HEADER;
};
