import { IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { ComponentProps, FC, useId } from 'react';
import './style.css';

type Props = {
  value?: string | null;
  onChange?: (e: any) => void;
  presentation?: 'date' | 'time' | 'date-time' | 'time-date' | 'month-year' | 'year' | 'month';
  attrs: ComponentProps<typeof IonDatetime> & { id: string };
  extraClassName?: string;
  formatOptions?: any;
  emptyText?: string;
  emptyDateText?: string;
  emptyTimeText?: string;
  clearable?: boolean;
  onClear?: () => void;
  useCurrentDateAsDefault?: boolean;
}

const defaultFormatOptions = {
  date: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
};

const DatePicker: FC<Props> = ({
  value,
  onChange,
  presentation = 'date-time',
  attrs,
  extraClassName,
  formatOptions,
  emptyText = '',
  emptyDateText,
  emptyTimeText,
  clearable = true,
  onClear,
  useCurrentDateAsDefault = false,
}) =>  {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hasValue = Boolean(value);
  const {
    id,
    disabled,
    cancelText,
    clearText,
    doneText,
    showClearButton,
    showDefaultButtons,
    ...datetimeAttrs
  } = attrs;
  const datetimeId = `${id}-${instanceId}`;
  const todayIso = new Date().toISOString();
  const datetimeValue = value || todayIso;
  const dateTargetText = emptyDateText || emptyText || 'Chọn ngày';
  const timeTargetText = emptyTimeText || emptyText || 'Chọn giờ';
  const showEmptyTargets = !hasValue && !useCurrentDateAsDefault;
  const shouldShowClearButton = showClearButton ?? clearable;
  const shouldShowDefaultButtons = showDefaultButtons ?? true;
  const mergedFormatOptions = {
    ...defaultFormatOptions,
    ...formatOptions,
    date: {
      ...defaultFormatOptions.date,
      ...formatOptions?.date,
    },
    time: {
      ...defaultFormatOptions.time,
      ...formatOptions?.time,
    },
  };
  const handleIonChange = (event: any) => {
    if (!event.detail.value) {
      onClear?.();
    }

    onChange?.(event);
  };

  const presentationStr = presentation as string;
  const hasDatePresentation = presentationStr !== 'time';
  const hasTimePresentation = presentationStr === 'time' || presentationStr.includes('time');

  return (
    <>
      <IonDatetimeButton className={extraClassName} datetime={datetimeId} disabled={disabled}>
        {showEmptyTargets && (
          <>
            {hasDatePresentation && (
              <span slot="date-target" className="date-picker-empty-target">
                {dateTargetText}
              </span>
            )}
            {hasTimePresentation && (
              <span slot="time-target" className="date-picker-empty-target">
                {timeTargetText}
              </span>
            )}
          </>
        )}
      </IonDatetimeButton>

      <IonModal keepContentsMounted={true} className="date-picker-modal ion-datetime-button-overlay">
        <IonDatetime
          {...datetimeAttrs}
          id={datetimeId}
          presentation={presentation}
          value={datetimeValue}
          onIonChange={handleIonChange}
          formatOptions={mergedFormatOptions}
          disabled={disabled}
          clearText={clearText || "Xóa"}
          cancelText={cancelText || "Hủy"}
          doneText={doneText || "OK"}
          {...(shouldShowClearButton ? { showClearButton: true } : {})}
          {...(shouldShowDefaultButtons ? { showDefaultButtons: true } : {})}
        />
      </IonModal>
    </>
  );
}
export default DatePicker;
