export type DocumentStatus = 'Required' | 'Received' | 'Not Applicable';

export const REQUIRED_DOCUMENT_KEYS = [
  'commercialInvoice',
  'packingList',
  'billOfLadingOrAirwaybill',
  'certificateOfOrigin',
  'inspectionCertificate',
  'insuranceCertificate',
  'beneficiaryCertificate',
  'gspCertificate',
] as const;

export type RequiredDocumentKey = (typeof REQUIRED_DOCUMENT_KEYS)[number];

export const DOCUMENT_LABELS: Record<RequiredDocumentKey, string> = {
  commercialInvoice: 'Commercial Invoice',
  packingList: 'Packing List',
  billOfLadingOrAirwaybill: 'Bill of Lading / Air Waybill',
  certificateOfOrigin: 'Certificate of Origin',
  inspectionCertificate: 'Inspection Certificate',
  insuranceCertificate: 'Insurance Certificate',
  beneficiaryCertificate: 'Beneficiary Certificate',
  gspCertificate: 'GSP Certificate',
};

export type ScrutinyStatus = 'Clean' | 'Discrepancy Found';

export type DiscrepancyCategory = 'Financial' | 'Banking' | 'Shipment' | 'Payment' | 'Compliance' | 'Documents';
export type DiscrepancySeverity = 'critical' | 'warning';

export type Discrepancy = {
  id: string;
  category: DiscrepancyCategory;
  severity: DiscrepancySeverity;
  message: string;
};

export type ScrutinyChecklist = {
  id: string;
  linkedLcId?: string; // ties back to LC Tracking's LC.id, when scrutinizing a tracked LC
  scrutinyDate: string; // ISO
  scrutinizedBy: string;

  // LC Information
  lcNumber: string;
  lcOpeningDate: string; // ISO
  lcExpiryDate: string; // ISO
  applicantName: string; // buyer/importer
  applicantAddress: string;
  beneficiaryName: string; // our exporting entity
  beneficiaryAddress: string;

  // Commercial Information
  piNumber: string;
  piDate: string; // ISO
  piQuantity: number;
  piValue: number;
  currency: string;
  lcQuantity: number;
  lcValue: number;
  shipmentDate: string; // ISO — planned/earliest shipment
  latestShipmentDate: string; // ISO — LC clause
  paymentDurationDays: number; // 0 = sight
  paymentTerms: string;
  partialShipmentAllowed: boolean;
  partialPaymentClause: string;
  quantityTolerancePct: number; // e.g. 5 = ±5%

  // Banking Information
  issuingBank: string;
  advisingBank: string;
  branch: string;
  chargingHeads: string;
  reimbursementInstructions: string;

  // Shipping Information
  hsCode: string;
  countryOfOrigin: string;
  destination: string;
  incoterms: string;

  // Required Export Documents
  documents: Record<RequiredDocumentKey, DocumentStatus>;

  // Compliance Information
  masterLcOrContract: string;
  beneficiaryBIN: string;
  specialConditions: string;
  additionalClauses: string;
  restrictedClauses: string;

  remarks?: string;
};
