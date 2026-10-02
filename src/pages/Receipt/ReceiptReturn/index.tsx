import useReceiptReturnForm from "./hooks/useReceiptReturnForm";
import ReceiptReturnView from "./components/ReceiptReturnView";

export default function ReceiptReturn() {
  const form = useReceiptReturnForm();
  return <ReceiptReturnView {...form} />;
}
