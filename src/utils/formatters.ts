export function formatPKR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'PKR 0';
  return 'PKR ' + Math.round(amount).toLocaleString('en-US');
}

export function formatUSD(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatCurrencyAmount(amountOriginal: number, currency: string, amountPkr?: number): string {
  if (currency === 'USD') {
    return `${formatUSD(amountOriginal)} (PKR ${Math.round(amountPkr || amountOriginal * 280).toLocaleString()})`;
  }
  return formatPKR(amountOriginal);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
