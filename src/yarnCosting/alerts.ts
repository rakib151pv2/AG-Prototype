import type { Alert, DailyClosing, DailySalesEntry, DailyYarnRecord, Yarn } from './types';
import { getEstimatedCostStandard } from './masterData';
import {
  buildAllLedgers,
  getCostBreakdown,
  getEfficiencyPct,
  getOverallWastagePct,
  getYarnProfitability,
  type InventoryLedgerDay,
} from './calculations';

const COST_INCREASE_ALERT_THRESHOLD = 0.05; // 5%
const MARGIN_TARGET = 0.1; // 10%
const DOWNTIME_ALERT_HOURS = 4;

function latestRecordFor(yarnId: string, records: DailyYarnRecord[]): DailyYarnRecord | undefined {
  return records
    .filter((r) => r.yarnId === yarnId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function previousRecordFor(yarnId: string, records: DailyYarnRecord[], beforeDate: string): DailyYarnRecord | undefined {
  return records
    .filter((r) => r.yarnId === yarnId && r.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function generateAlerts(
  yarns: Yarn[],
  records: DailyYarnRecord[],
  sales: DailySalesEntry[],
  closings: DailyClosing[],
  todayIso: string
): Alert[] {
  const alerts: Alert[] = [];
  const ledgersByYarn = buildAllLedgers(yarns, records, sales);

  for (const yarn of yarns) {
    const latest = latestRecordFor(yarn.id, records);
    if (!latest) continue;
    const std = getEstimatedCostStandard(yarn.id);
    const latestCost = getCostBreakdown(latest);
    const previous = previousRecordFor(yarn.id, records, latest.date);

    // Cost alerts
    if (previous) {
      const prevCost = getCostBreakdown(previous).totalPerKg;
      const changePct = prevCost > 0 ? (latestCost.totalPerKg - prevCost) / prevCost : 0;
      if (changePct > COST_INCREASE_ALERT_THRESHOLD) {
        alerts.push({
          id: `cost-${yarn.id}-${latest.date}`,
          severity: 'critical',
          category: 'Cost',
          date: latest.date,
          message: `${yarn.description} cost increased by ${(changePct * 100).toFixed(1)}% vs the previous day`,
        });
      }
    }
    const estimatedTotal =
      std.rawMaterialPerKg + std.electricityPerKg + std.laborPerKg + std.maintenancePerKg + std.overheadPerKg + std.packingPerKg - std.wasteRecoveryPerKg;
    if (latestCost.totalPerKg > estimatedTotal * (1 + COST_INCREASE_ALERT_THRESHOLD)) {
      alerts.push({
        id: `cost-std-${yarn.id}-${latest.date}`,
        severity: 'warning',
        category: 'Cost',
        date: latest.date,
        message: `${yarn.description} actual cost (BDT ${latestCost.totalPerKg.toFixed(1)}/kg) exceeded the standard (BDT ${estimatedTotal.toFixed(1)}/kg)`,
      });
    }

    // Production alerts
    const efficiency = getEfficiencyPct(latest);
    if (efficiency < std.standardEfficiencyPct) {
      alerts.push({
        id: `eff-${yarn.id}-${latest.date}`,
        severity: efficiency < std.standardEfficiencyPct - 0.05 ? 'critical' : 'warning',
        category: 'Production',
        date: latest.date,
        message: `${yarn.description} efficiency (${(efficiency * 100).toFixed(1)}%) is below the ${(std.standardEfficiencyPct * 100).toFixed(0)}% standard`,
      });
    }
    if (latest.downtimeHours > DOWNTIME_ALERT_HOURS) {
      alerts.push({
        id: `downtime-${yarn.id}-${latest.date}`,
        severity: 'warning',
        category: 'Production',
        date: latest.date,
        message: `${yarn.description} recorded ${latest.downtimeHours.toFixed(1)}h of downtime${latest.downtimeReason ? ` (${latest.downtimeReason})` : ''}`,
      });
    }
    const overallWastage = getOverallWastagePct(latest);
    if (overallWastage > std.standardWastagePct + 0.01) {
      alerts.push({
        id: `wastage-${yarn.id}-${latest.date}`,
        severity: overallWastage > std.standardWastagePct + 0.03 ? 'critical' : 'warning',
        category: 'Production',
        date: latest.date,
        message: `${yarn.description} wastage (${(overallWastage * 100).toFixed(1)}%) exceeded standard (${(std.standardWastagePct * 100).toFixed(1)}%)`,
      });
    }

    // Profit alerts
    const profitability = getYarnProfitability(yarn.id, [latest.date], records, sales, ledgersByYarn);
    if (profitability.salesKg > 0) {
      if (profitability.marginPct < 0) {
        alerts.push({
          id: `loss-${yarn.id}-${latest.date}`,
          severity: 'critical',
          category: 'Profit',
          date: latest.date,
          message: `${yarn.description} is loss-making today (margin ${(profitability.marginPct * 100).toFixed(1)}%)`,
        });
      } else if (profitability.marginPct < MARGIN_TARGET) {
        alerts.push({
          id: `margin-${yarn.id}-${latest.date}`,
          severity: 'warning',
          category: 'Profit',
          date: latest.date,
          message: `${yarn.description} margin (${(profitability.marginPct * 100).toFixed(1)}%) is below the ${(MARGIN_TARGET * 100).toFixed(0)}% target`,
        });
      }
    }
  }

  // Data entry alerts
  const yesterday = new Date(todayIso);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);
  const yesterdayClosing = closings.find((c) => c.date === yesterdayIso);

  if (!yesterdayClosing || yesterdayClosing.status === 'Not Started') {
    alerts.push({
      id: `closing-missing-${yesterdayIso}`,
      severity: 'critical',
      category: 'Data Entry',
      date: yesterdayIso,
      message: `Daily closing for ${yesterdayIso} has not been started`,
    });
  } else if (yesterdayClosing.status === 'Draft') {
    const missing = Object.entries(yesterdayClosing.checklist).filter(([, v]) => !v);
    alerts.push({
      id: `closing-draft-${yesterdayIso}`,
      severity: 'warning',
      category: 'Data Entry',
      date: yesterdayIso,
      message: `Daily closing for ${yesterdayIso} is still in Draft (${missing.length} checklist item${missing.length === 1 ? '' : 's'} pending)`,
    });
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}
