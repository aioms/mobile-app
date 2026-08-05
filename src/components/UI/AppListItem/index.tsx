import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';

interface AppListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showChevron?: boolean;
}

const AppListItem: React.FC<AppListItemProps> = ({ 
  children, 
  onClick, 
  className = '', 
  showChevron = true,
  ...rest 
}) => {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 bg-white active:bg-gray-50 border-b border-gray-100 last:border-b-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      <div className="flex items-center w-full pr-4">
        {children}
      </div>
      {showChevron && (
        <IonIcon icon={chevronForwardOutline} className="text-gray-300 flex-shrink-0 text-lg" />
      )}
    </div>
  );
};

export default AppListItem;
