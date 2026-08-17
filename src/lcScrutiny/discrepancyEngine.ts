import type { Discrepancy, DocumentStatus, RequiredDocumentKey, ScrutinyChecklist, ScrutinyStatus } from './types';
import { DOCUMENT_LABELS } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY);
}

// Standard presentation-period convention (UCP 600 art. 14(c) default of 21 days)
// — if the LC's expiry falls within this window of the latest shipment date,
// there may not be enough time to present compliant documents to the bank.
const MIN_PRESENTATION_DAYS = 21;

function pctVariance(a: number, b: number): number {
  return b === 0 ? 0 : (a - b) / b;
}

export function getDiscrepancies(c: ScrutinyChecklist): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const tolerance = Math.max(0, c.quantityTolerancePct) / 100;

  // --- Compare LC against PI (Financial) ---
  const valueVariance = pctVariance(c.lcValue, c.piValue);
  if (Math.abs(valueVariance) > tolerance) {
    discrepancies.push({
      id: `${c.id}-value`,
      category: 'Financial',
      severity: Math.abs(valueVariance) > tolerance * 2 ? 'critical' : 'warning',
      message: `LC value (${c.currency} ${c.lcValue.toLocaleString()}) differs from PI value (${c.currency} ${c.piValue.toLocaleString()}) by ${(valueVariance * 100).toFixed(1)}%, outside the ±${c.quantityTolerancePct}% tolerance`,
    });
  }

  const qtyVariance = pctVariance(c.lcQuantity, c.piQuantity);
  if (Math.abs(qtyVariance) > tolerance) {
    discrepancies.push({
      id: `${c.id}-qty`,
      category: 'Financial',
      severity: Math.abs(qtyVariance) > tolerance * 2 ? 'critical' : 'warning',
      message: `LC quantity (${c.lcQuantity.toLocaleString()}) differs from PI quantity (${c.piQuantity.toLocaleString()}) by ${(qtyVariance * 100).toFixed(1)}%, outside the ±${c.quantityTolerancePct}% tolerance`,
    });
  }

  // --- Shipment clauses ---
  if (c.shipmentDate && c.latestShipmentDate && c.shipmentDate > c.latestShipmentDate) {
    discrepancies.push({
      id: `${c.id}-shipdate`,
      category: 'Shipment',
      severity: 'critical',
      message: 'Planned shipment date falls after the LC\'s latest shipment date',
    });
  }

  if (c.latestShipmentDate && c.lcExpiryDate) {
    const gap = daysBetween(c.latestShipmentDate, c.lcExpiryDate);
    if (gap < MIN_PRESENTATION_DAYS) {
      discrepancies.push({
        id: `${c.id}-presentation`,
        category: 'Shipment',
        severity: gap < 10 ? 'critical' : 'warning',
        message: `Only ${gap} day(s) between latest shipment date and LC expiry (standard presentation period is ${MIN_PRESENTATION_DAYS} days) — may be too tight to present compliant documents`,
      });
    }
  }

  // --- Payment clauses ---
  const termsLower = c.paymentTerms.toLowerCase();
  if (termsLower.includes('sight') && c.paymentDurationDays > 0) {
    discrepancies.push({
      id: `${c.id}-paymentterms`,
      category: 'Payment',
      severity: 'warning',
      message: `Payment terms mention "sight" but a payment duration of ${c.paymentDurationDays} days is recorded — clause is inconsistent`,
    });
  }
  if (!c.partialShipmentAllowed && /partial\s+payments?\s+accepted/i.test(c.partialPaymentClause)) {
    discrepancies.push({
      id: `${c.id}-partial`,
      category: 'Payment',
      severity: 'warning',
      message: 'Partial payment clause references partial payment, but partial shipment is not allowed under this LC',
    });
  }
  if (!c.partialPaymentClause.trim()) {
    discrepancies.push({
      id: `${c.id}-partialclause-missing`,
      category: 'Payment',
      severity: 'warning',
      message: 'Partial payment clause is blank — confirm and record the buyer\'s partial-payment terms before shipment',
    });
  }

  // --- Banking clauses ---
  if (!c.chargingHeads.trim()) {
    discrepancies.push({
      id: `${c.id}-chargingheads`,
      category: 'Banking',
      severity: 'warning',
      message: 'Charging Heads clause not recorded — unclear who bears bank charges',
    });
  }
  if (!c.reimbursementInstructions.trim()) {
    discrepancies.push({
      id: `${c.id}-reimbursement`,
      category: 'Banking',
      severity: 'warning',
      message: 'Reimbursement instructions not recorded',
    });
  }

  // --- Required documents ---
  const missingDocs = (Object.entries(c.documents) as Array<[RequiredDocumentKey, DocumentStatus]>).filter(
    ([, status]) => status === 'Required'
  );
  for (const [key] of missingDocs) {
    discrepancies.push({
      id: `${c.id}-doc-${key}`,
      category: 'Documents',
      severity: 'warning',
      message: `${DOCUMENT_LABELS[key]} is required but not yet received`,
    });
  }

  // --- Compliance ---
  if (!c.beneficiaryBIN.trim()) {
    discrepancies.push({
      id: `${c.id}-bin`,
      category: 'Compliance',
      severity: 'warning',
      message: 'Beneficiary BIN not recorded on file',
    });
  }
  if (c.restrictedClauses.trim()) {
    discrepancies.push({
      id: `${c.id}-restricted`,
      category: 'Compliance',
      severity: 'critical',
      message: `Restricted clause present: "${c.restrictedClauses.trim()}" — requires management review before acceptance`,
    });
  }

  return discrepancies;
}

export function getScrutinyStatus(c: ScrutinyChecklist): ScrutinyStatus {
  return getDiscrepancies(c).length === 0 ? 'Clean' : 'Discrepancy Found';
}
