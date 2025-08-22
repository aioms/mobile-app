import { createRoot } from "react-dom/client";
import { CustomToastOptions, UseCustomToastReturn } from "@/types/customToast";
import CustomToast from "@/components/Toast/CustomToast";

export const useCustomToast = (): UseCustomToastReturn => {
  const showToast = async (options: CustomToastOptions): Promise<void> => {
    return new Promise((resolve) => {
      const {
        message,
        type = "success",
        duration = 3000,
        position = "top",
        showIcon = true,
        dismissible = true,
        className = "",
      } = options;

      // Create container
      const toastContainer = document.createElement("div");
      toastContainer.className = "custom-toast-container";
      document.body.appendChild(toastContainer);

      // Create root and render toast
      const root = createRoot(toastContainer);

      const handleDismiss = () => {
        setTimeout(() => {
          root.unmount();
          if (toastContainer.parentNode) {
            toastContainer.parentNode.removeChild(toastContainer);
          }
          resolve();
        }, 300);
      };

      root.render(
        <CustomToast
          message={message}
          type={type}
          duration={duration}
          position={position}
          showIcon={showIcon}
          dismissible={dismissible}
          className={className}
          onDismiss={handleDismiss}
        />
      );
    });
  };

  const showSuccess = async (
    message: string,
    duration = 3000
  ): Promise<void> => {
    return showToast({ message, type: "success", duration });
  };

  const showError = async (message: string, duration = 4000): Promise<void> => {
    return showToast({ message, type: "error", duration });
  };

  const showWarning = async (
    message: string,
    duration = 3500
  ): Promise<void> => {
    return showToast({ message, type: "warning", duration });
  };

  const showInfo = async (message: string, duration = 3000): Promise<void> => {
    return showToast({ message, type: "info", duration });
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
