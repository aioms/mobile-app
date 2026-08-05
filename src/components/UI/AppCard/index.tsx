import React from 'react';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  noPadding?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({ 
  children, 
  onClick, 
  className = '', 
  noPadding = false,
  ...rest 
}) => {
  return (
    <div
      className={`bg-white rounded-2xl ${noPadding ? '' : 'p-4'} mb-3 border border-gray-100 shadow-sm ${onClick ? 'active:bg-gray-50 transition-colors cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export default AppCard;
