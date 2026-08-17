import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import type { DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { YARNS } from '../../yarnCosting/masterData';
import { buildAllLedgers, getYarnProfitability } from '../../yarnCosting/calculations';
import { formatBDT, formatNumber, formatPercent } from '../../formatters';
import DateRangeFilter, { resolveDates, type RangePreset } from './shared/DateRangeFilter';

type SortKey = 'revenue' | 'margin' | 'profit';

export default function ProfitabilityScreen({ records, sales }: { records: DailyYarnRecord[]; sales: DailySalesEntry[] }) {
  const [preset, setPreset] = useState<RangePreset>('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('margin');
  const dates = useMemo(() => resolveDates(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const ledgersByYarn = useMemo(() => buildAllLedgers(YARNS, records, sales), [records, sales]);

  const rows = YARNS.map((y) => ({ yarn: y, p: getYarnProfitability(y.id, dates, records, sales, ledgersByYarn) })).sort((a, b) => {
    if (sortKey === 'revenue') return b.p.revenue - a.p.revenue;
    if (sortKey === 'profit') return b.p.grossProfit - a.p.grossProfit;
    return b.p.marginPct - a.p.marginPct;
  });

  const lastDate = dates[dates.length - 1];
  const lastDateLedgers = YARNS.map((y) => ({ yarn: y, day: ledgersByYarn[y.id]?.find((d) => d.date === lastDate) }));

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

      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          <strong>Gross Profit</strong> below = Revenue − COGS (cost of goods actually <em>sold</em>, at weighted-average
          inventory cost) — not Revenue minus today's production cost. Produced-but-unsold yarn sits in inventory and isn't
          expensed until it sells. This is Gross Profit, not Net Profit (no operating expenses beyond production are deducted).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Yarn / Yarn-Count Profitability</h3>
          <div className="flex gap-1">
            {(['margin', 'profit', 'revenue'] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${sortKey === k ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Sort: {k}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Yarn</th>
                <th className="px-4 py-2 font-medium text-right">Production (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Sales (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Revenue</th>
                <th className="px-4 py-2 font-medium text-right">Cost/kg</th>
                <th className="px-4 py-2 font-medium text-right">Selling Price/kg</th>
                <th className="px-4 py-2 font-medium text-right">Profit/kg</th>
                <th className="px-4 py-2 font-medium text-right">Gross Profit</th>
                <th className="px-4 py-2 font-medium text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ yarn, p }) => (
                <tr key={yarn.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{yarn.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(p.productionKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(p.salesKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(p.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(p.costPerKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(p.sellingPricePerKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(p.profitPerKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">{formatBDT(p.grossProfit)}</td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                      p.marginPct < 0 ? 'text-red-600' : p.marginPct < 0.1 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatPercent(p.marginPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Production vs Inventory vs COGS — {lastDate ? formatDateLabel(lastDate) : ''}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Yarn</th>
                <th className="px-4 py-2 font-medium text-right">Produced Today (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Sold Today (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Closing Inventory (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Closing Inventory Value</th>
                <th className="px-4 py-2 font-medium text-right">COGS Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lastDateLedgers.map(({ yarn, day }) => (
                <tr key={yarn.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{yarn.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(day?.producedKg ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(day?.soldKg ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(day?.closingKg ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(day?.closingValue ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-700">{formatBDT(day?.cogs ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDateLabel(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
