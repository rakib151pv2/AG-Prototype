import { Fragment, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { DailyYarnRecord } from '../../yarnCosting/types';
import { COTTON_LOTS, getEstimatedCostStandard, YARNS } from '../../yarnCosting/masterData';
import { getEstimatedVsActual, getWeightedFiberCostPerKg, getRawMaterialInputPerKgYarn } from '../../yarnCosting/calculations';
import { allHistoryDates, yesterdayIso } from '../../yarnCosting/sampleDailyData';
import { formatBDT, formatDate } from '../../formatters';
import VarianceCell from './shared/VarianceCell';

export default function EstimatedVsActualScreen({ records }: { records: DailyYarnRecord[] }) {
  const dates = allHistoryDates();
  const [yarnId, setYarnId] = useState(YARNS[0].id);
  const [date, setDate] = useState(yesterdayIso());
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const record = records.find((r) => r.date === date && r.yarnId === yarnId);
  const inputClass = 'rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700';

  if (!record) return <p className="text-sm text-slate-400">No record for this selection.</p>;

  const variance = getEstimatedVsActual(record);
  const estimatedTotal = variance.reduce((s, v) => s + v.estimated, 0);
  const actualTotal = variance.reduce((s, v) => s + v.actual, 0);
  const totalVariance = actualTotal - estimatedTotal;

  const std = getEstimatedCostStandard(yarnId);
  const fiberCostPerKg = getWeightedFiberCostPerKg(record);
  const inputPerKg = getRawMaterialInputPerKgYarn(record);
  const estimatedInputPerKg = 1 / (1 - std.standardWastagePct);
  const wastageEffect = fiberCostPerKg * (inputPerKg - estimatedInputPerKg);
  const priceEffect = record.cottonBlend.reduce((sum, share) => {
    const lot = COTTON_LOTS.find((l) => l.id === share.cottonLotId);
    return lot ? sum + (share.blendPct / 100) * (landedCostOf(lot) - referenceLandedCostOf(lot)) : sum;
  }, 0) * estimatedInputPerKg;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Yarn</label>
          <select className={inputClass} value={yarnId} onChange={(e) => { setYarnId(e.target.value); setDrillDown(null); }}>
            {YARNS.map((y) => (
              <option key={y.id} value={y.id}>
                {y.description}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
          <select className={inputClass} value={date} onChange={(e) => { setDate(e.target.value); setDrillDown(null); }}>
            {dates
              .slice()
              .reverse()
              .map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Estimated vs Actual Cost/kg</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Component</th>
              <th className="px-4 py-2 font-medium text-right">Estimated/kg</th>
              <th className="px-4 py-2 font-medium text-right">Actual/kg</th>
              <th className="px-4 py-2 font-medium text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variance.map((v) => (
              <Fragment key={v.label}>
                <tr
                  className={v.label === 'Raw Material' ? 'cursor-pointer hover:bg-slate-50' : ''}
                  onClick={() => v.label === 'Raw Material' && setDrillDown(drillDown === v.label ? null : v.label)}
                >
                  <td className="px-4 py-2.5 text-slate-700">
                    <span className="flex items-center gap-1">
                      {v.label === 'Raw Material' && (
                        <ChevronRight size={13} className={`text-slate-400 transition ${drillDown === v.label ? 'rotate-90' : ''}`} />
                      )}
                      {v.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatBDT(v.estimated)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(v.actual)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <VarianceCell value={v.variance} favorableIsNegative={v.label !== 'Waste Recovery'} format={formatBDT} />
                  </td>
                </tr>
                {v.label === 'Raw Material' && drillDown === 'Raw Material' && (
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-3">
                      <p className="mb-2 text-xs font-medium text-slate-500">Raw Material variance breakdown</p>
                      <div className="space-y-1 pl-5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cotton price / exchange-rate effect</span>
                          <VarianceCell value={priceEffect} favorableIsNegative format={formatBDT} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Wastage effect (input ratio vs standard)</span>
                          <VarianceCell value={wastageEffect} favorableIsNegative format={formatBDT} />
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 font-medium">
                          <span className="text-slate-700">Total Raw Material Variance</span>
                          <VarianceCell value={v.variance} favorableIsNegative format={formatBDT} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            <tr className="border-t-2 border-slate-200 font-semibold">
              <td className="px-4 py-2.5 text-slate-800">Total</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(estimatedTotal)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{formatBDT(actualTotal)}</td>
              <td className="px-4 py-2.5 text-right">
                <VarianceCell value={totalVariance} favorableIsNegative format={formatBDT} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function landedCostOf(lot: (typeof COTTON_LOTS)[number]): number {
  const base = lot.currency === 'USD' ? lot.purchasePricePerKg * lot.exchangeRateToBDT : lot.purchasePricePerKg;
  return base + lot.freightPerKg + lot.insurancePerKg + lot.cnfPerKg + lot.portChargesPerKg + lot.customsDutyPerKg + lot.bankChargesPerKg + lot.transportPerKg + lot.otherPerKg;
}

// A stable "reference" landed cost (10% below current) stands in for the price
// standard was originally set against, so the drill-down can attribute variance
// to price movement vs wastage movement separately.
function referenceLandedCostOf(lot: (typeof COTTON_LOTS)[number]): number {
  return landedCostOf(lot) * 0.93;
}
