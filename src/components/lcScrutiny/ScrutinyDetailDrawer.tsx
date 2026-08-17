import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ScrutinyChecklist } from '../../lcScrutiny/types';
import { DOCUMENT_LABELS, REQUIRED_DOCUMENT_KEYS } from '../../lcScrutiny/types';
import { getDiscrepancies, getScrutinyStatus } from '../../lcScrutiny/discrepancyEngine';
import { formatDate, formatMoney, formatPercent } from '../../formatters';
import ScrutinyStatusBadge from './ScrutinyStatusBadge';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">{children}</dl>
    </div>
  );
}

const DOC_STATUS_STYLE: Record<string, string> = {
  Received: 'bg-emerald-50 text-emerald-700',
  Required: 'bg-red-50 text-red-700',
  'Not Applicable': 'bg-slate-100 text-slate-500',
};

export default function ScrutinyDetailDrawer({ checklist: c, onClose }: { checklist: ScrutinyChecklist; onClose: () => void }) {
  const status = getScrutinyStatus(c);
  const discrepancies = getDiscrepancies(c);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Close panel" className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="relative z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">{c.piNumber}</p>
            <h2 className="text-lg font-semibold text-slate-800">{c.lcNumber}</h2>
            <p className="text-sm text-slate-500">{c.applicantName}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="flex items-center justify-between">
            <ScrutinyStatusBadge status={status} />
            <span className="text-xs text-slate-500">
              Scrutinized {formatDate(c.scrutinyDate)} by {c.scrutinizedBy}
            </span>
          </div>

          {discrepancies.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-700">Discrepancies Raised</h3>
              <ul className="mt-2 space-y-2">
                {discrepancies.map((d) => (
                  <li key={d.id} className="flex items-start gap-2 text-sm text-red-700">
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        d.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {d.severity}
                    </span>
                    <span>
                      <span className="font-medium">{d.category}:</span> {d.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SectionCard title="LC Information">
            <Field label="LC Number" value={c.lcNumber} />
            <Field label="LC Opening Date" value={formatDate(c.lcOpeningDate)} />
            <Field label="LC Expiry Date" value={formatDate(c.lcExpiryDate)} />
            <Field label="Applicant (Buyer Name)" value={c.applicantName} />
            <Field label="Beneficiary Name" value={c.beneficiaryName} />
            <Field label="Buyer Address" value={c.applicantAddress} />
            <Field label="Beneficiary Address" value={c.beneficiaryAddress} />
          </SectionCard>

          <SectionCard title="Commercial Information">
            <Field label="PI Number" value={c.piNumber} />
            <Field label="PI Date" value={formatDate(c.piDate)} />
            <Field label="PI Quantity" value={c.piQuantity.toLocaleString()} />
            <Field label="PI Value" value={formatMoney(c.piValue, c.currency)} />
            <Field label="Currency" value={c.currency} />
            <Field label="LC Quantity" value={c.lcQuantity.toLocaleString()} />
            <Field label="LC Value" value={formatMoney(c.lcValue, c.currency)} />
            <Field label="Shipment Date" value={formatDate(c.shipmentDate)} />
            <Field label="Latest Shipment Date" value={formatDate(c.latestShipmentDate)} />
            <Field label="Payment Duration" value={c.paymentDurationDays > 0 ? `${c.paymentDurationDays} days` : 'Sight'} />
            <Field label="Payment Terms" value={c.paymentTerms} />
            <Field label="Partial Shipment Allowed" value={c.partialShipmentAllowed ? 'Yes' : 'No'} />
            <Field label="Partial Payment Clause" value={c.partialPaymentClause || '(not recorded)'} />
            <Field label="Quantity Tolerance" value={formatPercent(c.quantityTolerancePct / 100)} />
          </SectionCard>

          <SectionCard title="Banking Information">
            <Field label="Issuing Bank" value={c.issuingBank} />
            <Field label="Advising Bank" value={c.advisingBank} />
            <Field label="Branch" value={c.branch} />
            <Field label="Charging Heads" value={c.chargingHeads || '(not recorded)'} />
            <Field label="Reimbursement Instructions" value={c.reimbursementInstructions || '(not recorded)'} />
          </SectionCard>

          <SectionCard title="Shipping Information">
            <Field label="HS Code" value={c.hsCode} />
            <Field label="Country of Origin" value={c.countryOfOrigin} />
            <Field label="Destination" value={c.destination} />
            <Field label="Incoterms" value={c.incoterms} />
          </SectionCard>

          <div>
            <h3 className="text-sm font-semibold text-slate-700">Required Export Documents</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              {REQUIRED_DOCUMENT_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{DOCUMENT_LABELS[key]}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DOC_STATUS_STYLE[c.documents[key]]}`}>
                    {c.documents[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SectionCard title="Compliance Information">
            <Field label="Master LC / Contract" value={c.masterLcOrContract || '(not recorded)'} />
            <Field label="Beneficiary BIN" value={c.beneficiaryBIN || '(not recorded)'} />
            <Field label="Special Conditions" value={c.specialConditions || 'Nil'} />
            <Field label="Additional Clauses" value={c.additionalClauses || 'Nil'} />
            <Field label="Restricted Clauses" value={c.restrictedClauses || 'None'} />
          </SectionCard>

          {c.remarks && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-medium text-slate-500">Remarks: </span>
              {c.remarks}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
