import { useCallback, useEffect, useState } from "react";
import { Toast } from "@capacitor/toast";

import useCamera from "@/hooks/useCamera";
import { useStorage } from "@/hooks";

const AVATAR_KEY_PREFIX = "account_avatar:";

const useAccountAvatar = (userId?: string) => {
  const { getItem, addItem } = useStorage();
  const { selectFromGallery, isLoading: isSelecting } = useCamera();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }

    let isActive = true;

    getItem(`${AVATAR_KEY_PREFIX}${userId}`).then((stored) => {
      if (isActive) {
        setAvatarUrl(typeof stored === "string" ? stored : null);
      }
    });

    return () => {
      isActive = false;
    };
    // getItem is recreated by useStorage on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pickAvatar = useCallback(async () => {
    if (!userId) {
      return;
    }

    const photo = await selectFromGallery({
      quality: 80,
      width: 512,
      height: 512,
    });
    const nextAvatar = photo?.dataUrl || photo?.webPath;

    if (!nextAvatar) {
      return;
    }

    await addItem(`${AVATAR_KEY_PREFIX}${userId}`, nextAvatar);
    setAvatarUrl(nextAvatar);
    await Toast.show({
      text: "Đã cập nhật ảnh đại diện",
      duration: "short",
      position: "bottom",
    });
  }, [addItem, selectFromGallery, userId]);

  return { avatarUrl, isSelecting, pickAvatar };
};

export default useAccountAvatar;
