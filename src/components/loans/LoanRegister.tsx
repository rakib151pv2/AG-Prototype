import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { LoanFacility, LoanStatus } from '../../types';
import { getLoanAccruedInterestBDT, getLoanOutstandingBDT, getLoanStatus } from '../../loanSelectors';
import { formatBDT, formatDate, formatMoney } from '../../formatters';
import LoanStatusBadge from './LoanStatusBadge';
import LoanDetailDrawer from './LoanDetailDrawer';

type SortKey = 'maturity' | 'status';

const STATUS_FILTERS: Array<LoanStatus | 'All'> = ['All', 'Overdue', 'Due Soon', 'Active', 'Settled'];
const STATUS_RANK: Record<LoanStatus, number> = { Overdue: 0, 'Due Soon': 1, Active: 2, Settled: 3 };

export default function LoanRegister({ loans }: { loans: LoanFacility[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('maturity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'All'>('All');
  const [selected, setSelected] = useState<LoanFacility | null>(null);

  const rows = useMemo(() => {
    const today = new Date();
    const enriched = loans.map((loan) => ({
      loan,
      status: getLoanStatus(loan, today),
      outstandingBDT: getLoanOutstandingBDT(loan),
      interest: getLoanAccruedInterestBDT(loan, today),
    }));

    const filtered = statusFilter === 'All' ? enriched : enriched.filter((r) => r.status === statusFilter);

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'maturity') {
        cmp = new Date(a.loan.maturityDate).getTime() - new Date(b.loan.maturityDate).getTime();
      } else {
        cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [loans, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Facility Register</h3>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Facility #</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Unit</th>
              <th className="px-4 py-2 font-medium">Bank</th>
              <th className="px-4 py-2 font-medium text-right">Principal</th>
              <th className="px-4 py-2 font-medium text-right">Outstanding (BDT)</th>
              <th className="px-4 py-2 font-medium">
                <button className="flex items-center gap-1 hover:text-slate-700" onClick={() => toggleSort('maturity')}>
                  Maturity <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-2 font-medium">
                <button className="flex items-center gap-1 hover:text-slate-700" onClick={() => toggleSort('status')}>
                  Status <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-2 font-medium text-right">Accrued Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ loan, status, outstandingBDT, interest }) => (
              <tr key={loan.id} onClick={() => setSelected(loan)} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{loan.facilityNumber}</td>
                <td className="px-4 py-2.5 text-slate-600">{loan.loanType}</td>
                <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-600">{loan.unit}</td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-slate-500">{loan.bank}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {formatMoney(loan.principalAmount, loan.currency)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(outstandingBDT)}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatDate(loan.maturityDate)}</td>
                <td className="px-4 py-2.5">
                  <LoanStatusBadge status={status} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {interest > 0 ? formatBDT(interest) : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                  No facilities match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <LoanDetailDrawer loan={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
