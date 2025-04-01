import { IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { FC, HTMLAttributes } from 'react';

type Props = {
  value?: string;
  onChange?: (e: any) => void;
  presentation?: 'date' | 'time' | 'date-time' | 'time-date' | 'month-year' | 'year' | 'month';
  attrs: HTMLAttributes<HTMLIonDatetimeElement>;
  extraClassName?: string;
}

const DatePicker: FC<Props> = ({ value, onChange, presentation = 'date-time', attrs, extraClassName }) =>  {
  return (
    <>
      <IonDatetimeButton className={extraClassName} datetime={attrs.id}></IonDatetimeButton>

      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id={attrs.id}
          presentation={presentation}
          value={value || new Date().toISOString()}
          onIonChange={onChange}
          formatOptions={{
            date: {
              weekday: 'short',
              month: 'long',
              day: '2-digit',
            },
            time: {
              hour: '2-digit',
              minute: '2-digit',
            },
          }}
          {...attrs}
        />
      </IonModal>
    </>
  );
}
export default DatePicker;