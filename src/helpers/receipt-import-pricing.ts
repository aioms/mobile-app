import { DiscountType } from "@/common/enums";

export function isValidImportDiscount(discount: number, cost: number, type?: DiscountType): boolean {
  return Number.isFinite(discount) && discount >= 0 && (type === DiscountType.FIXED
    ? Number.isSafeInteger(discount) && discount <= cost
    : discount <= 100 && Math.abs(discount * 1000 - Math.round(discount * 1000)) <= 1e-8);
}
