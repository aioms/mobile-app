export interface BarcodeProduct {
  productCode: string;
  productName: string;
  selected?: boolean;
}

export interface MultipleBarcodeModalProps {
  products: BarcodeProduct[];
  mode: 'single' | 'multiple';
}

export interface PrintingProgress {
  current: number;
  total: number;
  message: string;
}

export interface PrintingStatus {
  status: 'idle' | 'preparing' | 'printing' | 'completed' | 'error';
  progress: PrintingProgress;
}

export interface PrintOptions {
  quantity: number;
  layout?: 'single' | 'dual' | 'grid';
  groupSize?: number;
}

export interface BarcodeModalState {
  selectedProducts: BarcodeProduct[];
  printingStatus: PrintingStatus;
  showMultipleMode: boolean;
}