import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonChip
} from '@ionic/react';
import { pencilOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';

interface EditableFieldProps {
  label: string;
  value: string | string[];
  displayValue?: string;
  fieldKey: string;
  isEditing: boolean;
  isLoading?: boolean;
  validationError?: string;
  type?: 'text' | 'textarea' | 'select' | 'multiselect';
  options?: Array<{ id: string; name: string; }>;
  placeholder?: string;
  maxLength?: number;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  displayValue,
  isEditing,
  isLoading = false,
  validationError,
  type = 'text',
  options = [],
  placeholder,
  maxLength,
  onEdit,
  onSave,
  onCancel,
  onChange,
  disabled = false
}) => {
  const renderDisplayValue = () => {
    if (type === 'multiselect' && Array.isArray(value)) {
      return value.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {value.map((item, index) => (
            <IonChip key={index} color="primary">
              {item}
            </IonChip>
          ))}
        </div>
      ) : (
        <IonText color="medium">Chưa có thông tin</IonText>
      );
    }
    
    return displayValue || value || <IonText color="medium">Chưa có thông tin</IonText>;
  };

  const renderEditInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <IonTextarea
            value={value as string}
            placeholder={placeholder}
            maxlength={maxLength}
            autoGrow={true}
            rows={3}
            onIonInput={(e) => onChange(e.detail.value!)}
          />
        );
      
      case 'select':
        return (
          <IonSelect
            value={value}
            placeholder={placeholder}
            onIonChange={(e) => onChange(e.detail.value)}
          >
            {options.map((option) => (
              <IonSelectOption key={option.id} value={option.name}>
                {option.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        );
      
      case 'multiselect':
        return (
          <IonSelect
            value={value}
            placeholder={placeholder}
            multiple={true}
            onIonChange={(e) => onChange(e.detail.value)}
          >
            {options.map((option) => (
              <IonSelectOption key={option.id} value={option.name}>
                {option.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        );
      
      default:
        return (
          <IonInput
            value={value as string}
            placeholder={placeholder}
            maxlength={maxLength}
            onIonInput={(e) => onChange(e.detail.value!)}
          />
        );
    }
  };

  return (
    <IonItem>
      <IonLabel position="stacked">
        <strong>{label}</strong>
      </IonLabel>
      
      {isEditing ? (
        <div style={{ width: '100%' }}>
          {renderEditInput()}
          
          {validationError && (
            <IonText color="danger" style={{ fontSize: '0.8em', marginTop: '4px', display: 'block' }}>
              {validationError}
            </IonText>
          )}
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <IonButton
              size="small"
              fill="solid"
              color="success"
              onClick={onSave}
              disabled={isLoading || !!validationError}
            >
              {isLoading ? <IonSpinner name="crescent" /> : <IonIcon icon={checkmarkOutline} />}
              Lưu
            </IonButton>
            
            <IonButton
              size="small"
              fill="outline"
              color="medium"
              onClick={onCancel}
              disabled={isLoading}
            >
              <IonIcon icon={closeOutline} />
              Hủy
            </IonButton>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            {renderDisplayValue()}
          </div>
          
          {!disabled && (
            <IonButton
              size="small"
              fill="clear"
              color="primary"
              onClick={onEdit}
            >
              <IonIcon icon={pencilOutline} />
            </IonButton>
          )}
        </div>
      )}
    </IonItem>
  );
};