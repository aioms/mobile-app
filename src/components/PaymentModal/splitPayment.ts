export const getSplitPaymentState = (
  totalAmount: number,
  cashAmount: number,
  bankAmount: number,
) => {
  const enteredAmount = cashAmount + bankAmount;
  const difference = enteredAmount - totalAmount;
  const isValid = cashAmount > 0 && bankAmount > 0 && difference === 0;

  return { enteredAmount, difference, isValid };
};
