import React from 'react';
import { IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';

interface AppFABProps {
  onClick: () => void;
  icon?: string;
  color?: string;
  "data-cy"?: string;
}

const AppFAB: React.FC<AppFABProps> = ({ 
  onClick, 
  icon = addOutline,
  color = 'primary',
  'data-cy': dataCy,
}) => {
  return (
    <IonFab vertical="bottom" horizontal="end" slot="fixed" className="mb-4 mr-4">
      <IonFabButton color={color} onClick={onClick} data-cy={dataCy}>
        <IonIcon icon={icon} />
      </IonFabButton>
    </IonFab>
  );
};

export default AppFAB;
