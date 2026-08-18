import { useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { SAMPLE_LCS } from './sampleData';
import { SAMPLE_LOANS } from './sampleLoans';
import { SAMPLE_SCRUTINY_CHECKLISTS } from './lcScrutiny/sampleScrutinyData';
import type { LC, LoanFacility, Module } from './types';
import type { ScrutinyChecklist } from './lcScrutiny/types';
import Login from './components/Login';
import ModuleHub from './components/ModuleHub';
import Sidebar from './components/Sidebar';
import LCTrackingModule from './components/lc/LCTrackingModule';
import LoanManagementModule from './components/loans/LoanManagementModule';
import EmailGeneration from './components/email/EmailGeneration';
import BankChargePrep from './components/charges/BankChargePrep';
import YarnCostingModule from './components/yarnCosting/YarnCostingModule';
import LcScrutinyModule from './components/lcScrutiny/LcScrutinyModule';

const MODULE_TITLES: Record<Module, string> = {
  hub: 'Modules',
  'lc-tracking': 'LC Tracking',
  'email-generation': 'Email Generation',
  'loan-management': 'Loan Management',
  'bank-charges': 'Bank Charge Preparation',
  'yarn-costing': 'Yarn Costing',
  'lc-scrutiny': 'LC Scrutiny',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState<Module>('hub');
  const [lcs, setLcs] = useState<LC[]>(SAMPLE_LCS);
  const [loans, setLoans] = useState<LoanFacility[]>(SAMPLE_LOANS);
  const [scrutinyChecklists, setScrutinyChecklists] = useState<ScrutinyChecklist[]>(SAMPLE_SCRUTINY_CHECKLISTS);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {activeModule !== 'hub' && (
        <Sidebar activeModule={activeModule} onSelect={setActiveModule} onLogout={() => setIsAuthenticated(false)} />
      )}

      <div className="min-w-0 flex-1">
        <header className="no-print border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {activeModule !== 'hub' && (
                <button
                  onClick={() => setActiveModule('hub')}
                  className="flex items-center gap-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Back to modules"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-slate-800">
                  {activeModule === 'hub' ? 'Ahmed Group AI Project' : MODULE_TITLES[activeModule]}
                </h1>
                <p className="text-xs text-slate-500">Accounts &amp; Finance Suite</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">Today</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {activeModule === 'hub' && (
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <LogOut size={15} />
                  Log Out
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="pl-6 pr-2 py-4">
          <div className="mx-auto max-w-[1500px]">
            {activeModule === 'hub' && <ModuleHub onSelect={setActiveModule} />}
            {activeModule === 'lc-tracking' && <LCTrackingModule lcs={lcs} setLcs={setLcs} />}
            {activeModule === 'loan-management' && (
              <LoanManagementModule loans={loans} setLoans={setLoans} lcs={lcs} />
            )}
            {activeModule === 'email-generation' && <EmailGeneration />}
            {activeModule === 'bank-charges' && <BankChargePrep lcs={lcs} />}
            {activeModule === 'yarn-costing' && <YarnCostingModule />}
            {activeModule === 'lc-scrutiny' && (
              <LcScrutinyModule checklists={scrutinyChecklists} setChecklists={setScrutinyChecklists} lcs={lcs} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
