export interface IModalSelectSupplierProps {
  dismiss: (data?: any, role?: string) => void;
  initialSelectedNames?: { id: string; name: string }[];
  multi?: boolean; // enable multi-select mode
}