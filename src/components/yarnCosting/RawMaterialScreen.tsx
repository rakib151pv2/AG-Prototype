import { useState } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COTTON_LOTS, YARNS } from '../../yarnCosting/masterData';
import { landedCostPerKg } from '../../yarnCosting/masterData';
import { EXCHANGE_RATE_HISTORY } from '../../yarnCosting/sampleDailyData';
import { getWeightedFiberCostPerKg } from '../../yarnCosting/calculations';
import type { DailyYarnRecord } from '../../yarnCosting/types';
import { formatBDT, formatDate } from '../../formatters';

export default function RawMaterialScreen({ records }: { records: DailyYarnRecord[] }) {
  const [selectedLotId, setSelectedLotId] = useState(COTTON_LOTS[0].id);
  const lot = COTTON_LOTS.find((l) => l.id === selectedLotId) ?? COTTON_LOTS[0];

  const priceIncreasePct = 0.05;
  const priorPrice = lot.purchasePricePerKg;
  const newPrice = priorPrice * (1 + priceIncreasePct);
  const priorLanded = landedCostPerKg(lot);
  const newLanded = landedCostPerKg({ ...lot, purchasePricePerKg: newPrice });

  const fxHistory = EXCHANGE_RATE_HISTORY.map((p) => ({ label: formatDate(p.date), rate: p.usdToBdt }));
  const currentRate = EXCHANGE_RATE_HISTORY[EXCHANGE_RATE_HISTORY.length - 1]?.usdToBdt ?? 119.5;
  const priorRate = EXCHANGE_RATE_HISTORY[0]?.usdToBdt ?? 116;
  const [scenarioRate, setScenarioRate] = useState(currentRate);

  const usdLots = COTTON_LOTS.filter((l) => l.currency === 'USD');
  const currentLandedAvg = usdLots.reduce((s, l) => s + landedCostPerKg(l), 0) / usdLots.length;
  const scenarioLandedAvg =
    usdLots.reduce((s, l) => s + landedCostPerKg({ ...l, exchangeRateToBDT: scenarioRate }), 0) / usdLots.length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Cotton Lots &amp; Landed Cost</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Lot</th>
                <th className="px-4 py-2 font-medium">Origin</th>
                <th className="px-4 py-2 font-medium text-right">Purchase Price</th>
                <th className="px-4 py-2 font-medium text-right">Freight+Ins.+C&amp;F</th>
                <th className="px-4 py-2 font-medium text-right">Port/Customs/Bank/Other</th>
                <th className="px-4 py-2 font-medium text-right">Landed Cost/kg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COTTON_LOTS.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {l.lotNumber}
                    <p className="text-xs font-normal text-slate-400">{l.supplier}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{l.origin}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {l.currency === 'USD' ? `$${l.purchasePricePerKg.toFixed(2)}` : formatBDT(l.purchasePricePerKg)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {formatBDT(l.freightPerKg + l.insurancePerKg + l.cnfPerKg)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {formatBDT(l.portChargesPerKg + l.customsDutyPerKg + l.bankChargesPerKg + l.transportPerKg + l.otherPerKg)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{formatBDT(landedCostPerKg(l))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Weighted Raw Material Cost by Yarn</h3>
          <p className="text-xs text-slate-500">Blend recipe × each lot's landed cost — never hardcoded</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Yarn</th>
                <th className="px-4 py-2 font-medium">Blend</th>
                <th className="px-4 py-2 font-medium text-right">Weighted Cost/kg (fiber)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {YARNS.map((yarn) => {
                const record = records.find((r) => r.yarnId === yarn.id);
                if (!record) return null;
                return (
                  <tr key={yarn.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{yarn.description}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {record.cottonBlend
                        .map((s) => `${COTTON_LOTS.find((l) => l.id === s.cottonLotId)?.origin} ${s.blendPct}%`)
                        .join(' · ')}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                      {formatBDT(getWeightedFiberCostPerKg(record))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Raw Material Price Impact</h3>
          <select
            className="mt-2 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700"
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
          >
            {COTTON_LOTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.lotNumber} ({l.origin})
              </option>
            ))}
          </select>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Price</span>
              <span className="tabular-nums text-slate-700">
                {lot.currency === 'USD' ? `$${priorPrice.toFixed(2)}` : formatBDT(priorPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">If price rises {formatPercentInline(priceIncreasePct)}</span>
              <span className="tabular-nums text-slate-700">
                {lot.currency === 'USD' ? `$${newPrice.toFixed(2)}` : formatBDT(newPrice)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5">
              <span className="text-slate-600">Landed Cost Impact</span>
              <span className="tabular-nums font-semibold text-red-600">+{formatBDT(newLanded - priorLanded)}/kg</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Exchange Rate Impact (USD/BDT)</h3>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fxHistory} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>45 days ago: {priorRate.toFixed(2)}</span>
            <span>Current: {currentRate.toFixed(2)}</span>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <label className="mb-1 block text-xs font-medium text-slate-500">Scenario: what if USD/BDT becomes…</label>
            <input
              type="range"
              min={currentRate - 5}
              max={currentRate + 8}
              step={0.5}
              value={scenarioRate}
              onChange={(e) => setScenarioRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="tabular-nums font-medium text-slate-700">{scenarioRate.toFixed(2)}</span>
              <span className={`tabular-nums font-semibold ${scenarioLandedAvg > currentLandedAvg ? 'text-red-600' : 'text-emerald-600'}`}>
                {scenarioLandedAvg >= currentLandedAvg ? '+' : ''}
                {formatBDT(scenarioLandedAvg - currentLandedAvg)}/kg avg. landed cost
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPercentInline(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}
