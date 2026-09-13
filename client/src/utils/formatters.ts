/**
 * Formats a numeric amount in the application's standard rupee format.
 * Example: 25000 -> "Rs. 25,000.00"
 */
export const formatCurrency = (amount?: number | string | null): string => {
  return `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Calculates line item total from quantity and unit price.
 */
export const calculateLineTotal = (quantity: number, unitPrice: number): number => {
  if (quantity < 0 || unitPrice < 0) return 0;
  return quantity * unitPrice;
};
