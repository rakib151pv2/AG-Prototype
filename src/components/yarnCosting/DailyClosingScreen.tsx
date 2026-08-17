import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Plus, Trash2 } from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { DailyClosing, DailyClosingChecklist, DailySalesEntry, DailyYarnRecord, DowntimeReason, Role } from '../../yarnCosting/types';
import { CUSTOMERS, YARNS, getYarn } from '../../yarnCosting/masterData';
import { getCostBreakdown, getEfficiencyPct, getOverallWastagePct, getSaleRevenue } from '../../yarnCosting/calculations';
import { yesterdayIso } from '../../yarnCosting/sampleDailyData';
import { formatBDT, formatDate, formatNumber, formatPercent } from '../../formatters';

const DOWNTIME_REASONS: DowntimeReason[] = [
  'Machine Breakdown',
  'Power Failure',
  'Raw Material Shortage',
  'Labor Shortage',
  'Maintenance',
  'Quality Issue',
  'Other',
];

const inputClass = 'w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-slate-500 focus:outline-none';

function nowIso(): string {
  return new Date().toISOString();
}

const CHECKLIST_LABELS: Record<keyof DailyClosingChecklist, string> = {
  productionEntered: 'Production entered',
  rawMaterialEntered: 'Raw material consumption entered',
  wastageEntered: 'Wastage entered',
  electricityEntered: 'Electricity entered',
  laborEntered: 'Labor entered',
  machineHoursEntered: 'Machine hours entered',
  salesEntered: 'Sales entered',
  finishedGoodsChecked: 'Finished goods checked',
  costCalculated: 'Cost calculated',
  varianceReviewed: 'Variance reviewed',
  managementApproval: 'Management approval',
};

const MANUAL_CHECKLIST_KEYS: Array<keyof DailyClosingChecklist> = [
  'finishedGoodsChecked',
  'costCalculated',
  'varianceReviewed',
  'managementApproval',
];
const AUTO_CHECKLIST_KEYS: Array<keyof DailyClosingChecklist> = [
  'productionEntered',
  'rawMaterialEntered',
  'wastageEntered',
  'electricityEntered',
  'laborEntered',
  'machineHoursEntered',
  'salesEntered',
];

export default function DailyClosingScreen({
  records,
  setRecords,
  sales,
  setSales,
  closings,
  setClosings,
  role,
}: {
  records: DailyYarnRecord[];
  setRecords: Dispatch<SetStateAction<DailyYarnRecord[]>>;
  sales: DailySalesEntry[];
  setSales: Dispatch<SetStateAction<DailySalesEntry[]>>;
  closings: DailyClosing[];
  setClosings: Dispatch<SetStateAction<DailyClosing[]>>;
  role: Role;
}) {
  const availableDates = useMemo(
    () => Array.from(new Set(closings.map((c) => c.date))).sort((a, b) => b.localeCompare(a)),
    [closings]
  );
  const [selectedDate, setSelectedDate] = useState(yesterdayIso());
  const [expandedYarnId, setExpandedYarnId] = useState<string | null>(YARNS[0].id);

  const closing = closings.find((c) => c.date === selectedDate);
  const dateRecords = records.filter((r) => r.date === selectedDate);
  const dateSales = sales.filter((s) => s.date === selectedDate);

  const hasDataForDate = dateRecords.length > 0;
  const autoChecklist: DailyClosingChecklist = {
    productionEntered: hasDataForDate,
    rawMaterialEntered: hasDataForDate,
    wastageEntered: hasDataForDate,
    electricityEntered: hasDataForDate,
    laborEntered: hasDataForDate,
    machineHoursEntered: hasDataForDate,
    salesEntered: dateSales.length > 0,
    finishedGoodsChecked: closing?.checklist.finishedGoodsChecked ?? false,
    costCalculated: closing?.checklist.costCalculated ?? false,
    varianceReviewed: closing?.checklist.varianceReviewed ?? false,
    managementApproval: closing?.checklist.managementApproval ?? false,
  };
  const allChecked = [...AUTO_CHECKLIST_KEYS, ...MANUAL_CHECKLIST_KEYS].every((k) => autoChecklist[k]);
  const isLocked = closing?.status === 'Submitted' || closing?.status === 'Approved';

  function updateClosing(patch: Partial<DailyClosing>) {
    setClosings((prev) => {
      const exists = prev.some((c) => c.date === selectedDate);
      if (!exists) {
        const fresh: DailyClosing = {
          date: selectedDate,
          status: 'Draft',
          checklist: {
            productionEntered: false,
            rawMaterialEntered: false,
            wastageEntered: false,
            electricityEntered: false,
            laborEntered: false,
            machineHoursEntered: false,
            salesEntered: false,
            finishedGoodsChecked: false,
            costCalculated: false,
            varianceReviewed: false,
            managementApproval: false,
          },
          ...patch,
        };
        return [...prev, fresh];
      }
      return prev.map((c) => (c.date === selectedDate ? { ...c, ...patch } : c));
    });
  }

  function toggleManualChecklistItem(key: keyof DailyClosingChecklist) {
    if (isLocked) return;
    updateClosing({ checklist: { ...autoChecklist, [key]: !autoChecklist[key] } });
  }

  function updateRecord(recordId: string, patch: Partial<DailyYarnRecord>) {
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, ...patch } : r)));
  }

  function updateWastageRow(recordId: string, process: string, actualPct: number) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, wastageByProcess: r.wastageByProcess.map((w) => (w.process === process ? { ...w, actualPct } : w)) }
          : r
      )
    );
  }

  function addSalesRow(yarnId: string) {
    const newSale: DailySalesEntry = {
      id: `sale-${yarnId}-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      yarnId,
      customerId: CUSTOMERS[0].id,
      salesOrder: `SO-${getYarn(yarnId).yarnCode}-${selectedDate.replace(/-/g, '')}-${dateSales.filter((s) => s.yarnId === yarnId).length + 1}`,
      quantityKg: 0,
      sellingPricePerKg: 0,
      discountPerKg: 0,
    };
    setSales((prev) => [...prev, newSale]);
  }

  function updateSalesRow(id: string, patch: Partial<DailySalesEntry>) {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSalesRow(id: string) {
    setSales((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSaveDraft() {
    updateClosing({ status: 'Draft', preparedBy: closing?.preparedBy ?? 'Nasrin Akter', preparedAt: closing?.preparedAt ?? nowIso() });
  }

  function handleSubmit() {
    if (!allChecked) return;
    updateClosing({ status: 'Submitted', preparedBy: closing?.preparedBy ?? 'Nasrin Akter', preparedAt: closing?.preparedAt ?? nowIso() });
  }

  function handleMarkReviewed() {
    updateClosing({ reviewedBy: 'Shafiul Islam', reviewedAt: nowIso() });
  }

  function handleApprove() {
    updateClosing({ status: 'Approved', approvedBy: 'Md. Anisur Rahman', approvedAt: nowIso() });
  }

  const canSubmit = role === 'Accountant' || role === 'Accounts Manager';
  const canApprove = (role === 'Accounts Manager' || role === 'Management') && !!closing?.reviewedAt;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Select Date</label>
            <select
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)} {d === yesterdayIso() ? '(Yesterday — pending)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Daily Closing Status</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                closing?.status === 'Approved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : closing?.status === 'Submitted'
                    ? 'bg-sky-50 text-sky-700'
                    : closing?.status === 'Draft'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isLocked && <Lock size={11} />}
              {closing?.status ?? 'Not Started'}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Prepared By</dt>
            <dd className="font-medium text-slate-700">{closing?.preparedBy ?? '—'}</dd>
            <dd className="text-slate-400">{closing?.preparedAt ? new Date(closing.preparedAt).toLocaleString() : ''}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Reviewed By</dt>
            <dd className="font-medium text-slate-700">{closing?.reviewedBy ?? '—'}</dd>
            <dd className="text-slate-400">{closing?.reviewedAt ? new Date(closing.reviewedAt).toLocaleString() : ''}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Approved By</dt>
            <dd className="font-medium text-slate-700">{closing?.approvedBy ?? '—'}</dd>
            <dd className="text-slate-400">{closing?.approvedAt ? new Date(closing.approvedAt).toLocaleString() : ''}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">Daily Closing Checklist</h3>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {AUTO_CHECKLIST_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={autoChecklist[key]} disabled readOnly className="rounded" />
              {CHECKLIST_LABELS[key]}
              <span className="text-xs text-slate-400">(auto)</span>
            </label>
          ))}
          {MANUAL_CHECKLIST_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoChecklist[key]}
                disabled={isLocked}
                onChange={() => toggleManualChecklistItem(key)}
                className="rounded"
              />
              {CHECKLIST_LABELS[key]}
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={handleSaveDraft}
            disabled={isLocked}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLocked || !allChecked || !canSubmit}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            title={!allChecked ? 'All checklist items must be checked first' : !canSubmit ? 'Requires Accountant or Accounts Manager role' : ''}
          >
            Submit Daily Closing
          </button>
          <button
            onClick={handleMarkReviewed}
            disabled={closing?.status !== 'Submitted' || !!closing?.reviewedAt}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Mark Reviewed
          </button>
          <button
            onClick={handleApprove}
            disabled={closing?.status !== 'Submitted' || !canApprove}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
            title={!canApprove ? 'Requires review + Accounts Manager/Management role' : ''}
          >
            Approve
          </button>
          {!allChecked && !isLocked && (
            <span className="text-xs text-amber-600">Complete all checklist items before submitting.</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {YARNS.map((yarn) => {
          const record = dateRecords.find((r) => r.yarnId === yarn.id);
          if (!record) return null;
          const cost = getCostBreakdown(record);
          const efficiency = getEfficiencyPct(record);
          const wastage = getOverallWastagePct(record);
          const yarnSales = dateSales.filter((s) => s.yarnId === yarn.id);
          const expanded = expandedYarnId === yarn.id;

          return (
            <div key={yarn.id} className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setExpandedYarnId(expanded ? null : yarn.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{yarn.description}</p>
                  <p className="text-xs text-slate-500">
                    {formatNumber(record.actualProductionKg)} kg · Cost {formatBDT(cost.totalPerKg)}/kg · Efficiency{' '}
                    {formatPercent(efficiency)} · Wastage {formatPercent(wastage)}
                  </p>
                </div>
                {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {expanded && (
                <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Production Input</h4>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Planned Production (kg)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.plannedProductionKg}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { plannedProductionKg: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Actual Production (kg)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.actualProductionKg}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { actualProductionKg: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Machine Running Hours">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.machineRunningHours}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { machineRunningHours: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Downtime Hours">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.downtimeHours}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { downtimeHours: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Machines Running">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.machinesRunning}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { machinesRunning: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Machines Total">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.machinesTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { machinesTotal: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Opening WIP (kg)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.openingWipKg}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { openingWipKg: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Closing WIP (kg)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.closingWipKg}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { closingWipKg: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Downtime Reason">
                        <select
                          className={inputClass}
                          value={record.downtimeReason ?? ''}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { downtimeReason: (e.target.value || null) as DowntimeReason | null })}
                        >
                          <option value="">None</option>
                          {DOWNTIME_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw Material Blend (fixed recipe)</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {record.cottonBlend.map((share) => (
                        <span key={share.cottonLotId} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {share.cottonLotId.replace('lot-', '')} {share.blendPct}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wastage by Process</h4>
                    <table className="mt-2 w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="pb-1 font-medium">Process</th>
                          <th className="pb-1 font-medium text-right">Standard</th>
                          <th className="pb-1 font-medium text-right">Actual</th>
                          <th className="pb-1 font-medium text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {record.wastageByProcess.map((w) => {
                          const variance = w.actualPct - w.standardPct;
                          return (
                            <tr key={w.process}>
                              <td className="py-1 text-slate-600">{w.process}</td>
                              <td className="py-1 text-right tabular-nums text-slate-500">{formatPercent(w.standardPct)}</td>
                              <td className="py-1 text-right">
                                <input
                                  type="number"
                                  step="0.001"
                                  className="w-20 rounded-md border border-slate-300 px-1.5 py-0.5 text-right text-xs"
                                  value={(w.actualPct * 100).toFixed(2)}
                                  disabled={isLocked}
                                  onChange={(e) => updateWastageRow(record.id, w.process, Number(e.target.value) / 100)}
                                />
                              </td>
                              <td
                                className={`py-1 text-right tabular-nums ${
                                  Math.abs(variance) < 0.001 ? 'text-slate-400' : variance > 0 ? 'text-red-600' : 'text-emerald-600'
                                }`}
                              >
                                {variance > 0 ? '+' : ''}
                                {formatPercent(variance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion &amp; Overhead Costs</h4>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Electricity (kWh)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.electricityConsumptionKwh}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { electricityConsumptionKwh: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Labor Cost (BDT)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.laborCostTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { laborCostTotal: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Maintenance (BDT)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.maintenanceCostTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { maintenanceCostTotal: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Depreciation (BDT)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.depreciationCostTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { depreciationCostTotal: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Factory Overhead (BDT)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.factoryOverheadTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { factoryOverheadTotal: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Packing (BDT)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.packingCostTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { packingCostTotal: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Finance/Other (BDT)">
                        <input
                          type="number"
                          className={inputClass}
                          value={record.financeCostTotal}
                          disabled={isLocked}
                          onChange={(e) => updateRecord(record.id, { financeCostTotal: Number(e.target.value) })}
                        />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sales Entries</h4>
                      {!isLocked && (
                        <button
                          onClick={() => addSalesRow(yarn.id)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800"
                        >
                          <Plus size={12} /> Add sale
                        </button>
                      )}
                    </div>
                    {yarnSales.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No sales entered yet for this date.</p>
                    ) : (
                      <table className="mt-2 w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="pb-1 font-medium">Customer</th>
                            <th className="pb-1 font-medium text-right">Qty (kg)</th>
                            <th className="pb-1 font-medium text-right">Price/kg</th>
                            <th className="pb-1 font-medium text-right">Revenue</th>
                            <th className="pb-1" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {yarnSales.map((s) => (
                            <tr key={s.id}>
                              <td className="py-1">
                                <select
                                  className="rounded-md border border-slate-300 px-1.5 py-0.5 text-xs"
                                  value={s.customerId}
                                  disabled={isLocked}
                                  onChange={(e) => updateSalesRow(s.id, { customerId: e.target.value })}
                                >
                                  {CUSTOMERS.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-1 text-right">
                                <input
                                  type="number"
                                  className="w-20 rounded-md border border-slate-300 px-1.5 py-0.5 text-right text-xs"
                                  value={s.quantityKg}
                                  disabled={isLocked}
                                  onChange={(e) => updateSalesRow(s.id, { quantityKg: Number(e.target.value) })}
                                />
                              </td>
                              <td className="py-1 text-right">
                                <input
                                  type="number"
                                  className="w-20 rounded-md border border-slate-300 px-1.5 py-0.5 text-right text-xs"
                                  value={s.sellingPricePerKg}
                                  disabled={isLocked}
                                  onChange={(e) => updateSalesRow(s.id, { sellingPricePerKg: Number(e.target.value) })}
                                />
                              </td>
                              <td className="py-1 text-right tabular-nums text-slate-700">{formatBDT(getSaleRevenue(s))}</td>
                              <td className="py-1 text-right">
                                {!isLocked && (
                                  <button onClick={() => removeSalesRow(s.id)} className="text-slate-400 hover:text-red-600">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] text-slate-500">{label}</label>
      {children}
    </div>
  );
}
