import type {
  CottonBlendShare,
  DailyClosing,
  DailySalesEntry,
  DailyYarnRecord,
  DowntimeReason,
  ExchangeRatePoint,
  ProcessName,
  WastageProcessActual,
} from './types';
import { CUSTOMERS, ESTIMATED_COST_STANDARDS, getEstimatedCostStandard, processRouteFor, wastageStandardFor, YARNS } from './masterData';
import { createRng, rngRange, wobble } from './rng';
import { iso } from '../dateUtil';

export const HISTORY_DAYS = 45;

export const STAFF = {
  accountant: 'Nasrin Akter',
  productionManager: 'Shafiul Islam',
  accountsManager: 'Md. Anisur Rahman',
  salesExecutive: 'Farhana Akter',
  management: 'Tanvir Ahmed',
};

// Fixed blend recipe per yarn — blend % is a recipe property, not a daily
// variable, so it stays constant across the whole history (only consumed
// quantity varies day to day). Matches the spec's own example blend exactly
// for 30/1 Carded (USA 40 / Brazil 35 / Australia 25).
const BLEND_RECIPES: Record<string, CottonBlendShare[]> = {
  'y-30c': [
    { cottonLotId: 'lot-usa', blendPct: 40 },
    { cottonLotId: 'lot-brazil', blendPct: 35 },
    { cottonLotId: 'lot-australia', blendPct: 25 },
  ],
  'y-40c': [
    { cottonLotId: 'lot-usa', blendPct: 45 },
    { cottonLotId: 'lot-brazil', blendPct: 30 },
    { cottonLotId: 'lot-uzbek', blendPct: 25 },
  ],
  'y-30cd': [
    { cottonLotId: 'lot-usa', blendPct: 55 },
    { cottonLotId: 'lot-australia', blendPct: 30 },
    { cottonLotId: 'lot-brazil', blendPct: 15 },
  ],
  'y-40cd': [
    { cottonLotId: 'lot-usa', blendPct: 60 },
    { cottonLotId: 'lot-australia', blendPct: 40 },
  ],
};

const BASE_PLANNED_KG: Record<string, number> = {
  'y-30c': 10000,
  'y-40c': 8000,
  'y-30cd': 7000,
  'y-40cd': 6000,
};

const WASTE_RECOVERY_PRICE: Record<ProcessName, number> = {
  'Blow Room': 8,
  Carding: 12,
  'Pre-Combing': 15,
  Combing: 75, // comber noil has real resale value
  Drawing: 5,
  Simplex: 5,
  'Ring Frame': 5,
  Winding: 3,
  Packing: 0,
};

const DOWNTIME_REASONS: DowntimeReason[] = [
  'Machine Breakdown',
  'Power Failure',
  'Raw Material Shortage',
  'Labor Shortage',
  'Maintenance',
  'Quality Issue',
  'Other',
];

function offsetToIso(offset: number): string {
  return iso(offset);
}

function buildWastageForDay(rng: () => number, yarnType: 'Carded' | 'Combed', spike?: ProcessName): WastageProcessActual[] {
  return processRouteFor(yarnType).map((process) => {
    const standardPct = wastageStandardFor(process, yarnType);
    let actualPct = wobble(rng, standardPct, 0.15);
    if (spike === process) actualPct = standardPct + rngRange(rng, 0.012, 0.02);
    return { process, standardPct, actualPct: Math.max(0.001, actualPct), wasteSellingPricePerKg: WASTE_RECOVERY_PRICE[process] };
  });
}

function buildExchangeRateHistory(): ExchangeRatePoint[] {
  const rng = createRng(4242);
  const points: ExchangeRatePoint[] = [];
  for (let offset = -HISTORY_DAYS; offset <= -1; offset++) {
    const progress = (offset + HISTORY_DAYS) / HISTORY_DAYS; // 0 (oldest) -> 1 (yesterday)
    const trend = 116.0 + progress * 3.5; // drifts from ~116.0 up to ~119.5
    points.push({ date: offsetToIso(offset), usdToBdt: Number(wobble(rng, trend, 0.004).toFixed(2)) });
  }
  return points;
}

export const EXCHANGE_RATE_HISTORY: ExchangeRatePoint[] = buildExchangeRateHistory();

function exchangeRateOn(date: string): number {
  return EXCHANGE_RATE_HISTORY.find((p) => p.date === date)?.usdToBdt ?? 119.5;
}

function buildDailyData(): { records: DailyYarnRecord[]; sales: DailySalesEntry[]; closings: DailyClosing[] } {
  const rng = createRng(20260817);
  const records: DailyYarnRecord[] = [];
  const sales: DailySalesEntry[] = [];
  const closings: DailyClosing[] = [];

  for (let offset = -HISTORY_DAYS; offset <= -1; offset++) {
    const date = offsetToIso(offset);
    const isYesterday = offset === -1;
    const dayIndex = offset + HISTORY_DAYS; // 0-based, increases toward "yesterday"

    for (const yarn of YARNS) {
      const std = getEstimatedCostStandard(yarn.id);
      const basePlanned = BASE_PLANNED_KG[yarn.id];
      // Gentle upward demand trend plus daily noise, so charts show real movement.
      const trendFactor = 1 + (dayIndex / HISTORY_DAYS) * 0.06;
      const plannedProductionKg = Math.round(wobble(rng, basePlanned * trendFactor, 0.04));

      const isBadEfficiencyDay = isYesterday && yarn.id === 'y-30cd';
      const efficiency = isBadEfficiencyDay
        ? std.standardEfficiencyPct - rngRange(rng, 0.05, 0.08)
        : wobble(rng, std.standardEfficiencyPct, 0.035);
      const actualProductionKg = Math.round(plannedProductionKg * Math.max(0.6, Math.min(1.02, efficiency)));

      const machinesTotal = 8;
      const downtimeSpike = isYesterday && yarn.id === 'y-30cd';
      const downtimeHours = downtimeSpike ? rngRange(rng, 5, 6.5) : Math.max(0, wobble(rng, 2, 0.5));
      const machineRunningHours = Math.max(10, 22 - downtimeHours);
      const machinesRunning = downtimeHours > 4 ? machinesTotal - 2 : downtimeHours > 2 ? machinesTotal - 1 : machinesTotal;
      const downtimeReason: DowntimeReason | null =
        downtimeHours > 2 ? (downtimeSpike ? 'Machine Breakdown' : DOWNTIME_REASONS[Math.floor(rng() * DOWNTIME_REASONS.length)]) : null;

      const wastageSpike: ProcessName | undefined = isYesterday && yarn.id === 'y-40cd' ? 'Combing' : undefined;
      const wastageByProcess = buildWastageForDay(rng, yarn.yarnType, wastageSpike);

      const electricityPerKgBase = yarn.yarnType === 'Combed' ? 1.25 : 1.0;
      const electricityConsumptionKwh = Math.round(wobble(rng, actualProductionKg * electricityPerKgBase, 0.05));
      const laborCostTotal = Math.round(machineRunningHours * 180 * 6 * wobble(rng, 1, 0.03));
      const maintenanceCostTotal = Math.round(wobble(rng, std.maintenancePerKg * basePlanned, 0.2));
      const depreciationCostTotal = Math.round(std.maintenancePerKg * basePlanned * 0.6);
      const factoryOverheadTotal = Math.round(wobble(rng, std.overheadPerKg * basePlanned, 0.08));
      const packingCostTotal = Math.round(wobble(rng, std.packingPerKg * actualProductionKg, 0.03));
      const financeCostTotal = Math.round(wobble(rng, basePlanned * 0.9, 0.1));

      records.push({
        id: `dyr-${yarn.id}-${date}`,
        date,
        yarnId: yarn.id,
        productionOrder: `PO-${yarn.yarnCode}-${date.replace(/-/g, '')}`,
        openingWipKg: Math.round(wobble(rng, 500, 0.2)),
        closingWipKg: Math.round(wobble(rng, 500, 0.2)),
        plannedProductionKg,
        actualProductionKg,
        machineRunningHours: Number(machineRunningHours.toFixed(1)),
        machinesRunning,
        machinesTotal,
        downtimeHours: Number(downtimeHours.toFixed(1)),
        downtimeReason,
        cottonBlend: BLEND_RECIPES[yarn.id],
        wastageByProcess,
        electricityConsumptionKwh,
        laborCostTotal,
        maintenanceCostTotal,
        depreciationCostTotal,
        factoryOverheadTotal,
        packingCostTotal,
        financeCostTotal,
      });

      // Sales: skip entirely for yesterday (the accountant hasn't entered them
      // yet) so the Daily Closing checklist has a genuine pending item.
      if (!isYesterday) {
        const sellPriceBase = std.recommendedSellingPricePerKg;
        let remainingKg = Math.round(actualProductionKg * rngRange(rng, 0.82, 0.95));
        const numOrders = 1 + Math.floor(rng() * 2);
        for (let i = 0; i < numOrders && remainingKg > 0; i++) {
          const qty = i === numOrders - 1 ? remainingKg : Math.round(remainingKg * rngRange(rng, 0.4, 0.7));
          remainingKg -= qty;
          const customer = CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)];
          sales.push({
            id: `sale-${yarn.id}-${date}-${i}`,
            date,
            yarnId: yarn.id,
            customerId: customer.id,
            salesOrder: `SO-${yarn.yarnCode}-${date.replace(/-/g, '')}-${i + 1}`,
            quantityKg: qty,
            sellingPricePerKg: Number(wobble(rng, sellPriceBase, 0.035).toFixed(2)),
            discountPerKg: rng() < 0.15 ? Number(rngRange(rng, 1, 4).toFixed(2)) : 0,
          });
        }
      }
    }

    if (isYesterday) {
      closings.push({
        date,
        status: 'Draft',
        checklist: {
          productionEntered: true,
          rawMaterialEntered: true,
          wastageEntered: true,
          electricityEntered: true,
          laborEntered: true,
          machineHoursEntered: true,
          salesEntered: false,
          finishedGoodsChecked: false,
          costCalculated: false,
          varianceReviewed: false,
          managementApproval: false,
        },
        preparedBy: STAFF.accountant,
        preparedAt: `${date}T08:10:00`,
      });
    } else {
      const preparedAt = offsetToIso(offset + 1);
      closings.push({
        date,
        status: 'Approved',
        checklist: {
          productionEntered: true,
          rawMaterialEntered: true,
          wastageEntered: true,
          electricityEntered: true,
          laborEntered: true,
          machineHoursEntered: true,
          salesEntered: true,
          finishedGoodsChecked: true,
          costCalculated: true,
          varianceReviewed: true,
          managementApproval: true,
        },
        preparedBy: STAFF.accountant,
        preparedAt: `${preparedAt}T08:15:00`,
        reviewedBy: STAFF.productionManager,
        reviewedAt: `${preparedAt}T09:30:00`,
        approvedBy: STAFF.accountsManager,
        approvedAt: `${preparedAt}T11:00:00`,
      });
    }
  }

  return { records, sales, closings };
}

const generated = buildDailyData();
export const DAILY_YARN_RECORDS: DailyYarnRecord[] = generated.records;
export const DAILY_SALES: DailySalesEntry[] = generated.sales;
export const DAILY_CLOSINGS: DailyClosing[] = generated.closings;

export function allHistoryDates(): string[] {
  const dates = new Set(DAILY_YARN_RECORDS.map((r) => r.date));
  return Array.from(dates).sort();
}

export function yesterdayIso(): string {
  return iso(-1);
}

export { exchangeRateOn };
export { ESTIMATED_COST_STANDARDS };
