import type { DailySalesEntry, DailyYarnRecord, Yarn } from './types';
import { COST_RATES, getCottonLot, getEstimatedCostStandard, landedCostPerKg } from './masterData';

// Whether finance/interest cost is folded into manufacturing cost or shown as a
// separate informational line — configurable per spec section 8's "Finance/Other
// Cost" note. Kept as a simple module-level toggle for this prototype rather than
// a persisted setting, since there's no backend to persist it to.
export const INCLUDE_FINANCE_COST_IN_MANUFACTURING = false;

export function getWeightedFiberCostPerKg(record: DailyYarnRecord): number {
  return record.cottonBlend.reduce((sum, share) => {
    const lot = getCottonLot(share.cottonLotId);
    return sum + (share.blendPct / 100) * landedCostPerKg(lot);
  }, 0);
}

export type ProcessStage = {
  process: DailyYarnRecord['wastageByProcess'][number]['process'];
  inputPerKgYarn: number;
  wasteQtyPerKgYarn: number;
  outputPerKgYarn: number;
  wasteValuePerKgYarn: number;
  standardPct: number;
  actualPct: number;
  variancePct: number;
};

// Fiber passes through each process in sequence, losing actualPct at each step —
// so the raw-fiber input needed per kg of FINISHED yarn compounds backwards
// through the route. This also gives a genuine per-process waste value, not just
// an aggregate wastage %, satisfying the drill-down requirement.
export function getProcessStages(record: DailyYarnRecord): ProcessStage[] {
  // Walk the route forward assuming 1kg enters Blow Room, track the fraction
  // that survives to become finished yarn, then scale so output = 1kg yarn.
  let survivingFraction = 1;
  const rawStages = record.wastageByProcess.map((w) => {
    const inputFraction = survivingFraction;
    const wasteFraction = inputFraction * w.actualPct;
    survivingFraction = inputFraction - wasteFraction;
    return { w, inputFraction, wasteFraction };
  });

  const scale = survivingFraction > 0 ? 1 / survivingFraction : 0;

  return rawStages.map(({ w, inputFraction, wasteFraction }) => ({
    process: w.process,
    inputPerKgYarn: inputFraction * scale,
    wasteQtyPerKgYarn: wasteFraction * scale,
    outputPerKgYarn: (inputFraction - wasteFraction) * scale,
    wasteValuePerKgYarn: wasteFraction * scale * w.wasteSellingPricePerKg,
    standardPct: w.standardPct,
    actualPct: w.actualPct,
    variancePct: w.actualPct - w.standardPct,
  }));
}

export function getRawMaterialInputPerKgYarn(record: DailyYarnRecord): number {
  const stages = getProcessStages(record);
  return stages.length > 0 ? stages[0].inputPerKgYarn : 1;
}

export function getRawMaterialCostPerKgYarn(record: DailyYarnRecord): number {
  return getWeightedFiberCostPerKg(record) * getRawMaterialInputPerKgYarn(record);
}

export function getWasteRecoveryPerKgYarn(record: DailyYarnRecord): number {
  return getProcessStages(record).reduce((sum, s) => sum + s.wasteValuePerKgYarn, 0);
}

export function getOverallWastagePct(record: DailyYarnRecord): number {
  const input = getRawMaterialInputPerKgYarn(record);
  return input > 0 ? 1 - 1 / input : 0;
}

export type CostBreakdown = {
  rawMaterialPerKg: number;
  electricityPerKg: number;
  laborPerKg: number;
  maintenancePerKg: number;
  depreciationPerKg: number;
  overheadPerKg: number;
  packingPerKg: number;
  financePerKg: number;
  wasteRecoveryPerKg: number;
  totalPerKg: number;
  totalCost: number;
};

export function getCostBreakdown(record: DailyYarnRecord): CostBreakdown {
  const qty = record.actualProductionKg || 1;
  const rawMaterialPerKg = getRawMaterialCostPerKgYarn(record);
  const electricityPerKg = (record.electricityConsumptionKwh * COST_RATES.electricityTariffPerKwh) / qty;
  const laborPerKg = record.laborCostTotal / qty;
  const maintenancePerKg = record.maintenanceCostTotal / qty;
  const depreciationPerKg = record.depreciationCostTotal / qty;
  const overheadPerKg = record.factoryOverheadTotal / qty;
  const packingPerKg = record.packingCostTotal / qty;
  const financePerKg = record.financeCostTotal / qty;
  const wasteRecoveryPerKg = getWasteRecoveryPerKgYarn(record);

  const totalPerKg =
    rawMaterialPerKg +
    electricityPerKg +
    laborPerKg +
    maintenancePerKg +
    depreciationPerKg +
    overheadPerKg +
    packingPerKg +
    (INCLUDE_FINANCE_COST_IN_MANUFACTURING ? financePerKg : 0) -
    wasteRecoveryPerKg;

  return {
    rawMaterialPerKg,
    electricityPerKg,
    laborPerKg,
    maintenancePerKg,
    depreciationPerKg,
    overheadPerKg,
    packingPerKg,
    financePerKg,
    wasteRecoveryPerKg,
    totalPerKg,
    totalCost: totalPerKg * qty,
  };
}

export function getEfficiencyPct(record: DailyYarnRecord): number {
  return record.plannedProductionKg > 0 ? record.actualProductionKg / record.plannedProductionKg : 0;
}

export function getUtilizationPct(record: DailyYarnRecord): number {
  const total = record.machineRunningHours + record.downtimeHours;
  return total > 0 ? record.machineRunningHours / total : 0;
}

export type VarianceLine = { label: string; estimated: number; actual: number; variance: number };

export function getEstimatedVsActual(record: DailyYarnRecord): VarianceLine[] {
  const std = getEstimatedCostStandard(record.yarnId);
  const actual = getCostBreakdown(record);
  const lines: VarianceLine[] = [
    { label: 'Raw Material', estimated: std.rawMaterialPerKg, actual: actual.rawMaterialPerKg, variance: 0 },
    { label: 'Electricity', estimated: std.electricityPerKg, actual: actual.electricityPerKg, variance: 0 },
    { label: 'Labor', estimated: std.laborPerKg, actual: actual.laborPerKg, variance: 0 },
    { label: 'Maintenance', estimated: std.maintenancePerKg, actual: actual.maintenancePerKg, variance: 0 },
    { label: 'Overhead', estimated: std.overheadPerKg, actual: actual.overheadPerKg, variance: 0 },
    { label: 'Packing', estimated: std.packingPerKg, actual: actual.packingPerKg, variance: 0 },
    { label: 'Waste Recovery', estimated: -std.wasteRecoveryPerKg, actual: -actual.wasteRecoveryPerKg, variance: 0 },
  ];
  for (const line of lines) line.variance = line.actual - line.estimated;
  return lines;
}

export function getEstimatedTotalPerKg(yarnId: string): number {
  const std = getEstimatedCostStandard(yarnId);
  return (
    std.rawMaterialPerKg +
    std.electricityPerKg +
    std.laborPerKg +
    std.maintenancePerKg +
    std.overheadPerKg +
    std.packingPerKg -
    std.wasteRecoveryPerKg
  );
}

// --- Sales / revenue -------------------------------------------------------

export function getSalesForDay(sales: DailySalesEntry[], date: string, yarnId?: string): DailySalesEntry[] {
  return sales.filter((s) => s.date === date && (!yarnId || s.yarnId === yarnId));
}

export function getSaleRevenue(sale: DailySalesEntry): number {
  return sale.quantityKg * (sale.sellingPricePerKg - sale.discountPerKg);
}

// --- Weighted-average inventory / COGS ------------------------------------
// Production cost and sales are NOT the same thing: today's produced kg may not
// equal today's sold kg. This ledger tracks opening/closing inventory kg & value
// per yarn (weighted-average method) so COGS is tied to what was actually SOLD,
// not what was produced — see DECISIONS.md for why this distinction matters.

export type InventoryLedgerDay = {
  date: string;
  openingKg: number;
  openingValue: number;
  producedKg: number;
  producedCost: number;
  avgCostPerKgAvailable: number;
  soldKg: number;
  cogs: number;
  closingKg: number;
  closingValue: number;
};

export function buildInventoryLedger(yarnId: string, records: DailyYarnRecord[], sales: DailySalesEntry[]): InventoryLedgerDay[] {
  const yarnRecords = records.filter((r) => r.yarnId === yarnId).sort((a, b) => a.date.localeCompare(b.date));
  const ledger: InventoryLedgerDay[] = [];
  let openingKg = 0;
  let openingValue = 0;

  for (const record of yarnRecords) {
    const producedKg = record.actualProductionKg;
    const producedCost = getCostBreakdown(record).totalCost;
    const availableKg = openingKg + producedKg;
    const availableValue = openingValue + producedCost;
    const avgCostPerKgAvailable = availableKg > 0 ? availableValue / availableKg : 0;

    const soldKg = getSalesForDay(sales, record.date, yarnId).reduce((s, e) => s + e.quantityKg, 0);
    const cogs = Math.min(soldKg, availableKg) * avgCostPerKgAvailable;
    const closingKg = Math.max(0, availableKg - soldKg);
    const closingValue = closingKg * avgCostPerKgAvailable;

    ledger.push({
      date: record.date,
      openingKg,
      openingValue,
      producedKg,
      producedCost,
      avgCostPerKgAvailable,
      soldKg,
      cogs,
      closingKg,
      closingValue,
    });

    openingKg = closingKg;
    openingValue = closingValue;
  }

  return ledger;
}

export function buildAllLedgers(yarns: Yarn[], records: DailyYarnRecord[], sales: DailySalesEntry[]): Record<string, InventoryLedgerDay[]> {
  const out: Record<string, InventoryLedgerDay[]> = {};
  for (const yarn of yarns) out[yarn.id] = buildInventoryLedger(yarn.id, records, sales);
  return out;
}

// --- Daily summary (all yarns) ---------------------------------------------

export type DailySummary = {
  date: string;
  productionKg: number;
  salesKg: number;
  revenue: number;
  productionCost: number;
  cogs: number;
  grossProfit: number;
  profitPerKg: number;
  grossMarginPct: number;
  avgEfficiencyPct: number;
  avgWastagePct: number;
  avgCostPerKg: number;
};

export function getDailySummary(
  date: string,
  records: DailyYarnRecord[],
  sales: DailySalesEntry[],
  ledgersByYarn: Record<string, InventoryLedgerDay[]>
): DailySummary {
  const dayRecords = records.filter((r) => r.date === date);
  const daySales = sales.filter((s) => s.date === date);

  const productionKg = dayRecords.reduce((s, r) => s + r.actualProductionKg, 0);
  const productionCost = dayRecords.reduce((s, r) => s + getCostBreakdown(r).totalCost, 0);
  const salesKg = daySales.reduce((s, e) => s + e.quantityKg, 0);
  const revenue = daySales.reduce((s, e) => s + getSaleRevenue(e), 0);

  let cogs = 0;
  for (const yarnId of Object.keys(ledgersByYarn)) {
    const day = ledgersByYarn[yarnId].find((d) => d.date === date);
    if (day) cogs += day.cogs;
  }

  const grossProfit = revenue - cogs;
  const avgEfficiencyPct = dayRecords.length ? dayRecords.reduce((s, r) => s + getEfficiencyPct(r), 0) / dayRecords.length : 0;
  const avgWastagePct = dayRecords.length ? dayRecords.reduce((s, r) => s + getOverallWastagePct(r), 0) / dayRecords.length : 0;

  return {
    date,
    productionKg,
    salesKg,
    revenue,
    productionCost,
    cogs,
    grossProfit,
    profitPerKg: salesKg > 0 ? grossProfit / salesKg : 0,
    grossMarginPct: revenue > 0 ? grossProfit / revenue : 0,
    avgEfficiencyPct,
    avgWastagePct,
    avgCostPerKg: productionKg > 0 ? productionCost / productionKg : 0,
  };
}

export function getRangeSummary(
  dates: string[],
  records: DailyYarnRecord[],
  sales: DailySalesEntry[],
  ledgersByYarn: Record<string, InventoryLedgerDay[]>
): DailySummary {
  const days = dates.map((d) => getDailySummary(d, records, sales, ledgersByYarn));
  const productionKg = days.reduce((s, d) => s + d.productionKg, 0);
  const salesKg = days.reduce((s, d) => s + d.salesKg, 0);
  const revenue = days.reduce((s, d) => s + d.revenue, 0);
  const productionCost = days.reduce((s, d) => s + d.productionCost, 0);
  const cogs = days.reduce((s, d) => s + d.cogs, 0);
  const grossProfit = revenue - cogs;

  return {
    date: dates[dates.length - 1] ?? '',
    productionKg,
    salesKg,
    revenue,
    productionCost,
    cogs,
    grossProfit,
    profitPerKg: salesKg > 0 ? grossProfit / salesKg : 0,
    grossMarginPct: revenue > 0 ? grossProfit / revenue : 0,
    avgEfficiencyPct: days.length ? days.reduce((s, d) => s + d.avgEfficiencyPct, 0) / days.length : 0,
    avgWastagePct: days.length ? days.reduce((s, d) => s + d.avgWastagePct, 0) / days.length : 0,
    avgCostPerKg: productionKg > 0 ? productionCost / productionKg : 0,
  };
}

// --- Product-wise / customer-wise profitability -----------------------------

export type YarnProfitability = {
  yarnId: string;
  productionKg: number;
  salesKg: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  costPerKg: number;
  sellingPricePerKg: number;
  profitPerKg: number;
  marginPct: number;
  avgWastagePct: number;
  avgEfficiencyPct: number;
};

export function getYarnProfitability(
  yarnId: string,
  dates: string[],
  records: DailyYarnRecord[],
  sales: DailySalesEntry[],
  ledgersByYarn: Record<string, InventoryLedgerDay[]>
): YarnProfitability {
  const yarnRecords = records.filter((r) => r.yarnId === yarnId && dates.includes(r.date));
  const yarnSales = sales.filter((s) => s.yarnId === yarnId && dates.includes(s.date));
  const ledger = (ledgersByYarn[yarnId] ?? []).filter((d) => dates.includes(d.date));

  const productionKg = yarnRecords.reduce((s, r) => s + r.actualProductionKg, 0);
  const productionCost = yarnRecords.reduce((s, r) => s + getCostBreakdown(r).totalCost, 0);
  const salesKg = yarnSales.reduce((s, e) => s + e.quantityKg, 0);
  const revenue = yarnSales.reduce((s, e) => s + getSaleRevenue(e), 0);
  const cogs = ledger.reduce((s, d) => s + d.cogs, 0);
  const grossProfit = revenue - cogs;

  return {
    yarnId,
    productionKg,
    salesKg,
    revenue,
    cogs,
    grossProfit,
    costPerKg: productionKg > 0 ? productionCost / productionKg : 0,
    sellingPricePerKg: salesKg > 0 ? revenue / salesKg : 0,
    profitPerKg: salesKg > 0 ? grossProfit / salesKg : 0,
    marginPct: revenue > 0 ? grossProfit / revenue : 0,
    avgWastagePct: yarnRecords.length ? yarnRecords.reduce((s, r) => s + getOverallWastagePct(r), 0) / yarnRecords.length : 0,
    avgEfficiencyPct: yarnRecords.length ? yarnRecords.reduce((s, r) => s + getEfficiencyPct(r), 0) / yarnRecords.length : 0,
  };
}

export type CustomerProfitability = {
  customerId: string;
  salesKg: number;
  revenue: number;
  avgSellingPricePerKg: number;
  cogs: number;
  grossProfit: number;
  marginPct: number;
};

export function getCustomerProfitability(
  customerId: string,
  dates: string[],
  records: DailyYarnRecord[],
  sales: DailySalesEntry[],
  ledgersByYarn: Record<string, InventoryLedgerDay[]>
): CustomerProfitability {
  const customerSales = sales.filter((s) => s.customerId === customerId && dates.includes(s.date));
  const salesKg = customerSales.reduce((s, e) => s + e.quantityKg, 0);
  const revenue = customerSales.reduce((s, e) => s + getSaleRevenue(e), 0);

  // Allocate COGS proportional to this customer's share of each yarn's units sold
  // on each day, using that day's weighted-average cost for the yarn.
  let cogs = 0;
  for (const sale of customerSales) {
    const ledger = ledgersByYarn[sale.yarnId] ?? [];
    const day = ledger.find((d) => d.date === sale.date);
    if (day) cogs += sale.quantityKg * day.avgCostPerKgAvailable;
  }

  const grossProfit = revenue - cogs;

  return {
    customerId,
    salesKg,
    revenue,
    avgSellingPricePerKg: salesKg > 0 ? revenue / salesKg : 0,
    cogs,
    grossProfit,
    marginPct: revenue > 0 ? grossProfit / revenue : 0,
  };
}

// --- Scenario / what-if -----------------------------------------------------
//
// Deliberately NOT implemented by mutating a DailyYarnRecord and re-running
// getCostBreakdown — that would treat every cost as variable-per-kg, which is
// wrong: labor/maintenance/depreciation/overhead are fixed for the day's run
// (same shift cost regardless of yield), so a drop in efficiency should raise
// their cost/kg by spreading the same total over fewer kg, while raw material
// and packing scale with kg at a constant rate. This function models that
// fixed-vs-variable split explicitly instead.

export type ScenarioInputs = {
  cottonPricePctChange: number; // e.g. 0.05 = +5%
  exchangeRatePctChange: number; // relative change to USD->BDT, e.g. 0.03 = +3%
  electricityTariffPctChange: number;
  wastagePctChangeAbs: number; // absolute pp change to overall wastage, e.g. +0.01 = +1pp
  efficiencyPctChangeAbs: number; // absolute pp change to output volume
  laborCostPctChange: number;
  overheadPctChange: number;
  sellingPricePctChange: number;
};

export const NEUTRAL_SCENARIO: ScenarioInputs = {
  cottonPricePctChange: 0,
  exchangeRatePctChange: 0,
  electricityTariffPctChange: 0,
  wastagePctChangeAbs: 0,
  efficiencyPctChangeAbs: 0,
  laborCostPctChange: 0,
  overheadPctChange: 0,
  sellingPricePctChange: 0,
};

export type ScenarioResult = {
  baselineCostPerKg: number;
  scenarioCostPerKg: number;
  baselineSellingPricePerKg: number;
  scenarioSellingPricePerKg: number;
  baselineProfitPerKg: number;
  scenarioProfitPerKg: number;
  baselineMarginPct: number;
  scenarioMarginPct: number;
};

export function runScenario(record: DailyYarnRecord, currentSellingPricePerKg: number, scenario: ScenarioInputs): ScenarioResult {
  const baseline = getCostBreakdown(record);
  const baseQty = record.actualProductionKg || 1;
  const newQty = baseQty * (1 + scenario.efficiencyPctChangeAbs);

  const usdShare = record.cottonBlend.reduce((s, share) => {
    const lot = getCottonLot(share.cottonLotId);
    return s + (lot.currency === 'USD' ? share.blendPct / 100 : 0);
  }, 0);

  // Wastage change adjusts the raw-fiber input ratio via the same compounding
  // relationship used in getRawMaterialInputPerKgYarn (input = 1 / (1 - wastage)).
  const overallWastage = getOverallWastagePct(record);
  const newOverallWastage = Math.min(0.95, Math.max(0, overallWastage + scenario.wastagePctChangeAbs));
  const wastageMultiplier = (1 - overallWastage) / (1 - newOverallWastage);

  const rawMaterialPerKg =
    baseline.rawMaterialPerKg * (1 + scenario.cottonPricePctChange) * (1 + usdShare * scenario.exchangeRatePctChange) * wastageMultiplier;
  const packingPerKg = baseline.packingPerKg;
  const wasteRecoveryPerKg = baseline.wasteRecoveryPerKg * wastageMultiplier;

  const electricityTotal = baseline.electricityPerKg * baseQty * (1 + scenario.electricityTariffPctChange);
  const laborTotal = baseline.laborPerKg * baseQty * (1 + scenario.laborCostPctChange);
  const maintenanceTotal = baseline.maintenancePerKg * baseQty;
  const depreciationTotal = baseline.depreciationPerKg * baseQty;
  const overheadTotal = baseline.overheadPerKg * baseQty * (1 + scenario.overheadPctChange);

  const electricityPerKg = electricityTotal / newQty;
  const laborPerKg = laborTotal / newQty;
  const maintenancePerKg = maintenanceTotal / newQty;
  const depreciationPerKg = depreciationTotal / newQty;
  const overheadPerKg = overheadTotal / newQty;

  const scenarioCostPerKg =
    rawMaterialPerKg + electricityPerKg + laborPerKg + maintenancePerKg + depreciationPerKg + overheadPerKg + packingPerKg - wasteRecoveryPerKg;

  const scenarioSellingPricePerKg = currentSellingPricePerKg * (1 + scenario.sellingPricePctChange);

  return {
    baselineCostPerKg: baseline.totalPerKg,
    scenarioCostPerKg,
    baselineSellingPricePerKg: currentSellingPricePerKg,
    scenarioSellingPricePerKg,
    baselineProfitPerKg: currentSellingPricePerKg - baseline.totalPerKg,
    scenarioProfitPerKg: scenarioSellingPricePerKg - scenarioCostPerKg,
    baselineMarginPct: currentSellingPricePerKg > 0 ? (currentSellingPricePerKg - baseline.totalPerKg) / currentSellingPricePerKg : 0,
    scenarioMarginPct: scenarioSellingPricePerKg > 0 ? (scenarioSellingPricePerKg - scenarioCostPerKg) / scenarioSellingPricePerKg : 0,
  };
}
