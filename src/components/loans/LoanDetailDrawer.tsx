import { X } from 'lucide-react';
import type { LoanFacility } from '../../types';
import {
  getLoanAccruedInterestBDT,
  getLoanDaysOverdue,
  getLoanOutstandingBDT,
  getLoanPrincipalBDT,
  getLoanStatus,
  LOAN_TYPE_LABELS,
} from '../../loanSelectors';
import { formatBDT, formatDate, formatMoney } from '../../formatters';
import LoanStatusBadge from './LoanStatusBadge';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}

export default function LoanDetailDrawer({ loan, onClose }: { loan: LoanFacility; onClose: () => void }) {
  const status = getLoanStatus(loan);
  const outstandingBDT = getLoanOutstandingBDT(loan);
  const principalBDT = getLoanPrincipalBDT(loan);
  const daysOverdue = getLoanDaysOverdue(loan);
  const interest = getLoanAccruedInterestBDT(loan);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Close panel" className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="relative z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">{loan.unit}</p>
            <h2 className="text-lg font-semibold text-slate-800">{loan.facilityNumber}</h2>
            <p className="text-sm text-slate-500">
              {loan.loanType} — {LOAN_TYPE_LABELS[loan.loanType]}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <LoanStatusBadge status={status} />

          <div>
            <h3 className="text-sm font-semibold text-slate-700">Reference &amp; Parties</h3>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="Facility No." value={loan.facilityNumber} />
              <Field label="Facility Type" value={`${loan.loanType} (${LOAN_TYPE_LABELS[loan.loanType]})`} />
              <Field label="Unit" value={loan.unit} />
              <Field label="Bank" value={loan.bank} />
              <Field label="Linked L/C" value={loan.linkedLcNumber} />
              <Field label="Responsible Person" value={loan.responsiblePerson} />
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700">Value &amp; Interest</h3>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="Currency" value={loan.currency} />
              <Field label="Interest Rate" value={`${loan.interestRatePct}% p.a.`} />
            </dl>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Principal</p>
                <p className="font-semibold text-slate-700">{formatMoney(loan.principalAmount, loan.currency)}</p>
                {loan.currency !== 'BDT' && <p className="text-xs text-slate-500">{formatBDT(principalBDT)}</p>}
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Outstanding</p>
                <p className="font-semibold text-slate-700">{formatMoney(loan.outstandingAmount, loan.currency)}</p>
                {loan.currency !== 'BDT' && <p className="text-xs text-slate-500">{formatBDT(outstandingBDT)}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700">Key Dates</h3>
            <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
              <Field label="Disbursement Date" value={formatDate(loan.disbursementDate)} />
              <Field label="Maturity / Adjustment Date" value={formatDate(loan.maturityDate)} />
            </dl>
          </div>

          {status === 'Overdue' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-700">Overdue Interest Calculation</h3>
              <div className="mt-2 space-y-1 text-sm text-red-700">
                <div className="flex justify-between">
                  <span>Outstanding (BDT)</span>
                  <span className="tabular-nums">{formatBDT(outstandingBDT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span className="tabular-nums">{loan.interestRatePct}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span>Days Overdue</span>
                  <span className="tabular-nums">{daysOverdue} days</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-red-200 pt-2 font-semibold">
                  <span>Accrued Interest</span>
                  <span className="tabular-nums">{formatBDT(interest)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-red-600/80">
                outstandingBDT × ({loan.interestRatePct}/100) × (daysOverdue / 365)
              </p>
            </div>
          )}

          {loan.remarks && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Remarks</h3>
              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{loan.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
