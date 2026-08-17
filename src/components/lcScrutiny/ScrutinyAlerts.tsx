import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { DiscrepancyCategory, ScrutinyChecklist } from '../../lcScrutiny/types';
import { getDiscrepancies } from '../../lcScrutiny/discrepancyEngine';
import { formatDate } from '../../formatters';

const CATEGORIES: DiscrepancyCategory[] = ['Financial', 'Banking', 'Shipment', 'Payment', 'Compliance', 'Documents'];

export default function ScrutinyAlerts({ checklists }: { checklists: ScrutinyChecklist[] }) {
  const grouped = useMemo(() => {
    const map = new Map<DiscrepancyCategory, Array<{ checklist: ScrutinyChecklist; message: string; severity: string }>>();
    for (const c of checklists) {
      for (const d of getDiscrepancies(c)) {
        const list = map.get(d.category) ?? [];
        list.push({ checklist: c, message: d.message, severity: d.severity });
        map.set(d.category, list);
      }
    }
    return map;
  }, [checklists]);

  const total = Array.from(grouped.values()).reduce((s, l) => s + l.length, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">LC Scrutiny Alerts</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{total}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Auto-raised whenever a scrutiny checklist finds a discrepancy against the PI or LC clauses.</p>
      </div>

      {CATEGORIES.map((cat) => {
        const items = grouped.get(cat) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-700">
                {cat} <span className="text-xs font-normal text-slate-400">({items.length})</span>
              </h4>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <AlertTriangle size={13} />
                  </span>
                  <div>
                    <p className="text-sm text-slate-700">{item.message}</p>
                    <p className="text-xs text-slate-400">
                      {item.checklist.lcNumber} · {item.checklist.applicantName} · {formatDate(item.checklist.scrutinyDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {total === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          No discrepancies raised. All scrutinized LCs are clean.
        </div>
      )}
    </div>
  );
}
