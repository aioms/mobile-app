import React from 'react';
import { IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';

interface AppFABProps {
  onClick: () => void;
  icon?: string;
  color?: string;
}

const AppFAB: React.FC<AppFABProps> = ({ 
  onClick, 
  icon = addOutline,
  color = 'primary'
}) => {
  return (
    <IonFab vertical="bottom" horizontal="end" slot="fixed" className="mb-4 mr-4">
      <IonFabButton color={color} onClick={onClick}>
        <IonIcon icon={icon} />
      </IonFabButton>
    </IonFab>
  );
};

export default AppFAB;
