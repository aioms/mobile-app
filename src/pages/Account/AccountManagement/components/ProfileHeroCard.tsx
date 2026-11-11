import React from "react";
import { IonIcon, IonSpinner } from "@ionic/react";
import { cameraOutline, personOutline, storefrontOutline } from "ionicons/icons";

import { AppBadge, AppCard } from "@/components/UI";
import { UserRole } from "@/common/enums/user";
import type { AccountProfile } from "../types";

interface ProfileHeroCardProps {
  account: AccountProfile;
  avatarUrl: string | null;
  isSelectingAvatar: boolean;
  onChangeAvatar: () => void;
}

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: "primary" | "warning" | "medium" | "tertiary" }
> = {
  [UserRole.ADMIN]: { label: "Admin", color: "primary" },
  [UserRole.MANAGER]: { label: "Quản lý", color: "warning" },
  [UserRole.EMPLOYEE]: { label: "Nhân viên", color: "medium" },
  [UserRole.DEVELOPER]: { label: "Developer", color: "tertiary" },
};

const ProfileHeroCard: React.FC<ProfileHeroCardProps> = ({
  account,
  avatarUrl,
  isSelectingAvatar,
  onChangeAvatar,
}) => {
  const role = ROLE_CONFIG[account.role] ?? ROLE_CONFIG[UserRole.EMPLOYEE];

  return (
    <AppCard className="flex items-center gap-4">
      <div className="relative shrink-0">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Ảnh đại diện của ${account.fullname}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <IonIcon icon={personOutline} className="text-4xl text-blue-400" />
          )}
        </div>
        <button
          type="button"
          aria-label="Đổi ảnh đại diện"
          onClick={onChangeAvatar}
          disabled={isSelectingAvatar}
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-blue-600 shadow-sm active:bg-gray-50 disabled:opacity-60"
        >
          {isSelectingAvatar ? (
            <IonSpinner name="crescent" className="h-4 w-4" />
          ) : (
            <IonIcon icon={cameraOutline} className="text-base" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-bold text-gray-900">
          {account.fullname || "Người dùng"}
        </h2>
        <p className="truncate text-sm text-gray-500">@{account.username}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AppBadge color={role.color} variant="soft">
            {role.label}
          </AppBadge>
          <AppBadge color="light" variant="soft">
            <IonIcon icon={storefrontOutline} className="mr-1 text-xs" />
            {account.storeCode || "Chưa có chi nhánh"}
          </AppBadge>
        </div>
      </div>
    </AppCard>
  );
};

export default ProfileHeroCard;
