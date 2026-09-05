import React, { ComponentProps, useMemo } from 'react';
import { IonDatetime } from '@ionic/react';
import dayjs from 'dayjs';
import './style.css';

type Props = {
  value?: string | null;
  onChange?: (e: any) => void;
  presentation?: 'date' | 'time' | 'date-time' | 'time-date' | 'month-year' | 'year' | 'month';
  attrs?: ComponentProps<typeof IonDatetime> & { id?: string };
  extraClassName?: string;
  formatOptions?: any;
  emptyText?: string;
  emptyDateText?: string;
  emptyTimeText?: string;
  clearable?: boolean;
  onClear?: () => void;
  useCurrentDateAsDefault?: boolean;
}

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
  presentation = 'date-time',
  attrs,
  extraClassName = '',
  emptyText = '',
  emptyDateText,
  emptyTimeText,
  clearable = true,
  onClear,
  useCurrentDateAsDefault = false,
}) => {
  const hasValue = Boolean(value);
  const { disabled, min, max } = attrs || {};

  let inputType = 'datetime-local';
  if (presentation === 'date') inputType = 'date';
  else if (presentation === 'time') inputType = 'time';
  else if (presentation === 'month-year' || presentation === 'month') inputType = 'month';

  const currentValue = useMemo(() => {
    if (hasValue) return value;
    if (!useCurrentDateAsDefault) return '';
    if (inputType === 'date') return dayjs().format('YYYY-MM-DD');
    if (inputType === 'time') return dayjs().format('HH:mm');
    if (inputType === 'month') return dayjs().format('YYYY-MM');
    return dayjs().format('YYYY-MM-DDTHH:mm');
  }, [hasValue, value, useCurrentDateAsDefault, inputType]);

  const parseDate = (val: string) => {
    if (!val) return null;
    if (inputType === 'time' && !val.includes('-')) {
      const d = dayjs(`2000-01-01T${val}`);
      return d.isValid() ? d : null;
    }
    const d = dayjs(val);
    return d.isValid() ? d : null;
  };

  const internalValue = useMemo(() => {
    if (!currentValue) return '';
    try {
      const d = parseDate(currentValue);
      if (!d) return '';
      
      if (inputType === 'date') return d.format('YYYY-MM-DD');
      if (inputType === 'time') return d.format('HH:mm');
      if (inputType === 'month') return d.format('YYYY-MM');
      return d.format('YYYY-MM-DDTHH:mm');
    } catch {
      return '';
    }
  }, [currentValue, inputType]);

  const displayValue = useMemo(() => {
    if (!currentValue) return '';
    try {
      const d = parseDate(currentValue);
      if (!d) return currentValue;
      
      if (inputType === 'date') return d.format('DD/MM/YYYY');
      if (inputType === 'time') return d.format('HH:mm');
      if (inputType === 'month') return d.format('MM/YYYY');
      return d.format('DD/MM/YYYY HH:mm');
    } catch {
      return currentValue;
    }
  }, [currentValue, inputType]);

  const placeholderText = emptyDateText || emptyText || (inputType === 'time' ? 'Chọn giờ' : 'Chọn ngày');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      if (clearable) {
        onClear?.();
        onChange?.({ detail: { value: '' } });
      }
      return;
    }

    let emittedValue = val;
    try {
      if (inputType === 'date') {
        emittedValue = val;
      } else if (inputType === 'time') {
        emittedValue = val;
      } else if (inputType === 'month') {
        emittedValue = val;
      } else {
        emittedValue = dayjs(val).format();
      }
    } catch {
      emittedValue = val;
    }

    onChange?.({ detail: { value: emittedValue } });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClear?.();
    onChange?.({ detail: { value: '' } });
  };
  
  const formatAttrDate = (isoString?: string | string[]) => {
     if (!isoString || typeof isoString !== 'string') return undefined;
     try {
       const d = parseDate(isoString);
       if (!d) return undefined;
       if (inputType === 'date') return d.format('YYYY-MM-DD');
       if (inputType === 'time') return d.format('HH:mm');
       if (inputType === 'month') return d.format('YYYY-MM');
       return d.format('YYYY-MM-DDTHH:mm');
     } catch {
       return undefined;
     }
  };

  return (
    <div className={`relative inline-flex items-center bg-[#f4f5f8] rounded-lg px-[10px] py-[4px] min-h-[30px] ${disabled ? 'opacity-50 pointer-events-none' : ''} ${extraClassName}`}>
      <input
        type={inputType}
        value={internalValue}
        onChange={handleChange}
        disabled={disabled}
        min={formatAttrDate(min)}
        max={formatAttrDate(max)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
      />
      <div className="flex-1 flex justify-between items-center text-[14px] leading-[20px] z-10 pointer-events-none whitespace-nowrap">
        <span className={currentValue ? "text-gray-900" : "text-[#6b7280]"}>
          {currentValue ? displayValue : placeholderText}
        </span>
        
        {clearable && currentValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[#6b7280] hover:text-gray-900 ml-2 z-20 relative px-1 text-lg leading-none font-bold -my-1 pointer-events-auto"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

export default DatePicker;
