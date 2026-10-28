// Shared USD formatting keeps amounts consistent across dashboard, ledger, and budgets.
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatMoney = (value) => usdFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
