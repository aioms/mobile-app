export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface CustomToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  showIcon?: boolean;
  dismissible?: boolean;
  className?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  timestamp: number;
}

export interface CustomToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  showIcon?: boolean;
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export interface UseCustomToastReturn {
  showToast: (options: CustomToastOptions) => Promise<void>;
  showSuccess: (message: string, duration?: number) => Promise<void>;
  showError: (message: string, duration?: number) => Promise<void>;
  showWarning: (message: string, duration?: number) => Promise<void>;
  showInfo: (message: string, duration?: number) => Promise<void>;
}