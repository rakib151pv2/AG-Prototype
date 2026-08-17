import { useState } from 'react';
import { X } from 'lucide-react';
import type { BillType, Currency, DiscountStatus, LC } from '../types';

const CURRENCIES: Currency[] = ['USD', 'EUR'];
const BILL_TYPES: BillType[] = ['LDBC', 'IDBC'];
const DISCOUNT_STATUSES: DiscountStatus[] = ['Discounted', 'Not Discounted'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  lcNumber: string;
  beneficiary: string;
  unit: string;
  currency: Currency;
  lcValue: string;
  issuingBank: string;
  branch: string;
  location: string;
  advisingBank: string;
  billType: BillType;
  discountStatus: DiscountStatus;
  entryDate: string;
  issueDate: string;
  acceptanceDate: string;
  maturityDate: string;
  responsiblePerson: string;
  media: string;
  remarks: string;
};

const EMPTY_FORM: FormState = {
  lcNumber: '',
  beneficiary: '',
  unit: '',
  currency: 'USD',
  lcValue: '',
  issuingBank: '',
  branch: '',
  location: '',
  advisingBank: '',
  billType: 'LDBC',
  discountStatus: 'Not Discounted',
  entryDate: today(),
  issueDate: today(),
  acceptanceDate: '',
  maturityDate: '',
  responsiblePerson: '',
  media: '',
  remarks: '',
};

function Label({ children }: { children: string }) {
  return <label className="mb-1 block text-xs font-medium text-slate-500">{children}</label>;
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export default function CreateLCModal({
  units,
  responsiblePersons,
  onClose,
  onCreate,
}: {
  units: string[];
  responsiblePersons: string[];
  onClose: () => void;
  onCreate: (lc: LC) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    const missing: string[] = [];
    const requiredFields: Array<[keyof FormState, string]> = [
      ['lcNumber', 'L/C No.'],
      ['beneficiary', 'Party Name'],
      ['unit', 'Unit'],
      ['issuingBank', 'L/C Issuing Bank'],
      ['branch', 'Branch'],
      ['location', 'Location'],
      ['advisingBank', 'Advising Bank'],
      ['entryDate', 'Entry Date'],
      ['issueDate', 'LC Open Date'],
      ['maturityDate', 'Maturity Date'],
      ['responsiblePerson', 'Responsible Person'],
    ];
    for (const [key, label] of requiredFields) {
      if (!form[key].trim()) missing.push(label);
    }
    const lcValueNum = Number(form.lcValue);
    if (!form.lcValue || Number.isNaN(lcValueNum) || lcValueNum <= 0) {
      missing.push('LC Value (must be greater than 0)');
    }
    if (form.maturityDate && form.issueDate && form.maturityDate < form.issueDate) {
      missing.push('Maturity Date (must be on or after LC Open Date)');
    }

    if (missing.length > 0) {
      setErrors(missing);
      return;
    }

    const newLc: LC = {
      id: `lc-${Date.now()}`,
      lcNumber: form.lcNumber.trim(),
      beneficiary: form.beneficiary.trim(),
      issuingBank: form.issuingBank.trim(),
      branch: form.branch.trim(),
      location: form.location.trim(),
      advisingBank: form.advisingBank.trim(),
      currency: form.currency,
      lcValue: lcValueNum,
      billType: form.billType,
      discountStatus: form.discountStatus,
      entryDate: form.entryDate,
      issueDate: form.issueDate,
      acceptanceDate: form.acceptanceDate || undefined,
      maturityDate: form.maturityDate,
      unit: form.unit,
      responsiblePerson: form.responsiblePerson.trim(),
      media: form.media.trim() || undefined,
      remarks: form.remarks.trim() || undefined,
      realizations: [],
    };

    onCreate(newLc);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      <button aria-label="Close" className="fixed inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Create L/C</h2>
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
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Reference &amp; Parties</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>L/C No.</Label>
                <input className={inputClass} value={form.lcNumber} onChange={(e) => set('lcNumber', e.target.value)} placeholder="ILC-2026-0201" />
              </div>
              <div>
                <Label>Party Name</Label>
                <input className={inputClass} value={form.beneficiary} onChange={(e) => set('beneficiary', e.target.value)} placeholder="Buyer / applicant name" />
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
                <Label>Responsible Person</Label>
                <input
                  className={inputClass}
                  list="responsible-person-options"
                  value={form.responsiblePerson}
                  onChange={(e) => set('responsiblePerson', e.target.value)}
                  placeholder="Name"
                />
                <datalist id="responsible-person-options">
                  {responsiblePersons.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>L/C Issuing Bank</Label>
                <input className={inputClass} value={form.issuingBank} onChange={(e) => set('issuingBank', e.target.value)} />
              </div>
              <div>
                <Label>Branch</Label>
                <input className={inputClass} value={form.branch} onChange={(e) => set('branch', e.target.value)} />
              </div>
              <div>
                <Label>Location</Label>
                <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="City, Country" />
              </div>
              <div>
                <Label>Advising Bank</Label>
                <input className={inputClass} value={form.advisingBank} onChange={(e) => set('advisingBank', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Classification &amp; Value</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Currency</Label>
                <select className={inputClass} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>LC Value</Label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.lcValue}
                  onChange={(e) => set('lcValue', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>LDBC/IDBC</Label>
                <select className={inputClass} value={form.billType} onChange={(e) => set('billType', e.target.value as BillType)}>
                  {BILL_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Discount Status</Label>
                <select
                  className={inputClass}
                  value={form.discountStatus}
                  onChange={(e) => set('discountStatus', e.target.value as DiscountStatus)}
                >
                  {DISCOUNT_STATUSES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Key Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Entry Date</Label>
                <input className={inputClass} type="date" value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} />
              </div>
              <div>
                <Label>LC Open Date</Label>
                <input className={inputClass} type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
              </div>
              <div>
                <Label>Acceptance Date (optional)</Label>
                <input className={inputClass} type="date" value={form.acceptanceDate} onChange={(e) => set('acceptanceDate', e.target.value)} />
              </div>
              <div>
                <Label>Maturity Date</Label>
                <input className={inputClass} type="date" value={form.maturityDate} onChange={(e) => set('maturityDate', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Other</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Media (optional)</Label>
                <input className={inputClass} value={form.media} onChange={(e) => set('media', e.target.value)} placeholder="SWIFT TT / FDD / Pay Order" />
              </div>
              <div className="col-span-2">
                <Label>Remarks (optional)</Label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => set('remarks', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Create L/C
          </button>
        </div>
      </div>
    </div>
  );
}
