import { useMemo, useState } from 'react';
import { LayoutDashboard, Plus, Table2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { LC, LoanFacility } from '../../types';
import { LOAN_UNITS } from '../../sampleLoans';
import LoanDashboard from './LoanDashboard';
import LoanRegister from './LoanRegister';
import CreateFacilityModal from './CreateFacilityModal';

type Tab = 'dashboard' | 'register';

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'register', label: 'Facility Register', icon: Table2 },
];

export default function LoanManagementModule({
  loans,
  setLoans,
  lcs,
}: {
  loans: LoanFacility[];
  setLoans: Dispatch<SetStateAction<LoanFacility[]>>;
  lcs: LC[];
}) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showCreate, setShowCreate] = useState(false);

  const responsiblePersons = useMemo(
    () => Array.from(new Set(loans.map((l) => l.responsiblePerson).filter(Boolean))),
    [loans]
  );
  const lcNumbers = useMemo(() => lcs.map((lc) => lc.lcNumber), [lcs]);

  function handleCreate(newLoan: LoanFacility) {
    setLoans((prev) => [newLoan, ...prev]);
    setShowCreate(false);
    setTab('register');
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus size={15} />
          Create Facility
        </button>
      </div>

      {tab === 'dashboard' && <LoanDashboard loans={loans} />}
      {tab === 'register' && <LoanRegister loans={loans} />}

      {showCreate && (
        <CreateFacilityModal
          units={LOAN_UNITS}
          lcNumbers={lcNumbers}
          responsiblePersons={responsiblePersons}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
