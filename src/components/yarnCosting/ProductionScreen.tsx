import { useMemo, useState } from 'react';
import type { DailyYarnRecord, DowntimeReason } from '../../yarnCosting/types';
import { YARNS } from '../../yarnCosting/masterData';
import { getEfficiencyPct, getUtilizationPct } from '../../yarnCosting/calculations';
import { formatNumber, formatPercent } from '../../formatters';
import DateRangeFilter, { resolveDates, type RangePreset } from './shared/DateRangeFilter';

export default function ProductionScreen({ records }: { records: DailyYarnRecord[] }) {
  const [preset, setPreset] = useState<RangePreset>('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const dates = useMemo(() => resolveDates(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const rows = YARNS.map((yarn) => {
    const yarnRecords = records.filter((r) => r.yarnId === yarn.id && dates.includes(r.date));
    const target = yarnRecords.reduce((s, r) => s + r.plannedProductionKg, 0);
    const actual = yarnRecords.reduce((s, r) => s + r.actualProductionKg, 0);
    const downtimeHours = yarnRecords.reduce((s, r) => s + r.downtimeHours, 0);
    const avgEfficiency = yarnRecords.length ? yarnRecords.reduce((s, r) => s + getEfficiencyPct(r), 0) / yarnRecords.length : 0;
    const avgUtilization = yarnRecords.length ? yarnRecords.reduce((s, r) => s + getUtilizationPct(r), 0) / yarnRecords.length : 0;
    return { yarn, target, actual, achievement: target > 0 ? actual / target : 0, downtimeHours, avgEfficiency, avgUtilization };
  });

  const downtimeByReason = new Map<DowntimeReason, number>();
  for (const r of records.filter((r) => dates.includes(r.date))) {
    if (r.downtimeReason) downtimeByReason.set(r.downtimeReason, (downtimeByReason.get(r.downtimeReason) ?? 0) + r.downtimeHours);
  }
  const reasonRows = Array.from(downtimeByReason.entries()).sort((a, b) => b[1] - a[1]);
  const maxReasonHours = Math.max(1, ...reasonRows.map(([, h]) => h));

  return (
    <div className="space-y-6">
      <DateRangeFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onChange={(p, f, t) => {
          setPreset(p);
          setCustomFrom(f);
          setCustomTo(t);
        }}
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Production Efficiency by Yarn</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Yarn</th>
                <th className="px-4 py-2 font-medium text-right">Target (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Actual (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Achievement</th>
                <th className="px-4 py-2 font-medium text-right">Avg. Efficiency</th>
                <th className="px-4 py-2 font-medium text-right">Utilization</th>
                <th className="px-4 py-2 font-medium text-right">Downtime (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.yarn.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{r.yarn.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(r.target)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(r.actual)}</td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                      r.achievement < 0.9 ? 'text-red-600' : r.achievement < 0.97 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatPercent(r.achievement)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatPercent(r.avgEfficiency)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatPercent(r.avgUtilization)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{r.downtimeHours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">Downtime by Reason</h3>
        <p className="text-xs text-slate-500">Total hours lost, selected range</p>
        <div className="mt-3 space-y-2.5">
          {reasonRows.length === 0 && <p className="text-sm text-slate-400">No downtime recorded in this range.</p>}
          {reasonRows.map(([reason, hours]) => (
            <div key={reason}>
              <div className="mb-0.5 flex items-center justify-between text-xs text-slate-600">
                <span>{reason}</span>
                <span className="tabular-nums font-medium text-slate-700">{hours.toFixed(1)}h</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: `${(hours / maxReasonHours) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
