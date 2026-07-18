import React from "react";
import { useAppUpdate } from "@/pwa";
import "./AppUpdatePrompt.css";

const AppUpdatePrompt: React.FC = () => {
  const {
    applyUpdate,
    dismissUpdate,
    error,
    shouldNotify,
    status,
  } = useAppUpdate();

  if (!shouldNotify) return null;

  const isUpdating = status === "updating";

  return (
    <aside
      className="app-update-prompt"
      role="status"
      aria-live="polite"
      aria-busy={isUpdating}
    >
      <div className="app-update-prompt__content">
        <strong>Có phiên bản mới</strong>
        <p>
          {error
            ? "Chưa thể cập nhật. Vui lòng kiểm tra kết nối và thử lại."
            : isUpdating
              ? "Đang tải bản cập nhật…"
              : "Cập nhật khi bạn sẵn sàng. Công việc hiện tại sẽ không bị gián đoạn."}
        </p>
      </div>
      <div className="app-update-prompt__actions">
        {!isUpdating && (
          <button
            type="button"
            className="app-update-prompt__button app-update-prompt__button--later"
            onClick={dismissUpdate}
          >
            Để sau
          </button>
        )}
        <button
          type="button"
          className="app-update-prompt__button app-update-prompt__button--update"
          disabled={isUpdating}
          onClick={() => void applyUpdate()}
        >
          {isUpdating ? "Đang cập nhật" : error ? "Thử lại" : "Cập nhật"}
        </button>
      </div>
    </aside>
  );
};

export default AppUpdatePrompt;
