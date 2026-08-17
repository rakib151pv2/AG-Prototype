import { useMemo, useState } from 'react';
import { Bell, LayoutDashboard, Plus, Table2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { LC } from '../../types';
import { UNITS } from '../../sampleData';
import { getStatus } from '../../selectors';
import Dashboard from '../Dashboard';
import Register from '../Register';
import Alerts from '../Alerts';
import CreateLCModal from '../CreateLCModal';

type Tab = 'dashboard' | 'register' | 'alerts';

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'register', label: 'LC Register', icon: Table2 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

export default function LCTrackingModule({
  lcs,
  setLcs,
}: {
  lcs: LC[];
  setLcs: Dispatch<SetStateAction<LC[]>>;
}) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showCreate, setShowCreate] = useState(false);

  const alertCount = lcs.filter((lc) => {
    const s = getStatus(lc);
    return s === 'Overdue' || s === 'Due Soon';
  }).length;

  const responsiblePersons = useMemo(
    () => Array.from(new Set(lcs.map((lc) => lc.responsiblePerson).filter(Boolean))),
    [lcs]
  );

  function handleCreate(newLc: LC) {
    setLcs((prev) => [newLc, ...prev]);
    setShowCreate(false);
    setTab('register');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={15} />
              {label}
              {id === 'alerts' && alertCount > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus size={15} />
          Create L/C
        </button>
      </div>

      {tab === 'dashboard' && <Dashboard lcs={lcs} />}
      {tab === 'register' && <Register lcs={lcs} />}
      {tab === 'alerts' && <Alerts lcs={lcs} />}

      {showCreate && (
        <CreateLCModal
          units={UNITS}
          responsiblePersons={responsiblePersons}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
