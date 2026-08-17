import { useEffect, useState } from 'react';
import { Printer, Receipt } from 'lucide-react';
import type { LC } from '../../types';
import {
  chargeBaseBDT,
  computeChargeTotals,
  defaultChargeSchedule,
  VAT_RATE,
  type ChargeLineItem,
} from '../../bankCharges';
import { formatBDT, formatDate, formatFC, formatPercent } from '../../formatters';

export default function BankChargePrep({ lcs }: { lcs: LC[] }) {
  const [selectedId, setSelectedId] = useState(lcs[0]?.id ?? '');
  const [items, setItems] = useState<ChargeLineItem[]>(defaultChargeSchedule());

  const lc = lcs.find((l) => l.id === selectedId) ?? lcs[0];

  useEffect(() => {
    setItems(defaultChargeSchedule());
  }, [selectedId]);

  if (!lc) {
    return <p className="text-sm text-slate-400">No LCs available to prepare charges for.</p>;
  }

  const baseBDT = chargeBaseBDT(lc);
  const { lines, subtotal, vat, total } = computeChargeTotals(items, baseBDT);

  function updateItem(id: string, patch: Partial<ChargeLineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-voucher { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Select L/C</h3>
          <select
            className="mt-2 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {lcs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.lcNumber} — {l.beneficiary}
              </option>
            ))}
          </select>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Issuing Bank</dt>
              <dd className="font-medium text-slate-700">{lc.issuingBank}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Advising Bank</dt>
              <dd className="font-medium text-slate-700">{lc.advisingBank}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">LC Value</dt>
              <dd className="font-medium text-slate-700">{formatFC(lc.lcValue, lc.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Charge Basis (BDT)</dt>
              <dd className="font-medium text-slate-700">{formatBDT(baseBDT)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Charge Schedule</h3>
          <p className="text-xs text-slate-500">Editable rates/amounts — recomputes live.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-1.5 font-medium">Item</th>
                <th className="pb-1.5 font-medium text-right">Rate / Amount</th>
                <th className="pb-1.5 font-medium text-right">VAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1.5 text-slate-600">{item.label}</td>
                  <td className="py-1.5 text-right">
                    {item.kind === 'percent' ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-16 rounded-md border border-slate-300 px-1.5 py-1 text-right text-xs"
                          value={(item.rate * 100).toFixed(2)}
                          onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) / 100 })}
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-slate-400">BDT</span>
                        <input
                          type="number"
                          step="1"
                          className="w-20 rounded-md border border-slate-300 px-1.5 py-1 text-right text-xs"
                          value={item.flatAmountBDT}
                          onChange={(e) => updateItem(item.id, { flatAmountBDT: Number(e.target.value) })}
                        />
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 text-right text-xs text-slate-400">{item.vatApplicable ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="print-voucher rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-slate-400" />
              <h2 className="text-base font-semibold text-slate-800">Bank Charge Voucher</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Ahmed Group · Accounts &amp; Finance</p>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Printer size={15} />
            Print Voucher
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">L/C No.</dt>
            <dd className="font-medium text-slate-700">{lc.lcNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Party Name</dt>
            <dd className="font-medium text-slate-700">{lc.beneficiary}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Unit</dt>
            <dd className="font-medium text-slate-700">{lc.unit}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Date</dt>
            <dd className="font-medium text-slate-700">{formatDate(new Date().toISOString().slice(0, 10))}</dd>
          </div>
        </dl>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="py-1.5 font-medium">Charge Item</th>
              <th className="py-1.5 font-medium text-right">Basis</th>
              <th className="py-1.5 font-medium text-right">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map(({ item, amountBDT }) => (
              <tr key={item.id}>
                <td className="py-1.5 text-slate-600">{item.label}</td>
                <td className="py-1.5 text-right text-xs text-slate-500">
                  {item.kind === 'percent' ? `${formatPercent(item.rate)} of base` : 'Flat'}
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-700">{formatBDT(amountBDT)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatBDT(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>VAT ({formatPercent(VAT_RATE)} on commission items)</span>
            <span className="tabular-nums">{formatBDT(vat)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-800">
            <span>Total Charges</span>
            <span className="tabular-nums">{formatBDT(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
