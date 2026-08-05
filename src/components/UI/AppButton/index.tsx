import React from 'react';
import { IonSpinner } from '@ionic/react';

export type ButtonVariant = 'pill' | 'primary' | 'secondary' | 'outline' | 'clear';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'pill',
  size = 'medium',
  loading = false,
  loadingText,
  fullWidth = false,
  icon,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...rest
}) => {
  // Base styling for interactive button
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none';

  // Variant styling
  const variantStyles: Record<ButtonVariant, string> = {
    pill: 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs hover:bg-blue-100/90 active:scale-[0.98] rounded-full',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-xs',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 active:scale-[0.98] rounded-xl',
    outline: 'bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50/50 active:scale-[0.98] rounded-xl',
    clear: 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50/30 active:scale-[0.98] rounded-lg',
  };

  // Size styling
  const sizeStyles: Record<ButtonSize, string> = {
    small: 'px-3 py-1.5 text-xs gap-1.5',
    medium: 'px-5 py-2.5 text-sm gap-2',
    large: 'px-6 py-3 text-base gap-2.5',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <IonSpinner name="crescent" className="w-4 h-4 text-current" />
          <span>{loadingText || children || 'Đang tải...'}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default AppButton;
