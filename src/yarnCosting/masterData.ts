import type { CostRates, CottonLot, Customer, EstimatedCostStandard, WastageStandard, Yarn } from './types';

export const YARNS: Yarn[] = [
  { id: 'y-30c', yarnCode: 'Y-30C', yarnCount: '30/1', yarnType: 'Carded', description: '30/1 Carded Yarn' },
  { id: 'y-40c', yarnCode: 'Y-40C', yarnCount: '40/1', yarnType: 'Carded', description: '40/1 Carded Yarn' },
  { id: 'y-30cd', yarnCode: 'Y-30CD', yarnCount: '30/1', yarnType: 'Combed', description: '30/1 Combed Yarn' },
  { id: 'y-40cd', yarnCode: 'Y-40CD', yarnCount: '40/1', yarnType: 'Combed', description: '40/1 Combed Yarn' },
];

// Landed cost per lot = purchase price (converted to BDT) + freight + insurance +
// C&F + port/customs + bank charges + transport + other. Import LC/PI references
// are distinct from the LC Tracking module's export LCs (raw-cotton purchase is an
// import LC, not modeled there — see DECISIONS.md).
export const COTTON_LOTS: CottonLot[] = [
  {
    id: 'lot-usa',
    lotNumber: 'CTN-USA-0417',
    supplier: 'Delta Cotton Exports Inc.',
    origin: 'USA',
    cottonType: 'Memphis Grade 1 1/8"',
    currency: 'USD',
    purchasePricePerKg: 2.05,
    exchangeRateToBDT: 119.5,
    freightPerKg: 8,
    insurancePerKg: 2,
    cnfPerKg: 6,
    portChargesPerKg: 4,
    customsDutyPerKg: 3,
    bankChargesPerKg: 2,
    transportPerKg: 3,
    otherPerKg: 2,
    lcNumber: 'ILC-IMP-2026-0031',
    piNumber: 'PI-CTN-0417',
  },
  {
    id: 'lot-brazil',
    lotNumber: 'CTN-BRZ-0289',
    supplier: 'Amazonia Fibras Ltda.',
    origin: 'Brazil',
    cottonType: 'BRA Type 6',
    currency: 'USD',
    purchasePricePerKg: 1.95,
    exchangeRateToBDT: 119.5,
    freightPerKg: 9,
    insurancePerKg: 2,
    cnfPerKg: 6,
    portChargesPerKg: 4,
    customsDutyPerKg: 3,
    bankChargesPerKg: 2,
    transportPerKg: 3,
    otherPerKg: 2,
    lcNumber: 'ILC-IMP-2026-0028',
    piNumber: 'PI-CTN-0289',
  },
  {
    id: 'lot-australia',
    lotNumber: 'CTN-AUS-0512',
    supplier: 'Outback Fibre Co.',
    origin: 'Australia',
    cottonType: 'AUS SM 1 1/4"',
    currency: 'USD',
    purchasePricePerKg: 2.15,
    exchangeRateToBDT: 119.5,
    freightPerKg: 10,
    insurancePerKg: 2,
    cnfPerKg: 6,
    portChargesPerKg: 4,
    customsDutyPerKg: 3,
    bankChargesPerKg: 2,
    transportPerKg: 3,
    otherPerKg: 2,
    lcNumber: 'ILC-IMP-2026-0035',
    piNumber: 'PI-CTN-0512',
  },
  {
    id: 'lot-uzbek',
    lotNumber: 'CTN-UZB-0163',
    supplier: 'Silk Road Fibre Trading',
    origin: 'Uzbekistan',
    cottonType: 'UZB Grade 2',
    currency: 'USD',
    purchasePricePerKg: 1.75,
    exchangeRateToBDT: 119.5,
    freightPerKg: 7,
    insurancePerKg: 2,
    cnfPerKg: 5,
    portChargesPerKg: 3,
    customsDutyPerKg: 2,
    bankChargesPerKg: 2,
    transportPerKg: 3,
    otherPerKg: 2,
    lcNumber: 'ILC-IMP-2026-0019',
    piNumber: 'PI-CTN-0163',
  },
  {
    id: 'lot-local',
    lotNumber: 'CTN-LOC-0044',
    supplier: 'Bengal Ginning & Trading Ltd.',
    origin: 'Domestic',
    cottonType: 'Local Mixed Grade',
    currency: 'BDT',
    purchasePricePerKg: 195,
    exchangeRateToBDT: 1,
    freightPerKg: 0,
    insurancePerKg: 0,
    cnfPerKg: 0,
    portChargesPerKg: 0,
    customsDutyPerKg: 0,
    bankChargesPerKg: 0,
    transportPerKg: 5,
    otherPerKg: 0,
  },
];

export const CUSTOMERS: Customer[] = [
  { id: 'cust-silver', name: 'Silver Composite Knitting Ltd.' },
  { id: 'cust-delta', name: 'Delta Weaving & Dyeing Ltd.' },
  { id: 'cust-greenland', name: 'Greenland Fabrics Ltd.' },
  { id: 'cust-risingsun', name: 'Rising Sun Knit Composite Ltd.' },
  { id: 'cust-meghna', name: 'Meghna Textile Processing Ltd.' },
];

export const WASTAGE_STANDARDS: WastageStandard[] = [
  { process: 'Blow Room', yarnType: 'Both', standardPct: 0.025 },
  { process: 'Carding', yarnType: 'Both', standardPct: 0.03 },
  { process: 'Pre-Combing', yarnType: 'Combed', standardPct: 0.02 },
  { process: 'Combing', yarnType: 'Combed', standardPct: 0.15 },
  { process: 'Drawing', yarnType: 'Both', standardPct: 0.005 },
  { process: 'Ring Frame', yarnType: 'Both', standardPct: 0.01 },
  { process: 'Winding', yarnType: 'Both', standardPct: 0.005 },
];

export const COST_RATES: CostRates = {
  electricityTariffPerKwh: 9.5,
  laborRatePerHour: 180,
};

// Raw-material and wastage standards below are internally consistent with
// COTTON_LOTS' landed costs and WASTAGE_STANDARDS' per-process rates compounded
// across each yarn's route (see DECISIONS.md) — not independently chosen figures,
// so Estimated vs Actual variance reflects real operational drift, not a data
// mismatch. 30/1 Combed is deliberately left on a thinner margin (~8%) as the
// one "needs attention" yarn, consistent with the rest of the app's pattern of
// always including a real problem case rather than an all-green demo.
export const ESTIMATED_COST_STANDARDS: EstimatedCostStandard[] = [
  {
    yarnId: 'y-30c',
    rawMaterialPerKg: 296,
    electricityPerKg: 12,
    laborPerKg: 8,
    maintenancePerKg: 3,
    overheadPerKg: 6,
    packingPerKg: 3,
    wasteRecoveryPerKg: 3.5,
    standardWastagePct: 0.073,
    standardEfficiencyPct: 0.95,
    recommendedSellingPricePerKg: 365,
  },
  {
    yarnId: 'y-40c',
    rawMaterialPerKg: 282,
    electricityPerKg: 14,
    laborPerKg: 9,
    maintenancePerKg: 3.5,
    overheadPerKg: 6.5,
    packingPerKg: 3,
    wasteRecoveryPerKg: 3.7,
    standardWastagePct: 0.073,
    standardEfficiencyPct: 0.93,
    recommendedSellingPricePerKg: 355,
  },
  {
    yarnId: 'y-30cd',
    rawMaterialPerKg: 359,
    electricityPerKg: 15,
    laborPerKg: 10,
    maintenancePerKg: 4,
    overheadPerKg: 7,
    packingPerKg: 3.2,
    wasteRecoveryPerKg: 17,
    standardWastagePct: 0.228,
    standardEfficiencyPct: 0.92,
    recommendedSellingPricePerKg: 410,
  },
  {
    yarnId: 'y-40cd',
    rawMaterialPerKg: 363,
    electricityPerKg: 17,
    laborPerKg: 11,
    maintenancePerKg: 4.5,
    overheadPerKg: 7.5,
    packingPerKg: 3.2,
    wasteRecoveryPerKg: 17.5,
    standardWastagePct: 0.228,
    standardEfficiencyPct: 0.9,
    recommendedSellingPricePerKg: 440,
  },
];

export function getYarn(yarnId: string): Yarn {
  const yarn = YARNS.find((y) => y.id === yarnId);
  if (!yarn) throw new Error(`Unknown yarn: ${yarnId}`);
  return yarn;
}

export function getCottonLot(lotId: string): CottonLot {
  const lot = COTTON_LOTS.find((l) => l.id === lotId);
  if (!lot) throw new Error(`Unknown cotton lot: ${lotId}`);
  return lot;
}

export function getCustomer(customerId: string): Customer {
  const customer = CUSTOMERS.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Unknown customer: ${customerId}`);
  return customer;
}

export function getEstimatedCostStandard(yarnId: string): EstimatedCostStandard {
  const std = ESTIMATED_COST_STANDARDS.find((s) => s.yarnId === yarnId);
  if (!std) throw new Error(`No estimated cost standard for yarn: ${yarnId}`);
  return std;
}

export function landedCostPerKg(lot: CottonLot): number {
  const baseBDT = lot.currency === 'USD' ? lot.purchasePricePerKg * lot.exchangeRateToBDT : lot.purchasePricePerKg;
  return (
    baseBDT +
    lot.freightPerKg +
    lot.insurancePerKg +
    lot.cnfPerKg +
    lot.portChargesPerKg +
    lot.customsDutyPerKg +
    lot.bankChargesPerKg +
    lot.transportPerKg +
    lot.otherPerKg
  );
}

export function wastageStandardFor(process: WastageStandard['process'], yarnType: 'Carded' | 'Combed'): number {
  const std = WASTAGE_STANDARDS.find((w) => w.process === process && (w.yarnType === 'Both' || w.yarnType === yarnType));
  return std?.standardPct ?? 0;
}

export function processRouteFor(yarnType: 'Carded' | 'Combed'): WastageStandard['process'][] {
  return yarnType === 'Combed'
    ? ['Blow Room', 'Carding', 'Pre-Combing', 'Combing', 'Drawing', 'Ring Frame', 'Winding']
    : ['Blow Room', 'Carding', 'Drawing', 'Ring Frame', 'Winding'];
}
