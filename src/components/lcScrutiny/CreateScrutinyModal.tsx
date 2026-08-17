import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { LC } from '../../types';
import type { DocumentStatus, RequiredDocumentKey, ScrutinyChecklist } from '../../lcScrutiny/types';
import { DOCUMENT_LABELS, REQUIRED_DOCUMENT_KEYS } from '../../lcScrutiny/types';
import { getDiscrepancies } from '../../lcScrutiny/discrepancyEngine';

const BENEFICIARY_BY_UNIT: Record<string, string> = {
  'Apex Spinning Mills': 'Israq Spinning Mills Limited',
  'Desh Fabrics & Weaving': 'Israq Textile Mills Limited',
  'Green Dyeing & Finishing': 'Israq Cotton Mills Limited',
};
const BENEFICIARY_ADDRESS = 'Israq Group Industrial Complex, Gazipur, Dhaka, Bangladesh';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';
const DOC_STATUS_OPTIONS: DocumentStatus[] = ['Required', 'Received', 'Not Applicable'];

type FormState = Omit<ScrutinyChecklist, 'id' | 'piQuantity' | 'piValue' | 'lcQuantity' | 'lcValue' | 'paymentDurationDays' | 'quantityTolerancePct'> & {
  piQuantity: string;
  piValue: string;
  lcQuantity: string;
  lcValue: string;
  paymentDurationDays: string;
  quantityTolerancePct: string;
};

function emptyForm(): FormState {
  return {
    linkedLcId: undefined,
    scrutinyDate: today(),
    scrutinizedBy: '',
    lcNumber: '',
    lcOpeningDate: today(),
    lcExpiryDate: '',
    applicantName: '',
    applicantAddress: '',
    beneficiaryName: '',
    beneficiaryAddress: BENEFICIARY_ADDRESS,
    piNumber: '',
    piDate: today(),
    piQuantity: '',
    piValue: '',
    currency: 'USD',
    lcQuantity: '',
    lcValue: '',
    shipmentDate: '',
    latestShipmentDate: '',
    paymentDurationDays: '0',
    paymentTerms: 'Sight L/C — payment on presentation of compliant documents',
    partialShipmentAllowed: true,
    partialPaymentClause: '',
    quantityTolerancePct: '5',
    issuingBank: '',
    advisingBank: '',
    branch: '',
    chargingHeads: '',
    reimbursementInstructions: '',
    hsCode: '',
    countryOfOrigin: 'Bangladesh',
    destination: '',
    incoterms: '',
    documents: {
      commercialInvoice: 'Required',
      packingList: 'Required',
      billOfLadingOrAirwaybill: 'Required',
      certificateOfOrigin: 'Required',
      inspectionCertificate: 'Not Applicable',
      insuranceCertificate: 'Not Applicable',
      beneficiaryCertificate: 'Required',
      gspCertificate: 'Not Applicable',
    },
    masterLcOrContract: '',
    beneficiaryBIN: '',
    specialConditions: '',
    additionalClauses: '',
    restrictedClauses: '',
    remarks: '',
  };
}

export default function CreateScrutinyModal({
  lcs,
  onClose,
  onCreate,
}: {
  lcs: LC[];
  onClose: () => void;
  onCreate: (checklist: ScrutinyChecklist) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setDoc(key: RequiredDocumentKey, status: DocumentStatus) {
    setForm((f) => ({ ...f, documents: { ...f.documents, [key]: status } }));
  }

  function loadFromLc(lcId: string) {
    const lc = lcs.find((l) => l.id === lcId);
    if (!lc) return;
    setForm((f) => ({
      ...f,
      linkedLcId: lc.id,
      lcNumber: lc.lcNumber,
      lcOpeningDate: lc.issueDate,
      lcExpiryDate: lc.maturityDate,
      applicantName: lc.beneficiary,
      applicantAddress: `${lc.beneficiary} — Registered Office, ${lc.location}`,
      beneficiaryName: BENEFICIARY_BY_UNIT[lc.unit] ?? 'Israq Textile Mills Limited',
      beneficiaryAddress: BENEFICIARY_ADDRESS,
      currency: lc.currency,
      lcValue: String(lc.lcValue),
      issuingBank: `${lc.issuingBank}, ${lc.branch}`,
      advisingBank: lc.advisingBank,
      branch: lc.branch,
      scrutinizedBy: lc.responsiblePerson,
    }));
  }

  function handleSubmit() {
    const missing: string[] = [];
    const required: Array<[keyof FormState, string]> = [
      ['lcNumber', 'LC Number'],
      ['lcExpiryDate', 'LC Expiry Date'],
      ['applicantName', 'Applicant (Buyer Name)'],
      ['beneficiaryName', 'Beneficiary Name'],
      ['piNumber', 'PI Number'],
      ['scrutinizedBy', 'Scrutinized By'],
      ['issuingBank', 'Issuing Bank'],
      ['shipmentDate', 'Shipment Date'],
      ['latestShipmentDate', 'Latest Shipment Date'],
    ];
    for (const [key, label] of required) {
      if (!String(form[key] ?? '').trim()) missing.push(label);
    }
    if (!form.piQuantity || Number(form.piQuantity) <= 0) missing.push('PI Quantity (must be greater than 0)');
    if (!form.piValue || Number(form.piValue) <= 0) missing.push('PI Value (must be greater than 0)');
    if (!form.lcQuantity || Number(form.lcQuantity) <= 0) missing.push('LC Quantity (must be greater than 0)');
    if (!form.lcValue || Number(form.lcValue) <= 0) missing.push('LC Value (must be greater than 0)');

    if (missing.length > 0) {
      setErrors(missing);
      return;
    }

    const checklist: ScrutinyChecklist = {
      ...form,
      id: `scrutiny-${Date.now()}`,
      piQuantity: Number(form.piQuantity),
      piValue: Number(form.piValue),
      lcQuantity: Number(form.lcQuantity),
      lcValue: Number(form.lcValue),
      paymentDurationDays: Number(form.paymentDurationDays) || 0,
      quantityTolerancePct: Number(form.quantityTolerancePct) || 0,
    };
    onCreate(checklist);
  }

  const previewChecklist: ScrutinyChecklist = {
    ...form,
    id: 'preview',
    piQuantity: Number(form.piQuantity) || 0,
    piValue: Number(form.piValue) || 0,
    lcQuantity: Number(form.lcQuantity) || 0,
    lcValue: Number(form.lcValue) || 0,
    paymentDurationDays: Number(form.paymentDurationDays) || 0,
    quantityTolerancePct: Number(form.quantityTolerancePct) || 0,
  };
  const livePreview = getDiscrepancies(previewChecklist);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      <button aria-label="Close" className="fixed inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">New Export LC Scrutiny Checklist</h2>
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
            <label className="mb-1 block text-xs font-medium text-slate-500">Load from an existing LC (optional)</label>
            <select className={inputClass} value={form.linkedLcId ?? ''} onChange={(e) => loadFromLc(e.target.value)}>
              <option value="">— Select an LC to auto-fill —</option>
              {lcs.map((lc) => (
                <option key={lc.id} value={lc.id}>
                  {lc.lcNumber} — {lc.beneficiary}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">LC Information</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Labeled label="LC Number"><input className={inputClass} value={form.lcNumber} onChange={(e) => set('lcNumber', e.target.value)} /></Labeled>
              <Labeled label="LC Opening Date"><input type="date" className={inputClass} value={form.lcOpeningDate} onChange={(e) => set('lcOpeningDate', e.target.value)} /></Labeled>
              <Labeled label="LC Expiry Date"><input type="date" className={inputClass} value={form.lcExpiryDate} onChange={(e) => set('lcExpiryDate', e.target.value)} /></Labeled>
              <Labeled label="Applicant (Buyer Name)"><input className={inputClass} value={form.applicantName} onChange={(e) => set('applicantName', e.target.value)} /></Labeled>
              <Labeled label="Beneficiary Name"><input className={inputClass} value={form.beneficiaryName} onChange={(e) => set('beneficiaryName', e.target.value)} /></Labeled>
              <Labeled label="Scrutinized By"><input className={inputClass} value={form.scrutinizedBy} onChange={(e) => set('scrutinizedBy', e.target.value)} /></Labeled>
              <Labeled label="Buyer Address"><input className={inputClass} value={form.applicantAddress} onChange={(e) => set('applicantAddress', e.target.value)} /></Labeled>
              <Labeled label="Beneficiary Address"><input className={inputClass} value={form.beneficiaryAddress} onChange={(e) => set('beneficiaryAddress', e.target.value)} /></Labeled>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Commercial Information</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Labeled label="PI Number"><input className={inputClass} value={form.piNumber} onChange={(e) => set('piNumber', e.target.value)} /></Labeled>
              <Labeled label="PI Date"><input type="date" className={inputClass} value={form.piDate} onChange={(e) => set('piDate', e.target.value)} /></Labeled>
              <Labeled label="Currency">
                <select className={inputClass} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Labeled>
              <Labeled label="PI Quantity"><input type="number" className={inputClass} value={form.piQuantity} onChange={(e) => set('piQuantity', e.target.value)} /></Labeled>
              <Labeled label="PI Value"><input type="number" className={inputClass} value={form.piValue} onChange={(e) => set('piValue', e.target.value)} /></Labeled>
              <Labeled label="Quantity Tolerance (%)"><input type="number" className={inputClass} value={form.quantityTolerancePct} onChange={(e) => set('quantityTolerancePct', e.target.value)} /></Labeled>
              <Labeled label="LC Quantity"><input type="number" className={inputClass} value={form.lcQuantity} onChange={(e) => set('lcQuantity', e.target.value)} /></Labeled>
              <Labeled label="LC Value"><input type="number" className={inputClass} value={form.lcValue} onChange={(e) => set('lcValue', e.target.value)} /></Labeled>
              <Labeled label="Payment Duration (days, 0=sight)"><input type="number" className={inputClass} value={form.paymentDurationDays} onChange={(e) => set('paymentDurationDays', e.target.value)} /></Labeled>
              <Labeled label="Shipment Date"><input type="date" className={inputClass} value={form.shipmentDate} onChange={(e) => set('shipmentDate', e.target.value)} /></Labeled>
              <Labeled label="Latest Shipment Date"><input type="date" className={inputClass} value={form.latestShipmentDate} onChange={(e) => set('latestShipmentDate', e.target.value)} /></Labeled>
              <Labeled label="Partial Shipment Allowed">
                <select className={inputClass} value={form.partialShipmentAllowed ? 'yes' : 'no'} onChange={(e) => set('partialShipmentAllowed', e.target.value === 'yes')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Labeled>
              <Labeled label="Payment Terms"><input className={inputClass} value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} /></Labeled>
              <div className="col-span-2 sm:col-span-3">
                <Labeled label="Partial Payment Clause"><input className={inputClass} value={form.partialPaymentClause} onChange={(e) => set('partialPaymentClause', e.target.value)} /></Labeled>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Banking Information</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Labeled label="Issuing Bank"><input className={inputClass} value={form.issuingBank} onChange={(e) => set('issuingBank', e.target.value)} /></Labeled>
              <Labeled label="Advising Bank"><input className={inputClass} value={form.advisingBank} onChange={(e) => set('advisingBank', e.target.value)} /></Labeled>
              <Labeled label="Branch"><input className={inputClass} value={form.branch} onChange={(e) => set('branch', e.target.value)} /></Labeled>
              <Labeled label="Charging Heads"><input className={inputClass} value={form.chargingHeads} onChange={(e) => set('chargingHeads', e.target.value)} /></Labeled>
              <Labeled label="Reimbursement Instructions"><input className={inputClass} value={form.reimbursementInstructions} onChange={(e) => set('reimbursementInstructions', e.target.value)} /></Labeled>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Shipping Information</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Labeled label="HS Code"><input className={inputClass} value={form.hsCode} onChange={(e) => set('hsCode', e.target.value)} /></Labeled>
              <Labeled label="Country of Origin"><input className={inputClass} value={form.countryOfOrigin} onChange={(e) => set('countryOfOrigin', e.target.value)} /></Labeled>
              <Labeled label="Destination"><input className={inputClass} value={form.destination} onChange={(e) => set('destination', e.target.value)} /></Labeled>
              <Labeled label="Incoterms"><input className={inputClass} value={form.incoterms} onChange={(e) => set('incoterms', e.target.value)} /></Labeled>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Required Export Documents</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REQUIRED_DOCUMENT_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-1.5">
                  <span className="text-xs text-slate-600">{DOCUMENT_LABELS[key]}</span>
                  <select
                    className="rounded-md border border-slate-300 px-1.5 py-0.5 text-xs"
                    value={form.documents[key]}
                    onChange={(e) => setDoc(key, e.target.value as DocumentStatus)}
                  >
                    {DOC_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Compliance Information</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Labeled label="Master LC / Contract"><input className={inputClass} value={form.masterLcOrContract} onChange={(e) => set('masterLcOrContract', e.target.value)} /></Labeled>
              <Labeled label="Beneficiary BIN"><input className={inputClass} value={form.beneficiaryBIN} onChange={(e) => set('beneficiaryBIN', e.target.value)} /></Labeled>
              <Labeled label="Special Conditions"><input className={inputClass} value={form.specialConditions} onChange={(e) => set('specialConditions', e.target.value)} /></Labeled>
              <Labeled label="Additional Clauses"><input className={inputClass} value={form.additionalClauses} onChange={(e) => set('additionalClauses', e.target.value)} /></Labeled>
              <div className="col-span-2 sm:col-span-3">
                <Labeled label="Restricted Clauses"><input className={inputClass} value={form.restrictedClauses} onChange={(e) => set('restrictedClauses', e.target.value)} /></Labeled>
              </div>
            </div>
          </div>

          <div>
            <Labeled label="Remarks (optional)">
              <textarea className={inputClass} rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
            </Labeled>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Live Discrepancy Preview</h3>
            {livePreview.length === 0 ? (
              <p className="mt-2 text-sm text-emerald-600">No discrepancies detected with the current entries.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {livePreview.map((d) => (
                  <li key={d.id} className={`text-xs ${d.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                    <span className="font-medium">{d.category}:</span> {d.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Save Scrutiny Checklist
          </button>
        </div>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
