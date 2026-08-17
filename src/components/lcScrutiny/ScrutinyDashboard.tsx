import { useMemo } from 'react';
import { AlertTriangle, ClipboardCheck, ShieldCheck, ShieldX } from 'lucide-react';
import type { ScrutinyChecklist } from '../../lcScrutiny/types';
import { getDiscrepancies, getScrutinyStatus } from '../../lcScrutiny/discrepancyEngine';
import { formatDate, formatNumber } from '../../formatters';
import KpiCard from '../KpiCard';
import ScrutinyStatusBadge from './ScrutinyStatusBadge';

export default function ScrutinyDashboard({ checklists }: { checklists: ScrutinyChecklist[] }) {
  const rows = useMemo(
    () => checklists.map((c) => ({ checklist: c, status: getScrutinyStatus(c), discrepancies: getDiscrepancies(c) })),
    [checklists]
  );

  const cleanCount = rows.filter((r) => r.status === 'Clean').length;
  const flaggedCount = rows.filter((r) => r.status === 'Discrepancy Found').length;
  const totalDiscrepancies = rows.reduce((s, r) => s + r.discrepancies.length, 0);
  const criticalCount = rows.reduce((s, r) => s + r.discrepancies.filter((d) => d.severity === 'critical').length, 0);

  const byCategory = new Map<string, number>();
  for (const r of rows) {
    for (const d of r.discrepancies) byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + 1);
  }
  const categoryRows = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryRows.map(([, n]) => n));

  const recentFlags = rows
    .filter((r) => r.status === 'Discrepancy Found')
    .sort((a, b) => b.checklist.scrutinyDate.localeCompare(a.checklist.scrutinyDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Scrutinized" value={formatNumber(checklists.length)} sub="Total checklists" icon={ClipboardCheck} />
        <KpiCard label="Clean" value={formatNumber(cleanCount)} sub="No discrepancies" icon={ShieldCheck} />
        <KpiCard
          label="Discrepancy Found"
          value={formatNumber(flaggedCount)}
          sub="Needs follow-up"
          icon={ShieldX}
          tone={flaggedCount > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="Critical Alerts"
          value={formatNumber(criticalCount)}
          sub={`${totalDiscrepancies} total discrepancies`}
          icon={AlertTriangle}
          tone={criticalCount > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700">Discrepancies by Category</h3>
          <div className="mt-3 space-y-2.5">
            {categoryRows.length === 0 && <p className="text-sm text-slate-400">No discrepancies raised.</p>}
            {categoryRows.map(([category, count]) => (
              <div key={category}>
                <div className="mb-0.5 flex items-center justify-between text-xs text-slate-600">
                  <span>{category}</span>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${(count / maxCategory) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-700">Recently Flagged LCs</h3>
          <div className="mt-3 divide-y divide-slate-100">
            {recentFlags.length === 0 && <p className="py-4 text-sm text-slate-400">No LCs currently flagged.</p>}
            {recentFlags.map((r) => (
              <div key={r.checklist.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{r.checklist.lcNumber}</p>
                  <p className="truncate text-xs text-slate-500">
                    {r.checklist.applicantName} · {formatDate(r.checklist.scrutinyDate)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-500">{r.discrepancies.length} discrepanc{r.discrepancies.length === 1 ? 'y' : 'ies'}</p>
                </div>
                <ScrutinyStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
