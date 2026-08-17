import { useMemo, useState } from 'react';
import { AlertTriangle, Banknote, Gauge, Package, Percent, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react';
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyClosing, DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { YARNS } from '../../yarnCosting/masterData';
import {
  buildAllLedgers,
  getDailySummary,
  getRangeSummary,
  getYarnProfitability,
} from '../../yarnCosting/calculations';
import { generateAlerts } from '../../yarnCosting/alerts';
import { formatBDT, formatDate, formatNumber, formatPercent } from '../../formatters';
import { iso } from '../../dateUtil';
import KpiCard from '../KpiCard';
import DateRangeFilter, { resolveDates, type RangePreset } from './shared/DateRangeFilter';

const SERIES_COLORS = { revenue: '#2563eb', cost: '#d97706', profit: '#10b981' };

export default function DashboardScreen({
  records,
  sales,
  closings,
}: {
  records: DailyYarnRecord[];
  sales: DailySalesEntry[];
  closings: DailyClosing[];
}) {
  const [preset, setPreset] = useState<RangePreset>('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const ledgersByYarn = useMemo(() => buildAllLedgers(YARNS, records, sales), [records, sales]);
  const dates = useMemo(() => resolveDates(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const summary = useMemo(() => getRangeSummary(dates, records, sales, ledgersByYarn), [dates, records, sales, ledgersByYarn]);

  const trend = useMemo(
    () =>
      dates.map((d) => {
        const s = getDailySummary(d, records, sales, ledgersByYarn);
        return { date: d, label: formatDate(d), Revenue: s.revenue, Cost: s.cogs, Profit: s.grossProfit };
      }),
    [dates, records, sales, ledgersByYarn]
  );

  const yarnProfitabilities = useMemo(
    () => YARNS.map((y) => getYarnProfitability(y.id, dates, records, sales, ledgersByYarn)),
    [dates, records, sales, ledgersByYarn]
  );
  const sorted = [...yarnProfitabilities].sort((a, b) => b.marginPct - a.marginPct);
  const topYarns = sorted.slice(0, 2);
  const riskYarns = sorted.filter((y) => y.marginPct < 0.1).slice(-2);

  const alerts = useMemo(() => generateAlerts(YARNS, records, sales, closings, iso(0)), [records, sales, closings]);
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').slice(0, 4);

  function yarnName(yarnId: string) {
    return YARNS.find((y) => y.id === yarnId)?.description ?? yarnId;
  }

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Production" value={`${formatNumber(summary.productionKg)} kg`} sub={preset} icon={Package} />
        <KpiCard label="Sales" value={`${formatNumber(summary.salesKg)} kg`} sub={preset} icon={ShoppingCart} />
        <KpiCard label="Revenue" value={formatBDT(summary.revenue)} sub={preset} icon={Banknote} />
        <KpiCard label="Production Cost" value={formatBDT(summary.productionCost)} sub={preset} icon={TrendingDown} />
        <KpiCard label="COGS" value={formatBDT(summary.cogs)} sub="Cost of goods sold" icon={TrendingDown} />
        <KpiCard
          label="Gross Profit"
          value={formatBDT(summary.grossProfit)}
          sub={preset}
          icon={TrendingUp}
          tone={summary.grossProfit < 0 ? 'danger' : 'default'}
        />
        <KpiCard label="Profit/kg" value={formatBDT(summary.profitPerKg)} sub="Per kg sold" icon={TrendingUp} />
        <KpiCard
          label="Gross Margin"
          value={formatPercent(summary.grossMarginPct)}
          sub={preset}
          icon={Percent}
          tone={summary.grossMarginPct < 0 ? 'danger' : summary.grossMarginPct < 0.1 ? 'warning' : 'default'}
        />
        <KpiCard label="Efficiency" value={formatPercent(summary.avgEfficiencyPct)} sub="Avg. across yarns" icon={Gauge} />
        <KpiCard
          label="Wastage"
          value={formatPercent(summary.avgWastagePct)}
          sub="Avg. across yarns"
          icon={AlertTriangle}
          tone={summary.avgWastagePct > 0.15 ? 'warning' : 'default'}
        />
        <KpiCard label="Cost/kg" value={formatBDT(summary.avgCostPerKg)} sub="Production cost" icon={TrendingDown} />
        <KpiCard label="Sales Qty" value={`${formatNumber(summary.salesKg)} kg`} sub={preset} icon={ShoppingCart} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">Revenue vs Cost vs Profit</h3>
        <p className="text-xs text-slate-500">Daily trend across the selected range</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${formatNumber(v / 1_000_000, 1)}M`}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => formatBDT(value)}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Revenue" stroke={SERIES_COLORS.revenue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Cost" stroke={SERIES_COLORS.cost} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Profit" stroke={SERIES_COLORS.profit} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Top Performing Yarns</h3>
          <div className="mt-3 space-y-2">
            {topYarns.map((y) => (
              <div key={y.yarnId} className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{yarnName(y.yarnId)}</span>
                <span className="text-sm font-semibold text-emerald-700">{formatPercent(y.marginPct)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Loss / Risk Area</h3>
          <div className="mt-3 space-y-2">
            {riskYarns.length === 0 && <p className="text-sm text-slate-400">No yarns below target margin.</p>}
            {riskYarns.map((y) => (
              <div
                key={y.yarnId}
                className={`flex items-center justify-between rounded-md px-3 py-2 ${y.marginPct < 0 ? 'bg-red-50' : 'bg-amber-50'}`}
              >
                <span className="text-sm font-medium text-slate-700">{yarnName(y.yarnId)}</span>
                <span className={`text-sm font-semibold ${y.marginPct < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  {formatPercent(y.marginPct)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Management Alerts</h3>
          <div className="mt-3 space-y-2">
            {criticalAlerts.length === 0 && <p className="text-sm text-slate-400">No critical alerts.</p>}
            {criticalAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                <span className="text-xs text-red-700">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
