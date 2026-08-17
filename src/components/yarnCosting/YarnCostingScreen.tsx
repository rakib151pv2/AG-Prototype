import { useMemo, useState } from 'react';
import type { DailySalesEntry, DailyYarnRecord } from '../../yarnCosting/types';
import { getEstimatedCostStandard, YARNS } from '../../yarnCosting/masterData';
import { getCostBreakdown, getSalesForDay, NEUTRAL_SCENARIO, runScenario, type ScenarioInputs } from '../../yarnCosting/calculations';
import { allHistoryDates, yesterdayIso } from '../../yarnCosting/sampleDailyData';
import { formatBDT, formatDate, formatPercent } from '../../formatters';

const inputClass = 'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700';

export default function YarnCostingScreen({ records, sales }: { records: DailyYarnRecord[]; sales: DailySalesEntry[] }) {
  const dates = useMemo(() => allHistoryDates(), []);
  const [yarnId, setYarnId] = useState(YARNS[0].id);
  const [date, setDate] = useState(yesterdayIso());
  const [displayMode, setDisplayMode] = useState<'perKg' | 'pct'>('perKg');
  const [scenario, setScenario] = useState<ScenarioInputs>(NEUTRAL_SCENARIO);

  const record = records.find((r) => r.date === date && r.yarnId === yarnId);
  const std = getEstimatedCostStandard(yarnId);
  const daySales = getSalesForDay(sales, date, yarnId);
  const avgSellingPrice = daySales.length
    ? daySales.reduce((s, e) => s + e.sellingPricePerKg * e.quantityKg, 0) / daySales.reduce((s, e) => s + e.quantityKg, 0)
    : std.recommendedSellingPricePerKg;

  if (!record) {
    return <p className="text-sm text-slate-400">No production record for this yarn on this date.</p>;
  }

  const cost = getCostBreakdown(record);
  const components = [
    { label: 'Raw Material', value: cost.rawMaterialPerKg },
    { label: 'Electricity', value: cost.electricityPerKg },
    { label: 'Labor', value: cost.laborPerKg },
    { label: 'Maintenance', value: cost.maintenancePerKg },
    { label: 'Depreciation', value: cost.depreciationPerKg },
    { label: 'Overhead', value: cost.overheadPerKg },
    { label: 'Packing', value: cost.packingPerKg },
  ].sort((a, b) => b.value - a.value);
  const componentTotal = components.reduce((s, c) => s + c.value, 0);
  const maxComponent = Math.max(...components.map((c) => c.value));

  const waterfallSteps = [
    { label: 'Selling Price', delta: avgSellingPrice },
    { label: 'Raw Material', delta: -cost.rawMaterialPerKg },
    { label: 'Electricity', delta: -cost.electricityPerKg },
    { label: 'Labor', delta: -cost.laborPerKg },
    { label: 'Maintenance', delta: -cost.maintenancePerKg },
    { label: 'Depreciation', delta: -cost.depreciationPerKg },
    { label: 'Overhead', delta: -cost.overheadPerKg },
    { label: 'Packing', delta: -cost.packingPerKg },
    { label: 'Waste Recovery', delta: cost.wasteRecoveryPerKg },
  ];
  let running = 0;
  const waterfallRows = waterfallSteps.map((step) => {
    running += step.delta;
    return { ...step, runningTotal: running };
  });

  const scenarioResult = runScenario(record, avgSellingPrice, scenario);
  const monthlyKgEstimate = record.actualProductionKg * 26; // rough monthly volume for impact framing
  const monthlyImpact = (scenarioResult.scenarioProfitPerKg - scenarioResult.baselineProfitPerKg) * monthlyKgEstimate;

  function setScenarioField<K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) {
    setScenario((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Yarn</label>
          <select className={inputClass} value={yarnId} onChange={(e) => setYarnId(e.target.value)}>
            {YARNS.map((y) => (
              <option key={y.id} value={y.id}>
                {y.description}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
          <select className={inputClass} value={date} onChange={(e) => setDate(e.target.value)}>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Cost Composition</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setDisplayMode('perKg')}
                className={`rounded-md px-2 py-1 text-xs font-medium ${displayMode === 'perKg' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Per kg
              </button>
              <button
                onClick={() => setDisplayMode('pct')}
                className={`rounded-md px-2 py-1 text-xs font-medium ${displayMode === 'pct' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                % of Total
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {components.map((c) => (
              <div key={c.label}>
                <div className="mb-0.5 flex items-center justify-between text-xs text-slate-600">
                  <span>{c.label}</span>
                  <span className="tabular-nums font-medium text-slate-700">
                    {displayMode === 'perKg' ? formatBDT(c.value) : formatPercent(c.value / componentTotal)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${maxComponent > 0 ? (c.value / maxComponent) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold text-slate-800">
            <span>Total Cost/kg</span>
            <span className="tabular-nums">{formatBDT(cost.totalPerKg)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Profitability Waterfall</h3>
          <p className="text-xs text-slate-500">Selling price to profit/kg, step by step</p>
          <div className="mt-3 space-y-1.5">
            {waterfallRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className={`tabular-nums ${row.delta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {row.delta >= 0 ? '+' : ''}
                    {formatBDT(row.delta)}
                  </span>
                  <span className="w-20 text-right tabular-nums text-xs text-slate-400">{formatBDT(row.runningTotal)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-800">
              <span>Profit/kg</span>
              <span className={`tabular-nums ${running < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatBDT(running)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">Scenario / What-if Analysis</h3>
        <p className="text-xs text-slate-500">Adjust the levers below to see the projected impact on cost, profit, and margin</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScenarioSlider
            label="Cotton Price"
            value={scenario.cottonPricePctChange}
            onChange={(v) => setScenarioField('cottonPricePctChange', v)}
          />
          <ScenarioSlider
            label="USD/BDT Exchange Rate"
            value={scenario.exchangeRatePctChange}
            onChange={(v) => setScenarioField('exchangeRatePctChange', v)}
          />
          <ScenarioSlider
            label="Electricity Tariff"
            value={scenario.electricityTariffPctChange}
            onChange={(v) => setScenarioField('electricityTariffPctChange', v)}
          />
          <ScenarioSlider label="Labor Cost" value={scenario.laborCostPctChange} onChange={(v) => setScenarioField('laborCostPctChange', v)} />
          <ScenarioSlider label="Overhead" value={scenario.overheadPctChange} onChange={(v) => setScenarioField('overheadPctChange', v)} />
          <ScenarioSlider
            label="Selling Price"
            value={scenario.sellingPricePctChange}
            onChange={(v) => setScenarioField('sellingPricePctChange', v)}
          />
          <ScenarioSlider
            label="Wastage (pp)"
            value={scenario.wastagePctChangeAbs}
            onChange={(v) => setScenarioField('wastagePctChangeAbs', v)}
            asPoints
          />
          <ScenarioSlider
            label="Production Efficiency"
            value={scenario.efficiencyPctChangeAbs}
            onChange={(v) => setScenarioField('efficiencyPctChangeAbs', v)}
            asPoints
          />
        </div>

        <button
          onClick={() => setScenario(NEUTRAL_SCENARIO)}
          className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Reset scenario
        </button>

        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
          <ScenarioResultCell label="New Cost/kg" baseline={scenarioResult.baselineCostPerKg} scenario={scenarioResult.scenarioCostPerKg} />
          <ScenarioResultCell
            label="New Selling Price"
            baseline={scenarioResult.baselineSellingPricePerKg}
            scenario={scenarioResult.scenarioSellingPricePerKg}
          />
          <ScenarioResultCell label="New Profit/kg" baseline={scenarioResult.baselineProfitPerKg} scenario={scenarioResult.scenarioProfitPerKg} />
          <div>
            <p className="text-xs text-slate-500">New Margin %</p>
            <p className="text-lg font-semibold text-slate-800">{formatPercent(scenarioResult.scenarioMarginPct)}</p>
            <p className="text-xs text-slate-400">was {formatPercent(scenarioResult.baselineMarginPct)}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Estimated Monthly Profit Impact (≈26 production days)</span>
            <span className={`font-semibold tabular-nums ${monthlyImpact < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {monthlyImpact >= 0 ? '+' : ''}
              {formatBDT(monthlyImpact)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioSlider({
  label,
  value,
  onChange,
  asPoints,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  asPoints?: boolean;
}) {
  const displayValue = asPoints ? `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}pp` : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(0)}%`;
  const min = asPoints ? -0.05 : -0.3;
  const max = asPoints ? 0.05 : 0.3;
  const step = asPoints ? 0.005 : 0.01;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="tabular-nums text-slate-700">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function ScenarioResultCell({ label, baseline, scenario }: { label: string; baseline: number; scenario: number }) {
  const changed = Math.abs(scenario - baseline) > 0.01;
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${changed ? 'text-slate-800' : 'text-slate-700'}`}>{formatBDT(scenario)}</p>
      {changed && <p className="text-xs text-slate-400">was {formatBDT(baseline)}</p>}
    </div>
  );
}
