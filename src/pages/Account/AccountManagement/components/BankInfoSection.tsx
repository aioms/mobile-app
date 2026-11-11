import React from "react";
import { IonIcon } from "@ionic/react";
import { cardOutline, createOutline, keyOutline, personOutline } from "ionicons/icons";

import { AppButton, AppCard, AppListItem } from "@/components/UI";
import type { AccountProfile } from "../types";
import InfoRow from "./InfoRow";

interface BankInfoSectionProps {
  account: AccountProfile;
  onEdit: () => void;
}

const BANK_NAMES: Record<string, string> = {
  "970436": "Vietcombank",
  "970422": "MB Bank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970407": "Techcombank",
  "970416": "ACB",
  "970432": "VPBank",
  "970423": "TPBank",
  "970441": "VIB",
  "970443": "SHB",
  "970448": "OCB",
  "970403": "Sacombank",
  "970426": "MSB",
  "970437": "HDBank",
  "970431": "Eximbank",
  "970440": "SeABank",
  "970425": "ABBank",
  "970449": "LPBank",
  VCB: "Vietcombank",
  MB: "MB Bank",
  ICB: "VietinBank",
  BIDV: "BIDV",
  VBA: "Agribank",
  TCB: "Techcombank",
  ACB: "ACB",
  VPB: "VPBank",
  TPB: "TPBank",
  VIB: "VIB",
  SHB: "SHB",
  OCB: "OCB",
  STB: "Sacombank",
  HDB: "HDBank",
  EIB: "Eximbank",
  MSB: "MSB",
  LPB: "LPBank",
  SEA: "SeABank",
};

const getBankLabel = (bankCode: string): string => {
  if (!bankCode) {
    return "";
  }

  const normalizedCode = bankCode.trim().toUpperCase();
  const bankName = BANK_NAMES[normalizedCode];

  return bankName ? `${bankName} (${normalizedCode})` : normalizedCode;
};

const BankInfoSection: React.FC<BankInfoSectionProps> = ({
  account,
  onEdit,
}) => {
  return (
    <AppCard noPadding>
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h3 className="font-semibold text-gray-900">Thông tin ngân hàng</h3>
        <AppButton
          variant="clear"
          size="small"
          icon={<IonIcon icon={createOutline} className="text-base" />}
          onClick={onEdit}
        >
          Chỉnh sửa
        </AppButton>
      </div>

      <AppListItem showChevron={false}>
        <InfoRow
          icon={cardOutline}
          label="Ngân hàng"
          value={getBankLabel(account.bankCode)}
        />
      </AppListItem>
      <AppListItem showChevron={false}>
        <InfoRow
          icon={keyOutline}
          label="Số tài khoản"
          value={account.bankAccountNumber}
        />
      </AppListItem>
      <AppListItem showChevron={false}>
        <InfoRow
          icon={personOutline}
          label="Tên chủ tài khoản"
          value={account.bankAccountName}
        />
      </AppListItem>
    </AppCard>
  );
};

export default BankInfoSection;
