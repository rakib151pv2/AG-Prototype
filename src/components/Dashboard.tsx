import { useMemo } from 'react';
import { Wallet, AlertTriangle, TrendingDown, Percent, CalendarClock } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LC, LCStatus } from '../types';
import {
  getAccruedInterestBDT,
  getDaysToMaturity,
  getExposureBDT,
  getOutstandingBDT,
  getStatus,
} from '../selectors';
import { formatBDT, formatDate, formatNumber } from '../formatters';
import KpiCard from './KpiCard';
import StatusBadge from './StatusBadge';

const STATUS_ORDER: LCStatus[] = ['Open', 'Due Soon', 'Overdue', 'Realized'];
const STATUS_HEX: Record<LCStatus, string> = {
  Open: '#94a3b8',
  'Due Soon': '#f59e0b',
  Overdue: '#ef4444',
  Realized: '#10b981',
};

export default function Dashboard({ lcs }: { lcs: LC[] }) {
  const today = useMemo(() => new Date(), []);

  const rows = useMemo(
    () =>
      lcs.map((lc) => ({
        lc,
        status: getStatus(lc, today),
        outstandingBDT: getOutstandingBDT(lc),
        exposureBDT: getExposureBDT(lc),
        interestBDT: getAccruedInterestBDT(lc, today),
        daysToMaturity: getDaysToMaturity(lc, today),
      })),
    [lcs, today]
  );

  const totalExposure = rows.reduce((s, r) => s + r.exposureBDT, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstandingBDT, 0);
  const countOverdue = rows.filter((r) => r.status === 'Overdue').length;
  const totalInterest = rows.reduce((s, r) => s + r.interestBDT, 0);

  const chartData = STATUS_ORDER.map((status) => ({
    status,
    exposureBDT: rows.filter((r) => r.status === status).reduce((s, r) => s + r.exposureBDT, 0),
    count: rows.filter((r) => r.status === status).length,
  }));

  const upcoming = rows
    .filter((r) => r.status !== 'Realized' && r.daysToMaturity >= 0 && r.daysToMaturity <= 30)
    .sort((a, b) => a.daysToMaturity - b.daysToMaturity);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total LC Exposure"
          value={formatBDT(totalExposure)}
          sub={`${lcs.length} active LCs across ${new Set(lcs.map((l) => l.unit)).size} units`}
          icon={Wallet}
        />
        <KpiCard
          label="Total Outstanding"
          value={formatBDT(totalOutstanding)}
          sub="Yet to be realized"
          icon={TrendingDown}
        />
        <KpiCard
          label="Overdue LCs"
          value={formatNumber(countOverdue)}
          sub="Require immediate follow-up"
          icon={AlertTriangle}
          tone={countOverdue > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="Accrued Interest"
          value={formatBDT(totalInterest)}
          sub="12% p.a. on overdue outstanding"
          icon={Percent}
          tone={totalInterest > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-700">Exposure by Status</h3>
          <p className="text-xs text-slate-500">Total LC value (BDT) grouped by current status</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${formatNumber(v / 1_000_000, 1)}M`}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => [formatBDT(value), 'Exposure']}
                  labelFormatter={(label: string) => label}
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="exposureBDT" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {chartData.map((d) => (
                    <Cell key={d.status} fill={STATUS_HEX[d.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
                {s} ({chartData.find((c) => c.status === s)?.count ?? 0})
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Maturities — Next 30 Days</h3>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {upcoming.length === 0 && (
              <p className="py-4 text-sm text-slate-400">No maturities in the next 30 days.</p>
            )}
            {upcoming.map((r) => (
              <div
                key={r.lc.id}
                className={`flex items-center justify-between gap-3 py-2.5 ${
                  r.status === 'Due Soon' ? 'bg-amber-50/60 -mx-4 px-4' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{r.lc.lcNumber}</p>
                  <p className="truncate text-xs text-slate-500">{r.lc.beneficiary}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-500">{formatDate(r.lc.maturityDate)}</p>
                  <p className="text-xs font-medium text-slate-600">
                    {r.daysToMaturity === 0 ? 'Today' : `in ${r.daysToMaturity}d`}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
