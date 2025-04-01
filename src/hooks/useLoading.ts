import { useState, useCallback } from "react";

export const useLoading = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

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
