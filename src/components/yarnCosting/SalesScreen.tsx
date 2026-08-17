import { useMemo, useState } from 'react';
import type { DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { CUSTOMERS, getCustomer, getYarn, YARNS } from '../../yarnCosting/masterData';
import { buildAllLedgers, getCustomerProfitability, getSaleRevenue } from '../../yarnCosting/calculations';
import { formatBDT, formatDate, formatNumber, formatPercent } from '../../formatters';
import DateRangeFilter, { resolveDates, type RangePreset } from './shared/DateRangeFilter';

export default function SalesScreen({ records, sales }: { records: DailyYarnRecord[]; sales: DailySalesEntry[] }) {
  const [preset, setPreset] = useState<RangePreset>('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const dates = useMemo(() => resolveDates(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const ledgersByYarn = useMemo(() => buildAllLedgers(YARNS, records, sales), [records, sales]);
  const rangeSales = sales.filter((s) => dates.includes(s.date)).sort((a, b) => b.date.localeCompare(a.date));

  const customerRows = CUSTOMERS.map((c) => getCustomerProfitability(c.id, dates, records, sales, ledgersByYarn)).sort(
    (a, b) => b.revenue - a.revenue
  );

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
          <h3 className="text-sm font-semibold text-slate-700">Customer-wise Profitability</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium text-right">Sales Qty (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Revenue</th>
                <th className="px-4 py-2 font-medium text-right">Avg. Selling Price</th>
                <th className="px-4 py-2 font-medium text-right">COGS</th>
                <th className="px-4 py-2 font-medium text-right">Gross Profit</th>
                <th className="px-4 py-2 font-medium text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerRows.map((r) => (
                <tr key={r.customerId}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{getCustomer(r.customerId).name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(r.salesKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(r.avgSellingPricePerKg)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(r.cogs)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-700">{formatBDT(r.grossProfit)}</td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                      r.marginPct < 0 ? 'text-red-600' : r.marginPct < 0.1 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatPercent(r.marginPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Daily Sales Entries</h3>
          <p className="text-xs text-slate-500">{rangeSales.length} entries in range</p>
        </div>
        <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Yarn</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Sales Order</th>
                <th className="px-4 py-2 font-medium text-right">Qty (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Price/kg</th>
                <th className="px-4 py-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rangeSales.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-slate-600">{formatDate(s.date)}</td>
                  <td className="px-4 py-2 text-slate-700">{getYarn(s.yarnId).description}</td>
                  <td className="px-4 py-2 text-slate-600">{getCustomer(s.customerId).name}</td>
                  <td className="px-4 py-2 text-xs text-slate-400">{s.salesOrder}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatNumber(s.quantityKg)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatBDT(s.sellingPricePerKg)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-700">{formatBDT(getSaleRevenue(s))}</td>
                </tr>
              ))}
              {rangeSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    No sales entries in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
