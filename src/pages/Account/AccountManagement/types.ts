import { UserRole } from "@/common/enums/user";

export interface AccountProfile {
  id: string;
  code: string;
  username: string;
  fullname: string;
  phone: string;
  role: UserRole;
  storeCode: string;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface ProfileFormValues {
  fullname: string;
  phone: string;
  username: string;
  storeCode: string;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
