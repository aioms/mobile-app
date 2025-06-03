import { useIonToast } from "@ionic/react";
import { useState, useCallback } from "react";

export const useLoading = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [presentToast] = useIonToast();

  const showLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async (callback: () => Promise<any>) => {
      try {
        showLoading();
        await callback();
      } catch (error) {
        await presentToast({
          message: (error as Error).message,
          duration: 2000,
          position: "top",
          color: "danger",
        });
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return {
    isLoading,
    showLoading,
    hideLoading,
    withLoading,
  };
};
