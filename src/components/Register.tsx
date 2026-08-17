import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { LC, LCStatus } from '../types';
import {
  getAccruedInterestBDT,
  getOutstandingBDT,
  getPctRealized,
  getStatus,
} from '../selectors';
import { formatBDT, formatDate, formatFC } from '../formatters';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import LCDetailDrawer from './LCDetailDrawer';

type SortKey = 'maturity' | 'status';

const STATUS_FILTERS: Array<LCStatus | 'All'> = ['All', 'Overdue', 'Due Soon', 'Open', 'Realized'];
const STATUS_RANK: Record<LCStatus, number> = { Overdue: 0, 'Due Soon': 1, Open: 2, Realized: 3 };

export default function Register({ lcs }: { lcs: LC[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('maturity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<LCStatus | 'All'>('All');
  const [selected, setSelected] = useState<LC | null>(null);

  const rows = useMemo(() => {
    const today = new Date();
    const enriched = lcs.map((lc) => ({
      lc,
      status: getStatus(lc, today),
      outstandingBDT: getOutstandingBDT(lc),
      pct: getPctRealized(lc),
      interest: getAccruedInterestBDT(lc, today),
    }));

    const filtered =
      statusFilter === 'All' ? enriched : enriched.filter((r) => r.status === statusFilter);

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'maturity') {
        cmp = new Date(a.lc.maturityDate).getTime() - new Date(b.lc.maturityDate).getTime();
      } else {
        cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [lcs, statusFilter, sortKey, sortDir]);

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
        <h3 className="text-sm font-semibold text-slate-700">LC Register</h3>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              <th className="px-4 py-2 font-medium">LC #</th>
              <th className="px-4 py-2 font-medium">Party Name</th>
              <th className="px-4 py-2 font-medium">Bank</th>
              <th className="px-4 py-2 font-medium text-right">Value (FC)</th>
              <th className="px-4 py-2 font-medium">% Realized</th>
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
            {rows.map(({ lc, status, outstandingBDT, pct, interest }) => (
              <tr
                key={lc.id}
                onClick={() => setSelected(lc)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 font-medium text-slate-700">{lc.lcNumber}</td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-slate-600">{lc.beneficiary}</td>
                <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-500">{lc.issuingBank}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {formatFC(lc.lcValue, lc.currency)}
                </td>
                <td className="px-4 py-2.5">
                  <ProgressBar pct={pct} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {formatBDT(outstandingBDT)}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{formatDate(lc.maturityDate)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {interest > 0 ? formatBDT(interest) : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                  No LCs match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <LCDetailDrawer lc={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
