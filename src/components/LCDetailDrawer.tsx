import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { LC } from '../types';
import {
  getAccruedInterestBDT,
  getConcessionalInterestBDT,
  getDaysOverdue,
  getDueFlag,
  getMaturityMonth,
  getOutstandingBDT,
  getOutstandingFC,
  getPctRealized,
  getRealizedBDT,
  getRealizedFC,
  getStatus,
  getWaivedOverdueTenure,
  SPOT_RATES,
} from '../selectors';
import { formatBDT, formatDate, formatFC, formatPercent } from '../formatters';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-700">{children}</h3>;
}

export default function LCDetailDrawer({ lc, onClose }: { lc: LC; onClose: () => void }) {
  const status = getStatus(lc);
  const dueFlag = getDueFlag(lc);
  const outstandingFC = getOutstandingFC(lc);
  const outstandingBDT = getOutstandingBDT(lc);
  const realizedFC = getRealizedFC(lc);
  const realizedBDT = getRealizedBDT(lc);
  const pct = getPctRealized(lc);
  const daysOverdue = getDaysOverdue(lc);
  const interest12 = getAccruedInterestBDT(lc);
  const waivedTenure = getWaivedOverdueTenure(lc);
  const interest6 = getConcessionalInterestBDT(lc);
  const spotRate = SPOT_RATES[lc.currency];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
      />
      <div className="relative z-50 h-full w-full max-w-3xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">{lc.unit}</p>
            <h2 className="text-lg font-semibold text-slate-800">{lc.lcNumber}</h2>
            <p className="text-sm text-slate-500">{lc.beneficiary}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-xs text-slate-400">D/OD: {dueFlag}</span>
            </div>
            <span className="text-xs text-slate-500">Maturity Month: {getMaturityMonth(lc)}</span>
          </div>

          <div>
            <SectionTitle>Reference &amp; Parties</SectionTitle>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="L/C No." value={lc.lcNumber} />
              <Field label="Party Name" value={lc.beneficiary} />
              <Field label="Unit" value={lc.unit} />
              <Field label="L/C Issuing Bank" value={lc.issuingBank} />
              <Field label="Branch" value={lc.branch} />
              <Field label="Location" value={lc.location} />
              <Field label="Advising Bank" value={lc.advisingBank} />
              <Field label="LDBC/IDBC" value={lc.billType} />
              <Field label="Discount Status" value={lc.discountStatus} />
            </dl>
          </div>

          <div>
            <SectionTitle>Key Dates</SectionTitle>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="Entry Date" value={formatDate(lc.entryDate)} />
              <Field label="LC Open Date" value={formatDate(lc.issueDate)} />
              <Field label="Acceptance Date" value={lc.acceptanceDate ? formatDate(lc.acceptanceDate) : undefined} />
              <Field label="Maturity Date" value={formatDate(lc.maturityDate)} />
            </dl>
          </div>

          <div>
            <SectionTitle>Value &amp; Realization Summary</SectionTitle>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="LC Value" value={formatFC(lc.lcValue, lc.currency)} />
              <Field label="Currency" value={lc.currency} />
              <Field label="% Realized" value={`${pct.toFixed(1)}%`} />
            </dl>
            <div className="mt-3">
              <ProgressBar pct={pct} />
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Total Realized Value</p>
                  <p className="font-semibold text-slate-700">{formatFC(realizedFC, lc.currency)}</p>
                  <p className="text-xs text-slate-500">{formatBDT(realizedBDT)} (Total Realized Value @ BDT)</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Outstanding</p>
                  <p className="font-semibold text-slate-700">{formatFC(outstandingFC, lc.currency)}</p>
                  <p className="text-xs text-slate-500">{formatBDT(outstandingBDT)} (@ {spotRate} spot)</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>Realization History</SectionTitle>
            {lc.realizations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No realizations recorded yet.</p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-3 py-2 font-medium">Realized Date</th>
                      <th className="px-3 py-2 font-medium">FDD/PO Date</th>
                      <th className="px-3 py-2 font-medium text-right">Partial Realized Value</th>
                      <th className="px-3 py-2 font-medium text-right">Exchange Rate</th>
                      <th className="px-3 py-2 font-medium text-right">Value @ BDT</th>
                      <th className="px-3 py-2 font-medium text-right">Short/Over $</th>
                      <th className="px-3 py-2 font-medium text-right">Source Tax BDT</th>
                      <th className="px-3 py-2 font-medium text-right">ERQ Build-up</th>
                      <th className="px-3 py-2 font-medium">Adjustment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lc.realizations.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-slate-600">{formatDate(r.date)}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(r.fddPayOrderDate)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                          {formatFC(r.amountFC, r.currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {r.exchangeRate.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                          {formatBDT(r.amountFC * r.exchangeRate)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums ${
                            (r.shortOverValueFC ?? 0) < 0
                              ? 'text-red-600'
                              : (r.shortOverValueFC ?? 0) > 0
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                          }`}
                        >
                          {r.shortOverValueFC != null ? formatFC(r.shortOverValueFC, r.currency) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.sourceTaxBDT != null
                            ? `${formatBDT(r.sourceTaxBDT)} (${formatPercent(r.sourceTaxRate ?? 0)})`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.scbErqBuildUpFC != null ? formatFC(r.scbErqBuildUpFC, r.currency) : '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {r.adjustmentDate ? formatDate(r.adjustmentDate) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {status === 'Overdue' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-700">OD Interest @ 12% (Bank Penal Rate)</h3>
              <div className="mt-2 space-y-1 text-sm text-red-700">
                <div className="flex justify-between">
                  <span>Outstanding (BDT)</span>
                  <span className="tabular-nums">{formatBDT(outstandingBDT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Tenure</span>
                  <span className="tabular-nums">{daysOverdue} days</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-red-200 pt-2 font-semibold">
                  <span>OD Interest @ 12%</span>
                  <span className="tabular-nums">{formatBDT(interest12)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-red-600/80">outstandingBDT × 0.12 × (overdue tenure / 365)</p>

              <div className="mt-4 border-t border-red-200 pt-3">
                <h4 className="text-sm font-semibold text-amber-700">OD Interest @ 6% (Waiving 90 Days)</h4>
                <div className="mt-2 space-y-1 text-sm text-amber-700">
                  <div className="flex justify-between">
                    <span>Overdue Tenure (Waiving 90 Days)</span>
                    <span className="tabular-nums">{waivedTenure} days</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>OD Interest @ 6%</span>
                    <span className="tabular-nums">{formatBDT(interest6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OD Interest Received Date</span>
                    <span>
                      {lc.concessionalInterestReceivedDate ? formatDate(lc.concessionalInterestReceivedDate) : 'Not yet received'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-amber-600/80">
                  Negotiated recovery rate — first 90 overdue days waived, 6% p.a. applied beyond that.
                </p>
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Follow-up &amp; Ownership</SectionTitle>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="Responsible Person" value={lc.responsiblePerson} />
              <Field label="Realization Person" value={lc.realizationPerson} />
              <Field label="Media" value={lc.media} />
              <Field
                label="Adv. Bank Reminder Date"
                value={lc.advBankReminderDate ? formatDate(lc.advBankReminderDate) : undefined}
              />
              <Field
                label="Issu. Bank Visiting Date"
                value={lc.issuingBankVisitingDate ? formatDate(lc.issuingBankVisitingDate) : undefined}
              />
              <Field
                label="Next Visiting Date"
                value={lc.nextVisitingDate ? formatDate(lc.nextVisitingDate) : undefined}
              />
            </dl>
            {lc.remarks && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-medium text-slate-500">Remarks: </span>
                {lc.remarks}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
