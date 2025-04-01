import { IonRefresher, IonRefresherContent, RefresherEventDetail } from "@ionic/react";
import { chevronDownCircleOutline } from "ionicons/icons";
import { FC } from "react";

type Props = {
  onRefresh: (event: CustomEvent<RefresherEventDetail>) => void;
};

export const Refresher: FC<Props> = ({ onRefresh }) => {
  return (
    <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
      <IonRefresherContent
        pullingIcon={chevronDownCircleOutline}
        pullingText="Kéo xuống để tải lại..."
        refreshingSpinner="circles"
        refreshingText="Đang tải lại..."
      ></IonRefresherContent>
    </IonRefresher>
  );
};
