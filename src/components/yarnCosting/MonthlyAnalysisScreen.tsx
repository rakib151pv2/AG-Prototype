import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { YARNS } from '../../yarnCosting/masterData';
import { buildAllLedgers, getDailySummary, getRangeSummary } from '../../yarnCosting/calculations';
import { allHistoryDates } from '../../yarnCosting/sampleDailyData';
import { formatBDT, formatDate, formatNumber, formatPercent } from '../../formatters';
import KpiCard from '../KpiCard';
import { Banknote, Gauge, Package, Percent, ShoppingCart, TrendingUp } from 'lucide-react';

export default function MonthlyAnalysisScreen({ records, sales }: { records: DailyYarnRecord[]; sales: DailySalesEntry[] }) {
  const allDates = allHistoryDates();
  const months = useMemo(() => Array.from(new Set(allDates.map((d) => d.slice(0, 7)))).sort(), [allDates]);
  const [month, setMonth] = useState(months[months.length - 1] ?? '');

  const ledgersByYarn = useMemo(() => buildAllLedgers(YARNS, records, sales), [records, sales]);
  const monthDates = allDates.filter((d) => d.startsWith(month));
  const summary = useMemo(() => getRangeSummary(monthDates, records, sales, ledgersByYarn), [monthDates, records, sales, ledgersByYarn]);

  const trend = monthDates.map((d) => {
    const s = getDailySummary(d, records, sales, ledgersByYarn);
    return { label: formatDate(d).slice(0, 6), profit: s.grossProfit };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
        <select className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700" value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(`${m}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Production" value={`${formatNumber(summary.productionKg)} kg`} sub={month} icon={Package} />
        <KpiCard label="Total Sales" value={`${formatNumber(summary.salesKg)} kg`} sub={month} icon={ShoppingCart} />
        <KpiCard label="Total Revenue" value={formatBDT(summary.revenue)} sub={month} icon={Banknote} />
        <KpiCard label="Total Production Cost" value={formatBDT(summary.productionCost)} sub={month} icon={Package} />
        <KpiCard label="Total COGS" value={formatBDT(summary.cogs)} sub={month} icon={Package} />
        <KpiCard
          label="Gross Profit"
          value={formatBDT(summary.grossProfit)}
          sub={month}
          icon={TrendingUp}
          tone={summary.grossProfit < 0 ? 'danger' : 'default'}
        />
        <KpiCard label="Avg. Cost/kg" value={formatBDT(summary.avgCostPerKg)} sub="Production" icon={Package} />
        <KpiCard label="Avg. Selling Price/kg" value={formatBDT(summary.salesKg > 0 ? summary.revenue / summary.salesKg : 0)} sub={month} icon={Banknote} />
        <KpiCard label="Avg. Profit/kg" value={formatBDT(summary.profitPerKg)} sub={month} icon={TrendingUp} />
        <KpiCard label="Gross Margin" value={formatPercent(summary.grossMarginPct)} sub={month} icon={Percent} />
        <KpiCard label="Avg. Efficiency" value={formatPercent(summary.avgEfficiencyPct)} sub={month} icon={Gauge} />
        <KpiCard label="Avg. Wastage" value={formatPercent(summary.avgWastagePct)} sub={month} icon={Gauge} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">Monthly Profit Trend</h3>
        <p className="text-xs text-slate-500">Daily gross profit across {month}</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} interval={2} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${formatNumber(v / 1000)}K`}
                width={44}
              />
              <Tooltip formatter={(v: number) => formatBDT(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="profit" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
