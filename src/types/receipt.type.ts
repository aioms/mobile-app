import { IProductItem } from "./product.type";

export type IReceiptItem = Omit<IProductItem, "id" | "createdAt">