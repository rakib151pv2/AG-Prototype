import { useMemo } from 'react';
import { AlertTriangle, CalendarClock, Landmark, Percent, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LoanFacility, LoanType } from '../../types';
import {
  getLoanAccruedInterestBDT,
  getLoanDaysToMaturity,
  getLoanOutstandingBDT,
  getLoanPrincipalBDT,
  getLoanStatus,
  LOAN_TYPE_LABELS,
} from '../../loanSelectors';
import { formatBDT, formatDate, formatNumber } from '../../formatters';
import KpiCard from '../KpiCard';
import LoanStatusBadge from './LoanStatusBadge';
import LoanUnitMatrix from './LoanUnitMatrix';

const LOAN_TYPE_ORDER: LoanType[] = ['STL', 'UPAS', 'OD', 'EDF'];
// Validated categorical palette (node scripts/validate_palette.js — light mode, all-pairs PASS).
const LOAN_TYPE_HEX: Record<LoanType, string> = {
  STL: '#2563eb',
  UPAS: '#d97706',
  OD: '#0d9488',
  EDF: '#be185d',
};

export default function LoanDashboard({ loans }: { loans: LoanFacility[] }) {
  const today = useMemo(() => new Date(), []);

  const rows = useMemo(
    () =>
      loans.map((loan) => ({
        loan,
        status: getLoanStatus(loan, today),
        outstandingBDT: getLoanOutstandingBDT(loan),
        principalBDT: getLoanPrincipalBDT(loan),
        interestBDT: getLoanAccruedInterestBDT(loan, today),
        daysToMaturity: getLoanDaysToMaturity(loan, today),
      })),
    [loans, today]
  );

  const totalSanctioned = rows.reduce((s, r) => s + r.principalBDT, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstandingBDT, 0);
  const countOverdue = rows.filter((r) => r.status === 'Overdue').length;
  const totalInterest = rows.reduce((s, r) => s + r.interestBDT, 0);

  const chartData = LOAN_TYPE_ORDER.map((loanType) => ({
    loanType,
    label: LOAN_TYPE_LABELS[loanType],
    outstandingBDT: rows.filter((r) => r.loan.loanType === loanType).reduce((s, r) => s + r.outstandingBDT, 0),
    count: rows.filter((r) => r.loan.loanType === loanType).length,
  }));

  const upcoming = rows
    .filter((r) => r.status !== 'Settled' && r.daysToMaturity >= 0 && r.daysToMaturity <= 30)
    .sort((a, b) => a.daysToMaturity - b.daysToMaturity);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Sanctioned"
          value={formatBDT(totalSanctioned)}
          sub={`${loans.length} facilities across ${new Set(loans.map((l) => l.unit)).size} units`}
          icon={Wallet}
        />
        <KpiCard label="Total Outstanding" value={formatBDT(totalOutstanding)} sub="Yet to be adjusted" icon={Landmark} />
        <KpiCard
          label="Overdue Facilities"
          value={formatNumber(countOverdue)}
          sub="Past adjustment/maturity date"
          icon={AlertTriangle}
          tone={countOverdue > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="Accrued Interest"
          value={formatBDT(totalInterest)}
          sub="On overdue facilities only"
          icon={Percent}
          tone={totalInterest > 0 ? 'warning' : 'default'}
        />
      </div>

      <LoanUnitMatrix loans={loans} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-700">Outstanding by Facility Type</h3>
          <p className="text-xs text-slate-500">Total outstanding (BDT) grouped by STL / UPAS / OD / EDF</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="loanType"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${formatNumber(v / 1_000_000, 1)}M`}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => [formatBDT(value), 'Outstanding']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="outstandingBDT" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {chartData.map((d) => (
                    <Cell key={d.loanType} fill={LOAN_TYPE_HEX[d.loanType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {chartData.map((d) => (
              <div key={d.loanType} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LOAN_TYPE_HEX[d.loanType] }} />
                {d.loanType} — {d.label} ({d.count})
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Maturities — Next 30 Days</h3>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {upcoming.length === 0 && (
              <p className="py-4 text-sm text-slate-400">No adjustments due in the next 30 days.</p>
            )}
            {upcoming.map((r) => (
              <div
                key={r.loan.id}
                className={`flex items-center justify-between gap-3 py-2.5 ${
                  r.status === 'Due Soon' ? 'bg-amber-50/60 -mx-4 px-4' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{r.loan.facilityNumber}</p>
                  <p className="truncate text-xs text-slate-500">{r.loan.bank}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-500">{formatDate(r.loan.maturityDate)}</p>
                  <p className="text-xs font-medium text-slate-600">
                    {r.daysToMaturity === 0 ? 'Today' : `in ${r.daysToMaturity}d`}
                  </p>
                </div>
                <LoanStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
