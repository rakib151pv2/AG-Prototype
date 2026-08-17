import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import type { DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { YARNS, getYarn } from '../../yarnCosting/masterData';
import {
  buildAllLedgers,
  getCostBreakdown,
  getDailySummary,
  getEfficiencyPct,
  getEstimatedTotalPerKg,
  getProcessStages,
  getYarnProfitability,
} from '../../yarnCosting/calculations';
import { formatBDT, formatDate, formatNumber, formatPercent } from '../../formatters';
import DateRangeFilter, { resolveDates, type RangePreset } from './shared/DateRangeFilter';

type ReportId =
  | 'daily-costing'
  | 'daily-profit'
  | 'monthly-profitability'
  | 'product-profitability'
  | 'cost-variance'
  | 'wastage'
  | 'production-efficiency';

const REPORTS: Array<{ id: ReportId; label: string }> = [
  { id: 'daily-costing', label: 'Daily Yarn Costing Report' },
  { id: 'daily-profit', label: 'Daily Profit Report' },
  { id: 'monthly-profitability', label: 'Monthly Profitability Report' },
  { id: 'product-profitability', label: 'Product Profitability Report' },
  { id: 'cost-variance', label: 'Cost Variance Report' },
  { id: 'wastage', label: 'Wastage Report' },
  { id: 'production-efficiency', label: 'Production Efficiency Report' },
];

export default function ReportsScreen({ records, sales }: { records: DailyYarnRecord[]; sales: DailySalesEntry[] }) {
  const [reportId, setReportId] = useState<ReportId>('daily-costing');
  const [preset, setPreset] = useState<RangePreset>('This Week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const dates = useMemo(() => resolveDates(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const ledgersByYarn = useMemo(() => buildAllLedgers(YARNS, records, sales), [records, sales]);

  const rangeRecords = records.filter((r) => dates.includes(r.date));
  const rangeSales = sales.filter((s) => dates.includes(s.date));

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-report { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <select
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700"
          value={reportId}
          onChange={(e) => setReportId(e.target.value as ReportId)}
        >
          {REPORTS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
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
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Printer size={15} /> Print Report
        </button>
      </div>

      <div className="print-report rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-800">{REPORTS.find((r) => r.id === reportId)?.label}</h2>

        {reportId === 'daily-costing' && (
          <ReportTable
            headers={['Date', 'Yarn', 'Production (kg)', 'Raw Material', 'Electricity', 'Labor', 'Overhead', 'Packing', 'Waste Recovery', 'Total Cost', 'Cost/kg']}
            rows={rangeRecords.map((r) => {
              const c = getCostBreakdown(r);
              return [
                formatDate(r.date),
                getYarn(r.yarnId).description,
                formatNumber(r.actualProductionKg),
                formatBDT(c.rawMaterialPerKg),
                formatBDT(c.electricityPerKg),
                formatBDT(c.laborPerKg),
                formatBDT(c.overheadPerKg),
                formatBDT(c.packingPerKg),
                formatBDT(c.wasteRecoveryPerKg),
                formatBDT(c.totalCost),
                formatBDT(c.totalPerKg),
              ];
            })}
          />
        )}

        {reportId === 'daily-profit' && (
          <ReportTable
            headers={['Date', 'Sales (kg)', 'Revenue', 'COGS', 'Gross Profit', 'Margin']}
            rows={dates.map((d) => {
              const s = getDailySummary(d, records, sales, ledgersByYarn);
              return [formatDate(d), formatNumber(s.salesKg), formatBDT(s.revenue), formatBDT(s.cogs), formatBDT(s.grossProfit), formatPercent(s.grossMarginPct)];
            })}
          />
        )}

        {reportId === 'monthly-profitability' && (
          <ReportTable
            headers={['Month', 'Revenue', 'Cost', 'Profit', 'Margin', 'Production (kg)', 'Sales (kg)']}
            rows={Array.from(new Set(dates.map((d) => d.slice(0, 7)))).map((m) => {
              const monthDates = dates.filter((d) => d.startsWith(m));
              const s = getDailySummary(monthDates[monthDates.length - 1] ?? '', records, sales, ledgersByYarn);
              const totals = monthDates.reduce(
                (acc, d) => {
                  const day = getDailySummary(d, records, sales, ledgersByYarn);
                  acc.revenue += day.revenue;
                  acc.cost += day.productionCost;
                  acc.profit += day.grossProfit;
                  acc.production += day.productionKg;
                  acc.sales += day.salesKg;
                  return acc;
                },
                { revenue: 0, cost: 0, profit: 0, production: 0, sales: 0 }
              );
              return [
                m,
                formatBDT(totals.revenue),
                formatBDT(totals.cost),
                formatBDT(totals.profit),
                formatPercent(totals.revenue > 0 ? totals.profit / totals.revenue : 0),
                formatNumber(totals.production),
                formatNumber(totals.sales),
              ];
            })}
          />
        )}

        {reportId === 'product-profitability' && (
          <ReportTable
            headers={['Yarn', 'Production (kg)', 'Sales (kg)', 'Cost/kg', 'Selling Price/kg', 'Profit/kg', 'Margin']}
            rows={YARNS.map((y) => {
              const p = getYarnProfitability(y.id, dates, records, sales, ledgersByYarn);
              return [
                y.description,
                formatNumber(p.productionKg),
                formatNumber(p.salesKg),
                formatBDT(p.costPerKg),
                formatBDT(p.sellingPricePerKg),
                formatBDT(p.profitPerKg),
                formatPercent(p.marginPct),
              ];
            })}
          />
        )}

        {reportId === 'cost-variance' && (
          <ReportTable
            headers={['Yarn', 'Standard Cost/kg', 'Actual Cost/kg', 'Variance', 'Variance %']}
            rows={YARNS.map((y) => {
              const yarnRecords = rangeRecords.filter((r) => r.yarnId === y.id);
              const avgActual = yarnRecords.length ? yarnRecords.reduce((s, r) => s + getCostBreakdown(r).totalPerKg, 0) / yarnRecords.length : 0;
              const std = getEstimatedTotalPerKg(y.id);
              return [y.description, formatBDT(std), formatBDT(avgActual), formatBDT(avgActual - std), formatPercent(std > 0 ? (avgActual - std) / std : 0)];
            })}
          />
        )}

        {reportId === 'wastage' && (
          <ReportTable
            headers={['Yarn', 'Process', 'Standard', 'Actual', 'Variance', 'Waste Value']}
            rows={rangeRecords.flatMap((r) =>
              getProcessStages(r).map((s) => [
                getYarn(r.yarnId).description,
                s.process,
                formatPercent(s.standardPct),
                formatPercent(s.actualPct),
                formatPercent(s.variancePct),
                formatBDT(s.wasteValuePerKgYarn * r.actualProductionKg),
              ])
            )}
          />
        )}

        {reportId === 'production-efficiency' && (
          <ReportTable
            headers={['Date', 'Yarn', 'Target (kg)', 'Actual (kg)', 'Achievement', 'Downtime (h)', 'Efficiency']}
            rows={rangeRecords.map((r) => [
              formatDate(r.date),
              getYarn(r.yarnId).description,
              formatNumber(r.plannedProductionKg),
              formatNumber(r.actualProductionKg),
              formatPercent(r.plannedProductionKg > 0 ? r.actualProductionKg / r.plannedProductionKg : 0),
              r.downtimeHours.toFixed(1),
              formatPercent(getEfficiencyPct(r)),
            ])}
          />
        )}
      </div>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-2 py-1.5 ${j === 0 ? 'text-slate-700' : 'text-right tabular-nums text-slate-600'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-2 py-6 text-center text-slate-400">
                No data in this range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
