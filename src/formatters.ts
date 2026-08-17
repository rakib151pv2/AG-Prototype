import type { Currency } from './types';

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBDT(value: number): string {
  return `BDT ${formatNumber(value)}`;
}

export function formatFC(value: number, currency: Currency): string {
  return `${currency} ${formatNumber(value, 2)}`;
}

export function formatMoney(value: number, currency: string, decimals = 2): string {
  return `${currency} ${formatNumber(value, decimals)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}
