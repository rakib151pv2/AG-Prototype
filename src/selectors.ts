import type { Currency, DueFlag, LC, LCStatus } from './types';

// Reference/spot BDT rates used to value FC amounts that have not yet been
// realized (i.e. no realization exchange rate exists for them yet).
export const SPOT_RATES: Record<Currency, number> = {
  USD: 119.5,
  EUR: 129.0,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(from: Date, to: Date): number {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / MS_PER_DAY);
}

export function getRealizedFC(lc: LC): number {
  return lc.realizations.reduce((sum, r) => sum + r.amountFC, 0);
}

export function getRealizedBDT(lc: LC): number {
  return lc.realizations.reduce((sum, r) => sum + r.amountFC * r.exchangeRate, 0);
}

export function getOutstandingFC(lc: LC): number {
  return Math.max(0, lc.lcValue - getRealizedFC(lc));
}

export function getOutstandingBDT(lc: LC): number {
  return getOutstandingFC(lc) * SPOT_RATES[lc.currency];
}

export function getPctRealized(lc: LC): number {
  if (lc.lcValue <= 0) return 0;
  return Math.min(100, (getRealizedFC(lc) / lc.lcValue) * 100);
}

// Total value of the LC expressed in BDT: realized tranches at their actual
// realization rate, outstanding tranche at the current spot rate.
export function getExposureBDT(lc: LC): number {
  return getRealizedBDT(lc) + getOutstandingBDT(lc);
}

export function getDaysToMaturity(lc: LC, today: Date = new Date()): number {
  return daysBetween(today, new Date(lc.maturityDate));
}

export function getDaysOverdue(lc: LC, today: Date = new Date()): number {
  const overdue = daysBetween(new Date(lc.maturityDate), today);
  return Math.max(0, overdue);
}

export function getStatus(lc: LC, today: Date = new Date()): LCStatus {
  const outstandingFC = getOutstandingFC(lc);
  if (outstandingFC <= 0.005) return 'Realized';

  const daysToMaturity = getDaysToMaturity(lc, today);
  if (daysToMaturity < 0) return 'Overdue';
  if (daysToMaturity <= 7) return 'Due Soon';
  return 'Open';
}

// 12% p.a. simple interest on the outstanding BDT balance, accrued from
// maturity date to today. Zero unless the LC is actually Overdue.
export function getAccruedInterestBDT(lc: LC, today: Date = new Date()): number {
  const status = getStatus(lc, today);
  if (status !== 'Overdue') return 0;
  const daysOverdue = getDaysOverdue(lc, today);
  const outstandingBDT = getOutstandingBDT(lc);
  return outstandingBDT * 0.12 * (daysOverdue / 365);
}

export function getDueFlag(lc: LC, today: Date = new Date()): DueFlag {
  return getStatus(lc, today) === 'Overdue' ? 'OD' : 'D';
}

export function getMaturityMonth(lc: LC): string {
  return new Date(lc.maturityDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// The bank's penal rate is 12% p.a. on the full overdue tenure (above). Separately,
// the group negotiates a concessional 6% recovery that waives the first 90 overdue
// days as a grace period — interest only accrues on tenure beyond that waiver.
export function getWaivedOverdueTenure(lc: LC, today: Date = new Date()): number {
  return Math.max(0, getDaysOverdue(lc, today) - 90);
}

export function getConcessionalInterestBDT(lc: LC, today: Date = new Date()): number {
  const status = getStatus(lc, today);
  if (status !== 'Overdue') return 0;
  const waivedTenure = getWaivedOverdueTenure(lc, today);
  if (waivedTenure <= 0) return 0;
  const outstandingBDT = getOutstandingBDT(lc);
  return outstandingBDT * 0.06 * (waivedTenure / 365);
}

export const STATUS_COLORS: Record<LCStatus, { bg: string; text: string; dot: string }> = {
  Overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Due Soon': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Open: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Realized: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};
