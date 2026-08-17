import { useMemo } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import type { Alert, AlertCategory, DailyClosing, DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { YARNS } from '../../yarnCosting/masterData';
import { generateAlerts } from '../../yarnCosting/alerts';
import { iso } from '../../dateUtil';
import { formatDate } from '../../formatters';

const CATEGORIES: AlertCategory[] = ['Cost', 'Production', 'Profit', 'Data Entry'];

export default function AlertsScreen({
  records,
  sales,
  closings,
}: {
  records: DailyYarnRecord[];
  sales: DailySalesEntry[];
  closings: DailyClosing[];
}) {
  const alerts = useMemo(() => generateAlerts(YARNS, records, sales, closings, iso(0)), [records, sales, closings]);

  const byCategory = new Map<AlertCategory, Alert[]>();
  for (const cat of CATEGORIES) byCategory.set(cat, alerts.filter((a) => a.category === cat));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Alerts &amp; Notifications</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{alerts.length}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Auto-generated from cost, production, profit, and data-entry checks — nothing here is manually curated.
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const items = byCategory.get(cat) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-700">
                {cat} Alerts <span className="text-xs font-normal text-slate-400">({items.length})</span>
              </h4>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      a.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <AlertTriangle size={13} />
                  </span>
                  <div>
                    <p className="text-sm text-slate-700">{a.message}</p>
                    <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {alerts.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          No active alerts. Everything is within standard ranges.
        </div>
      )}
    </div>
  );
}
