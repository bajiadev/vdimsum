export const formatCurrency = (amountInPence: number): string => {
  const amountInPounds = amountInPence / 100;
  return `£${amountInPounds.toFixed(2)}`;
}