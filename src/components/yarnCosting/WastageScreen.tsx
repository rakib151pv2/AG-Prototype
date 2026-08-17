import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { DailyYarnRecord, ProcessName } from '../../yarnCosting/types';
import { getProcessStages } from '../../yarnCosting/calculations';
import { formatBDT, formatPercent } from '../../formatters';
import DateRangeFilter, { resolveDates, type RangePreset } from './shared/DateRangeFilter';

const ABNORMAL_THRESHOLD = 0.01; // 1pp

export default function WastageScreen({ records }: { records: DailyYarnRecord[] }) {
  const [preset, setPreset] = useState<RangePreset>('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const dates = useMemo(() => resolveDates(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const rangeRecords = records.filter((r) => dates.includes(r.date));

  const byProcess = new Map<ProcessName, { standardSum: number; actualSum: number; wasteValue: number; count: number }>();
  for (const record of rangeRecords) {
    for (const stage of getProcessStages(record)) {
      const entry = byProcess.get(stage.process) ?? { standardSum: 0, actualSum: 0, wasteValue: 0, count: 0 };
      entry.standardSum += stage.standardPct;
      entry.actualSum += stage.actualPct;
      entry.wasteValue += stage.wasteValuePerKgYarn * record.actualProductionKg;
      entry.count += 1;
      byProcess.set(stage.process, entry);
    }
  }

  const rows = Array.from(byProcess.entries())
    .map(([process, e]) => ({
      process,
      standard: e.standardSum / e.count,
      actual: e.actualSum / e.count,
      variance: e.actualSum / e.count - e.standardSum / e.count,
      wasteValue: e.wasteValue,
    }))
    .sort((a, b) => b.variance - a.variance);

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
          <h3 className="text-sm font-semibold text-slate-700">Standard vs Actual Wastage by Process</h3>
          <p className="text-xs text-slate-500">Averaged across all yarns and days in range</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Process</th>
                <th className="px-4 py-2 font-medium text-right">Standard</th>
                <th className="px-4 py-2 font-medium text-right">Actual</th>
                <th className="px-4 py-2 font-medium text-right">Variance</th>
                <th className="px-4 py-2 font-medium text-right">Waste/By-product Value</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const abnormal = r.variance > ABNORMAL_THRESHOLD;
                return (
                  <tr key={r.process}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{r.process}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatPercent(r.standard)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatPercent(r.actual)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${abnormal ? 'text-red-600' : r.variance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {r.variance >= 0 ? '+' : ''}
                      {formatPercent(r.variance)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(r.wasteValue)}</td>
                    <td className="px-4 py-2.5">
                      {abnormal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          <AlertTriangle size={11} /> Attention Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
