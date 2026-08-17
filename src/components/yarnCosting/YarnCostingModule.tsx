import { useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  Calculator,
  ClipboardCheck,
  Database,
  DollarSign,
  Factory,
  FileBarChart,
  LayoutDashboard,
  Recycle,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import type { DailyClosing, DailySalesEntry, DailyYarnRecord, Role } from '../../yarnCosting/types';
import { DAILY_CLOSINGS, DAILY_SALES, DAILY_YARN_RECORDS } from '../../yarnCosting/sampleDailyData';
import DashboardScreen from './DashboardScreen';
import DailyClosingScreen from './DailyClosingScreen';
import YarnCostingScreen from './YarnCostingScreen';
import ProductionScreen from './ProductionScreen';
import RawMaterialScreen from './RawMaterialScreen';
import WastageScreen from './WastageScreen';
import SalesScreen from './SalesScreen';
import EstimatedVsActualScreen from './EstimatedVsActualScreen';
import ProfitabilityScreen from './ProfitabilityScreen';
import MonthlyAnalysisScreen from './MonthlyAnalysisScreen';
import ReportsScreen from './ReportsScreen';
import MasterDataScreen from './MasterDataScreen';
import AlertsScreen from './AlertsScreen';

type Tab =
  | 'dashboard'
  | 'daily-closing'
  | 'yarn-costing'
  | 'production'
  | 'raw-material'
  | 'wastage'
  | 'sales'
  | 'estimated-vs-actual'
  | 'profitability'
  | 'monthly'
  | 'reports'
  | 'master-data'
  | 'alerts';

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'daily-closing', label: 'Daily Closing / Daily Input', icon: ClipboardCheck },
  { id: 'yarn-costing', label: 'Yarn Costing', icon: Calculator },
  { id: 'production', label: 'Production', icon: Factory },
  { id: 'raw-material', label: 'Raw Material / Cotton Cost', icon: Beaker },
  { id: 'wastage', label: 'Wastage & By-products', icon: Recycle },
  { id: 'sales', label: 'Sales & Revenue', icon: ShoppingCart },
  { id: 'estimated-vs-actual', label: 'Estimated vs Actual', icon: TrendingUp },
  { id: 'profitability', label: 'Profitability Analysis', icon: DollarSign },
  { id: 'monthly', label: 'Monthly Analysis', icon: FileBarChart },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'master-data', label: 'Master Data', icon: Database },
  { id: 'alerts', label: 'Alerts & Notifications', icon: AlertTriangle },
];

const ROLES: Role[] = ['Accountant', 'Production Manager', 'Sales', 'Accounts Manager', 'Management'];

export default function YarnCostingModule() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [role, setRole] = useState<Role>('Accountant');
  const [records, setRecords] = useState<DailyYarnRecord[]>(DAILY_YARN_RECORDS);
  const [sales, setSales] = useState<DailySalesEntry[]>(DAILY_SALES);
  const [closings, setClosings] = useState<DailyClosing[]>(DAILY_CLOSINGS);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                tab === id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>
        <div>
          <label className="mr-2 text-xs font-medium text-slate-500">Role</label>
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tab === 'dashboard' && <DashboardScreen records={records} sales={sales} closings={closings} />}
      {tab === 'daily-closing' && (
        <DailyClosingScreen
          records={records}
          setRecords={setRecords}
          sales={sales}
          setSales={setSales}
          closings={closings}
          setClosings={setClosings}
          role={role}
        />
      )}
      {tab === 'yarn-costing' && <YarnCostingScreen records={records} sales={sales} />}
      {tab === 'production' && <ProductionScreen records={records} />}
      {tab === 'raw-material' && <RawMaterialScreen records={records} />}
      {tab === 'wastage' && <WastageScreen records={records} />}
      {tab === 'sales' && <SalesScreen records={records} sales={sales} />}
      {tab === 'estimated-vs-actual' && <EstimatedVsActualScreen records={records} />}
      {tab === 'profitability' && <ProfitabilityScreen records={records} sales={sales} />}
      {tab === 'monthly' && <MonthlyAnalysisScreen records={records} sales={sales} />}
      {tab === 'reports' && <ReportsScreen records={records} sales={sales} />}
      {tab === 'master-data' && <MasterDataScreen />}
      {tab === 'alerts' && <AlertsScreen records={records} sales={sales} closings={closings} />}
    </div>
  );
}
