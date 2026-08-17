export type YarnType = 'Carded' | 'Combed';

export type Yarn = {
  id: string;
  yarnCode: string;
  yarnCount: string; // e.g. "30/1"
  yarnType: YarnType;
  description: string; // e.g. "30/1 Carded Yarn"
};

export type CottonLot = {
  id: string;
  lotNumber: string;
  supplier: string;
  origin: string;
  cottonType: string; // grade/staple description
  currency: 'USD' | 'BDT';
  purchasePricePerKg: number; // in `currency`
  exchangeRateToBDT: number; // 1 if currency is already BDT
  freightPerKg: number;
  insurancePerKg: number;
  cnfPerKg: number;
  portChargesPerKg: number;
  customsDutyPerKg: number;
  bankChargesPerKg: number;
  transportPerKg: number;
  otherPerKg: number;
  lcNumber?: string;
  piNumber?: string;
};

export type Customer = {
  id: string;
  name: string;
};

export type ProcessName = 'Blow Room' | 'Carding' | 'Pre-Combing' | 'Combing' | 'Drawing' | 'Simplex' | 'Ring Frame' | 'Winding' | 'Packing';

export type WastageStandard = {
  process: ProcessName;
  yarnType: YarnType | 'Both';
  standardPct: number; // decimal, e.g. 0.025 = 2.5%
};

export type DowntimeReason =
  | 'Machine Breakdown'
  | 'Power Failure'
  | 'Raw Material Shortage'
  | 'Labor Shortage'
  | 'Maintenance'
  | 'Quality Issue'
  | 'Other';

export type CostRates = {
  electricityTariffPerKwh: number; // BDT
  laborRatePerHour: number; // BDT, blended operator+helper
};

// Fixed per-kg cost standard for a yarn — the "before production" estimate
// that actuals are compared against. Set once per yarn, not per day.
export type EstimatedCostStandard = {
  yarnId: string;
  rawMaterialPerKg: number;
  electricityPerKg: number;
  laborPerKg: number;
  maintenancePerKg: number;
  overheadPerKg: number;
  packingPerKg: number;
  wasteRecoveryPerKg: number; // positive number, subtracted in the total
  standardWastagePct: number;
  standardEfficiencyPct: number;
  recommendedSellingPricePerKg: number;
};

export type CottonBlendShare = {
  cottonLotId: string;
  blendPct: number; // 0-100
};

export type WastageProcessActual = {
  process: ProcessName;
  standardPct: number;
  actualPct: number;
  wasteSellingPricePerKg: number; // by-product/waste recovery value
};

export type DailyYarnRecord = {
  id: string;
  date: string; // ISO
  yarnId: string;
  productionOrder: string;

  openingWipKg: number;
  closingWipKg: number;
  plannedProductionKg: number;
  actualProductionKg: number;
  machineRunningHours: number;
  machinesRunning: number;
  machinesTotal: number;
  downtimeHours: number;
  downtimeReason: DowntimeReason | null;

  cottonBlend: CottonBlendShare[];
  wastageByProcess: WastageProcessActual[];

  electricityConsumptionKwh: number;
  laborCostTotal: number;
  maintenanceCostTotal: number;
  depreciationCostTotal: number;
  factoryOverheadTotal: number;
  packingCostTotal: number;
  financeCostTotal: number;
};

export type DailySalesEntry = {
  id: string;
  date: string; // ISO
  yarnId: string;
  customerId: string;
  salesOrder: string;
  quantityKg: number;
  sellingPricePerKg: number; // BDT
  discountPerKg: number;
};

export type DailyClosingStatus = 'Not Started' | 'Draft' | 'Submitted' | 'Approved';

export type DailyClosingChecklist = {
  productionEntered: boolean;
  rawMaterialEntered: boolean;
  wastageEntered: boolean;
  electricityEntered: boolean;
  laborEntered: boolean;
  machineHoursEntered: boolean;
  salesEntered: boolean;
  finishedGoodsChecked: boolean;
  costCalculated: boolean;
  varianceReviewed: boolean;
  managementApproval: boolean;
};

export type DailyClosing = {
  date: string; // ISO, unique key
  status: DailyClosingStatus;
  checklist: DailyClosingChecklist;
  preparedBy?: string;
  preparedAt?: string; // ISO datetime
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
};

export type ExchangeRatePoint = {
  date: string; // ISO
  usdToBdt: number;
};

export type Role = 'Accountant' | 'Production Manager' | 'Sales' | 'Accounts Manager' | 'Management';

export type AlertSeverity = 'critical' | 'warning';
export type AlertCategory = 'Cost' | 'Production' | 'Profit' | 'Data Entry';

export type Alert = {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  date: string; // ISO, the date the alert pertains to
};
