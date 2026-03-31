import { IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { FC, HTMLAttributes } from 'react';

type Props = {
  value?: string;
  onChange?: (e: any) => void;
  presentation?: 'date' | 'time' | 'date-time' | 'time-date' | 'month-year' | 'year' | 'month';
  attrs: HTMLAttributes<HTMLIonDatetimeElement> & { disabled?: boolean };
  extraClassName?: string;
  formatOptions?: any;
}

const defaultFormatOptions = {
  date: {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
};

const DatePicker: FC<Props> = ({ value, onChange, presentation = 'date-time', attrs, extraClassName, formatOptions }) =>  {
  return (
    <>
      <IonDatetimeButton className={extraClassName} datetime={attrs.id} disabled={attrs.disabled}></IonDatetimeButton>

      <IonModal keepContentsMounted={true} trigger={attrs.id}>
        <IonDatetime
          id={attrs.id}
          presentation={presentation}
          value={value || new Date().toISOString()}
          onIonChange={onChange}
          formatOptions={formatOptions || defaultFormatOptions}
          {...attrs}
        />
      </IonModal>
    </>
  );
}
export default DatePicker;