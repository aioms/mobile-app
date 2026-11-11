import { UserRole } from "@/common/enums/user";
import type { User } from "@/types";

import type { AccountProfile, ProfileFormValues } from "./types";

const isUserRole = (value: unknown): value is UserRole =>
  Object.values(UserRole).includes(value as UserRole);

/** Normalize the auth/user-detail payload into the shape the screen renders. */
export const toAccountProfile = (
  data: Partial<User> | null | undefined,
): AccountProfile | null => {
  if (!data?.id) {
    return null;
  }

  return {
    id: data.id,
    code: data.code ?? "",
    username: data.username ?? "",
    fullname: data.fullname ?? "",
    phone: data.phone ?? "",
    role: isUserRole(data.role) ? data.role : UserRole.EMPLOYEE,
    storeCode: data.storeCode ?? "",
    bankCode: data.bankCode ?? "",
    bankAccountNumber: data.bankAccountNumber ?? "",
    bankAccountName: data.bankAccountName ?? "",
  };
};

/** Bank details are only managed by admins/developers. */
export const canManageBankInfo = (account: AccountProfile | null): boolean =>
  account?.role === UserRole.ADMIN || account?.role === UserRole.DEVELOPER;

/** Bank details can only be edited once the account is assigned to a store. */
export const canEditBankInfo = (account: AccountProfile | null): boolean =>
  canManageBankInfo(account) && !!account?.storeCode;

export const toProfileFormValues = (
  account: AccountProfile | null,
): ProfileFormValues => ({
  fullname: account?.fullname ?? "",
  phone: account?.phone ?? "",
  username: account?.username ?? "",
  storeCode: account?.storeCode ?? "",
  bankCode: account?.bankCode ?? "",
  bankAccountNumber: account?.bankAccountNumber ?? "",
  bankAccountName: account?.bankAccountName ?? "",
});
