import React from "react";
import { IonIcon } from "@ionic/react";
import {
  atOutline,
  businessOutline,
  callOutline,
  createOutline,
  personOutline,
} from "ionicons/icons";

import { AppButton, AppCard, AppListItem } from "@/components/UI";
import type { AccountProfile } from "../types";
import InfoRow from "./InfoRow";

interface PersonalInfoSectionProps {
  account: AccountProfile;
  onEdit: () => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  account,
  onEdit,
}) => {
  return (
    <AppCard noPadding>
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h3 className="font-semibold text-gray-900">Thông tin cá nhân</h3>
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
        <InfoRow icon={personOutline} label="Họ và tên" value={account.fullname} />
      </AppListItem>
      <AppListItem showChevron={false}>
        <InfoRow icon={callOutline} label="Số điện thoại" value={account.phone} />
      </AppListItem>
      <AppListItem showChevron={false}>
        <InfoRow
          icon={atOutline}
          label="Tên đăng nhập (không thể thay đổi)"
          value={account.username}
        />
      </AppListItem>
      <AppListItem showChevron={false}>
        <InfoRow
          icon={businessOutline}
          label="Chi nhánh"
          value={account.storeCode}
        />
      </AppListItem>
    </AppCard>
  );
};

export default PersonalInfoSection;
