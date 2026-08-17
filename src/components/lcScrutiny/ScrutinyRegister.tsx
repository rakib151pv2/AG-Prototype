import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { ScrutinyChecklist, ScrutinyStatus } from '../../lcScrutiny/types';
import { getDiscrepancies, getScrutinyStatus } from '../../lcScrutiny/discrepancyEngine';
import { formatDate } from '../../formatters';
import ScrutinyStatusBadge from './ScrutinyStatusBadge';
import ScrutinyDetailDrawer from './ScrutinyDetailDrawer';

type SortKey = 'date' | 'status';
const STATUS_FILTERS: Array<ScrutinyStatus | 'All'> = ['All', 'Discrepancy Found', 'Clean'];
const STATUS_RANK: Record<ScrutinyStatus, number> = { 'Discrepancy Found': 0, Clean: 1 };

export default function ScrutinyRegister({ checklists }: { checklists: ScrutinyChecklist[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<ScrutinyStatus | 'All'>('All');
  const [selected, setSelected] = useState<ScrutinyChecklist | null>(null);

  const rows = useMemo(() => {
    const enriched = checklists.map((c) => ({ checklist: c, status: getScrutinyStatus(c), discrepancies: getDiscrepancies(c) }));
    const filtered = statusFilter === 'All' ? enriched : enriched.filter((r) => r.status === statusFilter);
    return [...filtered].sort((a, b) => {
      const cmp =
        sortKey === 'date'
          ? a.checklist.scrutinyDate.localeCompare(b.checklist.scrutinyDate)
          : STATUS_RANK[a.status] - STATUS_RANK[b.status];
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [checklists, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Export LC Scrutiny Register</h3>
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
              <th className="px-4 py-2 font-medium">LC Number</th>
              <th className="px-4 py-2 font-medium">Applicant (Buyer)</th>
              <th className="px-4 py-2 font-medium">Beneficiary</th>
              <th className="px-4 py-2 font-medium">PI Number</th>
              <th className="px-4 py-2 font-medium">
                <button className="flex items-center gap-1 hover:text-slate-700" onClick={() => toggleSort('date')}>
                  Scrutiny Date <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-2 font-medium">
                <button className="flex items-center gap-1 hover:text-slate-700" onClick={() => toggleSort('status')}>
                  Status <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-2 font-medium text-right">Discrepancies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ checklist, status, discrepancies }) => (
              <tr key={checklist.id} onClick={() => setSelected(checklist)} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{checklist.lcNumber}</td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-600">{checklist.applicantName}</td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-600">{checklist.beneficiaryName}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400">{checklist.piNumber}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatDate(checklist.scrutinyDate)}</td>
                <td className="px-4 py-2.5">
                  <ScrutinyStatusBadge status={status} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{discrepancies.length || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  No scrutiny checklists match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <ScrutinyDetailDrawer checklist={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
