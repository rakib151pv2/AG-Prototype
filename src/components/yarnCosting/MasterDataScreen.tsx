import type { ReactNode } from 'react';
import { COST_RATES, COTTON_LOTS, CUSTOMERS, ESTIMATED_COST_STANDARDS, WASTAGE_STANDARDS, YARNS, landedCostPerKg } from '../../yarnCosting/masterData';
import { EXCHANGE_RATE_HISTORY } from '../../yarnCosting/sampleDailyData';
import { formatBDT, formatDate, formatPercent } from '../../formatters';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export default function MasterDataScreen() {
  const lastRate = EXCHANGE_RATE_HISTORY[EXCHANGE_RATE_HISTORY.length - 1];

  return (
    <div className="space-y-6">
      <Section title="Yarns">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Count</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {YARNS.map((y) => (
              <tr key={y.id}>
                <td className="px-4 py-2.5 font-medium text-slate-700">{y.yarnCode}</td>
                <td className="px-4 py-2.5 text-slate-600">{y.yarnCount}</td>
                <td className="px-4 py-2.5 text-slate-600">{y.yarnType}</td>
                <td className="px-4 py-2.5 text-slate-600">{y.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Cotton Lots &amp; Suppliers">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Lot</th>
              <th className="px-4 py-2 font-medium">Supplier</th>
              <th className="px-4 py-2 font-medium">Origin</th>
              <th className="px-4 py-2 font-medium">LC / PI</th>
              <th className="px-4 py-2 font-medium text-right">Landed Cost/kg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COTTON_LOTS.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2.5 font-medium text-slate-700">{l.lotNumber}</td>
                <td className="px-4 py-2.5 text-slate-600">{l.supplier}</td>
                <td className="px-4 py-2.5 text-slate-600">{l.origin}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400">{l.lcNumber ?? '—'} {l.piNumber ? `/ ${l.piNumber}` : ''}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(landedCostPerKg(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Customers">
        <table className="w-full min-w-[400px] text-sm">
          <tbody className="divide-y divide-slate-100">
            {CUSTOMERS.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 text-slate-700">{c.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Wastage Standards">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Process</th>
              <th className="px-4 py-2 font-medium">Applies To</th>
              <th className="px-4 py-2 font-medium text-right">Standard %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {WASTAGE_STANDARDS.map((w) => (
              <tr key={w.process}>
                <td className="px-4 py-2.5 text-slate-700">{w.process}</td>
                <td className="px-4 py-2.5 text-slate-600">{w.yarnType}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatPercent(w.standardPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Estimated Cost Standards (per kg)">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Yarn</th>
              <th className="px-4 py-2 font-medium text-right">Raw Material</th>
              <th className="px-4 py-2 font-medium text-right">Electricity</th>
              <th className="px-4 py-2 font-medium text-right">Labor</th>
              <th className="px-4 py-2 font-medium text-right">Overhead</th>
              <th className="px-4 py-2 font-medium text-right">Std. Wastage</th>
              <th className="px-4 py-2 font-medium text-right">Std. Efficiency</th>
              <th className="px-4 py-2 font-medium text-right">Recommended Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ESTIMATED_COST_STANDARDS.map((s) => (
              <tr key={s.yarnId}>
                <td className="px-4 py-2.5 font-medium text-slate-700">{YARNS.find((y) => y.id === s.yarnId)?.description}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(s.rawMaterialPerKg)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(s.electricityPerKg)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(s.laborPerKg)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatBDT(s.overheadPerKg)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatPercent(s.standardWastagePct)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatPercent(s.standardEfficiencyPct)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatBDT(s.recommendedSellingPricePerKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Rates &amp; Currency">
        <div className="grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Electricity Tariff</p>
            <p className="font-medium text-slate-700">{formatBDT(COST_RATES.electricityTariffPerKwh)}/kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Labor Rate</p>
            <p className="font-medium text-slate-700">{formatBDT(COST_RATES.laborRatePerHour)}/hour</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current USD/BDT</p>
            <p className="font-medium text-slate-700">{lastRate?.usdToBdt.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">As of</p>
            <p className="font-medium text-slate-700">{lastRate ? formatDate(lastRate.date) : '—'}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
