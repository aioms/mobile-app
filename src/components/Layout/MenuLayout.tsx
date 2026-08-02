import {
  IonHeader,
  IonPage,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
} from "@ionic/react";

type Props = {
  component: React.ReactNode;
  title?: string;
  isHeaderDefault?: boolean;
};

const MenuLayout: React.FC<Props> = ({ component, title, isHeaderDefault }) => {
  return (
    <IonPage id="main-content">
      {isHeaderDefault && (
        <IonHeader translucent>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>{title}</IonTitle>
          </IonToolbar>
        </IonHeader>
      )}

      {component}
    </IonPage>
  );
};

export default MenuLayout;
