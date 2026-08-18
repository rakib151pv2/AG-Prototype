import { useState } from 'react';
import { AlertTriangle, LayoutDashboard, Plus, Table2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { LC } from '../../types';
import type { ScrutinyChecklist } from '../../lcScrutiny/types';
import ScrutinyDashboard from './ScrutinyDashboard';
import ScrutinyRegister from './ScrutinyRegister';
import ScrutinyAlerts from './ScrutinyAlerts';
import CreateScrutinyModal from './CreateScrutinyModal';

type Tab = 'dashboard' | 'register' | 'alerts';

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'register', label: 'Scrutiny Register', icon: Table2 },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
];

export default function LcScrutinyModule({
  checklists,
  setChecklists,
  lcs,
}: {
  checklists: ScrutinyChecklist[];
  setChecklists: Dispatch<SetStateAction<ScrutinyChecklist[]>>;
  lcs: LC[];
}) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(checklist: ScrutinyChecklist) {
    setChecklists((prev) => [checklist, ...prev]);
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
          New Scrutiny
        </button>
      </div>

      {tab === 'dashboard' && <ScrutinyDashboard checklists={checklists} />}
      {tab === 'register' && <ScrutinyRegister checklists={checklists} />}
      {tab === 'alerts' && <ScrutinyAlerts checklists={checklists} />}

      {showCreate && <CreateScrutinyModal lcs={lcs} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
