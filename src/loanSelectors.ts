import type { LoanFacility, LoanStatus } from './types';
import { SPOT_RATES } from './selectors';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(from: Date, to: Date): number {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / MS_PER_DAY);
}

export function getLoanOutstandingBDT(loan: LoanFacility): number {
  return loan.currency === 'USD' ? loan.outstandingAmount * SPOT_RATES.USD : loan.outstandingAmount;
}

export function getLoanPrincipalBDT(loan: LoanFacility): number {
  return loan.currency === 'USD' ? loan.principalAmount * SPOT_RATES.USD : loan.principalAmount;
}

export function getLoanDaysToMaturity(loan: LoanFacility, today: Date = new Date()): number {
  return daysBetween(today, new Date(loan.maturityDate));
}

export function getLoanDaysOverdue(loan: LoanFacility, today: Date = new Date()): number {
  return Math.max(0, daysBetween(new Date(loan.maturityDate), today));
}

export function getLoanStatus(loan: LoanFacility, today: Date = new Date()): LoanStatus {
  if (loan.outstandingAmount <= 0.005) return 'Settled';
  const daysToMaturity = getLoanDaysToMaturity(loan, today);
  if (daysToMaturity < 0) return 'Overdue';
  if (daysToMaturity <= 7) return 'Due Soon';
  return 'Active';
}

// Same simple-interest convention as the LC tracker: penal interest only
// accrues once a facility is actually past its adjustment/maturity date.
export function getLoanAccruedInterestBDT(loan: LoanFacility, today: Date = new Date()): number {
  if (getLoanStatus(loan, today) !== 'Overdue') return 0;
  const daysOverdue = getLoanDaysOverdue(loan, today);
  return getLoanOutstandingBDT(loan) * (loan.interestRatePct / 100) * (daysOverdue / 365);
}

export const LOAN_STATUS_COLORS: Record<LoanStatus, { bg: string; text: string; dot: string }> = {
  Overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Due Soon': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Active: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Settled: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export const LOAN_TYPE_LABELS: Record<LoanFacility['loanType'], string> = {
  STL: 'Short Term Loan',
  UPAS: 'Usance Payable at Sight',
  OD: 'Overdraft',
  EDF: 'Export Development Fund',
};
