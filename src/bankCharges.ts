import type { LC } from './types';
import { getExposureBDT } from './selectors';

export type ChargeKind = 'percent' | 'flat';

export type ChargeLineItem = {
  id: string;
  label: string;
  kind: ChargeKind;
  rate: number; // percent charges: decimal rate (0.001 = 0.10%). flat charges: ignored.
  flatAmountBDT: number; // flat charges: the BDT amount. percent charges: ignored.
  vatApplicable: boolean; // 15% VAT applies to bank commission/service charges in Bangladesh
};

export const VAT_RATE = 0.15;

// Illustrative standard schedule for an export L/C — editable per-LC in the UI.
export function defaultChargeSchedule(): ChargeLineItem[] {
  return [
    { id: 'advising', label: 'Advising Commission', kind: 'percent', rate: 0.001, flatAmountBDT: 0, vatApplicable: true },
    { id: 'negotiation', label: 'Negotiation Commission', kind: 'percent', rate: 0.002, flatAmountBDT: 0, vatApplicable: true },
    { id: 'swift', label: 'SWIFT Charge', kind: 'flat', rate: 0, flatAmountBDT: 500, vatApplicable: false },
    { id: 'courier', label: 'Courier / Postage', kind: 'flat', rate: 0, flatAmountBDT: 800, vatApplicable: false },
    { id: 'misc', label: 'Miscellaneous', kind: 'flat', rate: 0, flatAmountBDT: 0, vatApplicable: false },
  ];
}

export function chargeBaseBDT(lc: LC): number {
  return getExposureBDT(lc);
}

export function chargeAmountBDT(item: ChargeLineItem, baseBDT: number): number {
  return item.kind === 'percent' ? baseBDT * item.rate : item.flatAmountBDT;
}

export function computeChargeTotals(items: ChargeLineItem[], baseBDT: number) {
  const lines = items.map((item) => ({ item, amountBDT: chargeAmountBDT(item, baseBDT) }));
  const subtotal = lines.reduce((s, l) => s + l.amountBDT, 0);
  const vatBase = lines.filter((l) => l.item.vatApplicable).reduce((s, l) => s + l.amountBDT, 0);
  const vat = vatBase * VAT_RATE;
  const total = subtotal + vat;
  return { lines, subtotal, vatBase, vat, total };
}
