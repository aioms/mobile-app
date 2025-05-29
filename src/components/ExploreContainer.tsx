import {
  IonFab,
  IonFabButton,
  IonIcon,
  useIonViewDidEnter,
  useIonViewDidLeave,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { logOut } from "ionicons/icons";

import "./ExploreContainer.css";
import { useStorage } from "../hooks/useStorage";
import { stringifySafe } from "../helpers/common";
import { useAuth } from "../hooks";

interface ContainerProps {}

const ExploreContainer: React.FC<ContainerProps> = () => {
  const { isAuthenticated, user } = useAuth();
  const { storage } = useStorage();
  const history = useHistory();

  useIonViewDidEnter(() => {
    console.log('ionViewDidEnter event fired');
  });

  useIonViewDidLeave(() => {
    console.log('ionViewDidLeave event fired');
  });

  useIonViewWillEnter(() => {
    console.log('ionViewWillEnter event fired');
  });

  useIonViewWillLeave(() => {
    console.log('ionViewWillLeave event fired');
  });

  const handleLogout = async () => {
    await storage?.clear();
    history.push('/login');
  }

  return (
    <div id="container">
      <strong>{stringifySafe(user)}</strong>
      <p>
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://ionicframework.com/docs/components"
        >
          UI Components
        </a>
      </p>
      <p>
        <IonFab horizontal="center">
          <IonFabButton className="fab-center" onClick={handleLogout}>
            <IonIcon icon={logOut} />
          </IonFabButton>
        </IonFab>
      </p>
    </div>
  );
};

export default ExploreContainer;
