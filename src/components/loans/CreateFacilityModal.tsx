import { useState } from 'react';
import { X } from 'lucide-react';
import type { LoanCurrency, LoanFacility, LoanType } from '../../types';
import { LOAN_TYPES } from '../../sampleLoans';
import { LOAN_TYPE_LABELS } from '../../loanSelectors';

const CURRENCIES: LoanCurrency[] = ['BDT', 'USD'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  facilityNumber: string;
  loanType: LoanType;
  unit: string;
  bank: string;
  currency: LoanCurrency;
  principalAmount: string;
  interestRatePct: string;
  disbursementDate: string;
  maturityDate: string;
  linkedLcNumber: string;
  responsiblePerson: string;
  remarks: string;
};

const EMPTY_FORM: FormState = {
  facilityNumber: '',
  loanType: 'STL',
  unit: '',
  bank: '',
  currency: 'BDT',
  principalAmount: '',
  interestRatePct: '',
  disbursementDate: today(),
  maturityDate: '',
  linkedLcNumber: '',
  responsiblePerson: '',
  remarks: '',
};

function Label({ children }: { children: string }) {
  return <label className="mb-1 block text-xs font-medium text-slate-500">{children}</label>;
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export default function CreateFacilityModal({
  units,
  lcNumbers,
  responsiblePersons,
  onClose,
  onCreate,
}: {
  units: string[];
  lcNumbers: string[];
  responsiblePersons: string[];
  onClose: () => void;
  onCreate: (loan: LoanFacility) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    const missing: string[] = [];
    const requiredFields: Array<[keyof FormState, string]> = [
      ['facilityNumber', 'Facility No.'],
      ['unit', 'Unit'],
      ['bank', 'Bank'],
      ['disbursementDate', 'Disbursement Date'],
      ['maturityDate', 'Maturity Date'],
      ['responsiblePerson', 'Responsible Person'],
    ];
    for (const [key, label] of requiredFields) {
      if (!form[key].trim()) missing.push(label);
    }
    const principalNum = Number(form.principalAmount);
    if (!form.principalAmount || Number.isNaN(principalNum) || principalNum <= 0) {
      missing.push('Principal Amount (must be greater than 0)');
    }
    const rateNum = Number(form.interestRatePct);
    if (!form.interestRatePct || Number.isNaN(rateNum) || rateNum <= 0) {
      missing.push('Interest Rate (must be greater than 0)');
    }
    if (form.maturityDate && form.disbursementDate && form.maturityDate < form.disbursementDate) {
      missing.push('Maturity Date (must be on or after Disbursement Date)');
    }

    if (missing.length > 0) {
      setErrors(missing);
      return;
    }

    const newLoan: LoanFacility = {
      id: `loan-${Date.now()}`,
      facilityNumber: form.facilityNumber.trim(),
      loanType: form.loanType,
      unit: form.unit,
      bank: form.bank.trim(),
      currency: form.currency,
      principalAmount: principalNum,
      outstandingAmount: principalNum,
      interestRatePct: rateNum,
      disbursementDate: form.disbursementDate,
      maturityDate: form.maturityDate,
      linkedLcNumber: form.linkedLcNumber || undefined,
      responsiblePerson: form.responsiblePerson.trim(),
      remarks: form.remarks.trim() || undefined,
    };

    onCreate(newLoan);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      <button aria-label="Close" className="fixed inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Create Loan Facility</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Please fix the following:</p>
              <ul className="mt-1 list-inside list-disc">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Reference</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Facility No.</Label>
                <input
                  className={inputClass}
                  value={form.facilityNumber}
                  onChange={(e) => set('facilityNumber', e.target.value)}
                  placeholder="STL-2026-060"
                />
              </div>
              <div>
                <Label>Facility Type</Label>
                <select className={inputClass} value={form.loanType} onChange={(e) => set('loanType', e.target.value as LoanType)}>
                  {LOAN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t} — {LOAN_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Unit</Label>
                <select className={inputClass} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Bank</Label>
                <input className={inputClass} value={form.bank} onChange={(e) => set('bank', e.target.value)} />
              </div>
              <div>
                <Label>Responsible Person</Label>
                <input
                  className={inputClass}
                  list="loan-responsible-person-options"
                  value={form.responsiblePerson}
                  onChange={(e) => set('responsiblePerson', e.target.value)}
                />
                <datalist id="loan-responsible-person-options">
                  {responsiblePersons.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Linked L/C (optional)</Label>
                <input
                  className={inputClass}
                  list="loan-linked-lc-options"
                  value={form.linkedLcNumber}
                  onChange={(e) => set('linkedLcNumber', e.target.value)}
                  placeholder="ILC-2026-0000"
                />
                <datalist id="loan-linked-lc-options">
                  {lcNumbers.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Value &amp; Rate</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Currency</Label>
                <select className={inputClass} value={form.currency} onChange={(e) => set('currency', e.target.value as LoanCurrency)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Principal Amount</Label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.principalAmount}
                  onChange={(e) => set('principalAmount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Interest Rate (% p.a.)</Label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.interestRatePct}
                  onChange={(e) => set('interestRatePct', e.target.value)}
                  placeholder="e.g. 10.5"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Key Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Disbursement Date</Label>
                <input
                  className={inputClass}
                  type="date"
                  value={form.disbursementDate}
                  onChange={(e) => set('disbursementDate', e.target.value)}
                />
              </div>
              <div>
                <Label>Maturity / Adjustment Date</Label>
                <input
                  className={inputClass}
                  type="date"
                  value={form.maturityDate}
                  onChange={(e) => set('maturityDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Remarks (optional)</Label>
            <textarea className={inputClass} rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Create Facility
          </button>
        </div>
      </div>
    </div>
  );
}
